/**
 * Dashboard screen — Home tab.
 * Shows live sensor readings (sound + motion), risk score, and axolotl mood.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, Image,
} from 'react-native';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import { KelpBackground } from '../../components/shared/KelpBackground';
import kelpBg from '../../../assets/kelp-bg.png';

// @ts-ignore
const soundBg = require('../../../assets/soundComponent.png');
// @ts-ignore
const motionBg = require('../../../assets/motionComponent.png');
// @ts-ignore
const lightBg = require('../../../assets/lightComponent.png');
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAudioMeter } from '../../hooks/useAudioMeter';
import { useMotionSensor } from '../../hooks/useMotionSensor';
import { useVenueStore } from '../../stores/venueStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { computeRiskScore, riskToMood, riskToLevel, dbToLabel } from '../../lib/sensoryUtils';
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { AppRootParamList } from '../../navigation/types';
import { ScaledText } from '../../components/shared/ScaledText';

// ─── Sensor sparkline (step chart) ───────────────────────────────────────────
function SparkLine({ data, color, width = 110, height = 36 }: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  // For flat data (all same value), show bars at ~60% height instead of tiny
  const isFlat = max === min;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', width, height, gap: 2 }}>
      {data.map((p, i) => {
        const barH = isFlat
          ? height * 0.4 + Math.sin(i * 0.8) * height * 0.15 // gentle wave for flat data
          : Math.max(3, ((p - min) / range) * (height - 4) + 2);
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: Math.max(3, barH),
              backgroundColor: color,
              borderRadius: 2,
              opacity: 0.6 + (i / data.length) * 0.4,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Sensor card ─────────────────────────────────────────────────────────────
function SensorCard({ title, value, unit, label, data, color, onPress, bgImage }: {
  title: string; value: number | string; unit: string;
  label: string; data: number[]; color: string; onPress?: () => void;
  bgImage?: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, styles.sensorCard]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value} ${unit}, ${label}. Tap for details.`}
    >
      {/* Background icon image — centered, fills card height */}
      {bgImage && (
        <Image
          source={bgImage}
          style={styles.sensorCardBg}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}
      <ScaledText style={[styles.cardMono, { color: colors.textSecondary }]}>{title}</ScaledText>
      <ScaledText style={[styles.sensorValue, { color: colors.textPrimary }]}>
        {value}<ScaledText style={styles.sensorUnit}> {unit}</ScaledText>
      </ScaledText>
      <SparkLine data={data} color={color} />
      <ScaledText style={[styles.cardMono, { color, marginTop: 4 }]}>{label}</ScaledText>
    </TouchableOpacity>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const { db, isListening, start: startMic, stop: stopMic } = useAudioMeter();
  const { motionLevel, isAvailable: motionAvailable } = useMotionSensor();

  // Passive mic monitoring — start when screen is focused, stop when blurred
  // This prevents "only one recording" error when navigating to AutoSense
  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      startMic();
    });
    const unsubBlur = navigation.addListener('blur', () => {
      stopMic();
    });
    return () => {
      unsubFocus();
      unsubBlur();
      stopMic();
    };
  }, [navigation]);

  // Rolling history for sparklines (last 12 readings)
  const soundHistory = useRef<number[]>(Array(12).fill(40));
  const motionHistory = useRef<number[]>(Array(12).fill(15));

  useEffect(() => {
    soundHistory.current = [...soundHistory.current.slice(1), db];
  }, [db]);

  useEffect(() => {
    motionHistory.current = [...motionHistory.current.slice(1), motionLevel];
  }, [motionLevel]);

  const risk = computeRiskScore(db, motionLevel);
  const mood = riskToMood(risk);
  const level = riskToLevel(risk);

  const soundLabel = db > 75 ? 'loud' : db > 55 ? 'moderate' : 'quiet';
  const motionLabel = motionLevel > 55 ? 'active' : 'steady';

  // Light — use crowdsourced avg_lighting from nearest venue if available,
  // otherwise estimate from time of day (outdoor ambient)
  const { nearbyVenues } = useVenueStore();
  const { position } = useGeolocation();

  const getNearestVenueLight = (): number | null => {
    if (!position || nearbyVenues.length === 0) return null;
    // Find closest venue with lighting data
    let closest: { dist: number; lighting: number } | null = null;
    for (const v of nearbyVenues) {
      if (v.avg_lighting == null) continue;
      const dLat = position.lat - v.lat;
      const dLng = position.lng - v.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // rough km
      if (dist < 0.2 && (!closest || dist < closest.dist)) {
        // Convert 1-5 scale to approximate lux: 1=30, 2=100, 3=250, 4=400, 5=600
        const luxMap = [0, 30, 100, 250, 400, 600];
        closest = { dist, lighting: luxMap[Math.round(v.avg_lighting)] ?? 250 };
      }
    }
    return closest?.lighting ?? null;
  };

  const venueLight = getNearestVenueLight();
  const hour = new Date().getHours();
  const outdoorEstimate = hour >= 6 && hour < 9 ? 200
    : hour >= 9 && hour < 17 ? 450
    : hour >= 17 && hour < 20 ? 150
    : 30;
  const lightEstimate = venueLight ?? outdoorEstimate;
  const lightLabel = venueLight
    ? (lightEstimate > 300 ? 'bright (reported)' : lightEstimate > 100 ? 'ambient (reported)' : 'dim (reported)')
    : (lightEstimate > 300 ? 'bright' : lightEstimate > 100 ? 'ambient' : 'dim');
  const lightHistory = useRef<number[]>(Array(12).fill(lightEstimate));

  // Temperature — real weather data from Open-Meteo (free, no API key)
  // Falls back to indoor estimate if near an indoor venue
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);

  useEffect(() => {
    if (!position) return;
    // Open-Meteo free API — no key needed
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${position.lat}&longitude=${position.lng}&current=temperature_2m&temperature_unit=fahrenheit`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data?.current?.temperature_2m != null) {
          setWeatherTemp(Math.round(data.current.temperature_2m));
        }
      })
      .catch(() => {}); // Silently fail — use fallback
  }, [position?.lat, position?.lng]);

  const getNearestVenueTemp = (): number | null => {
    if (!position || nearbyVenues.length === 0) return null;
    for (const v of nearbyVenues) {
      const dLat = position.lat - v.lat;
      const dLng = position.lng - v.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
      if (dist < 0.2) {
        if (v.category === 'park' || v.category === 'street') return null;
        return 70; // indoor default
      }
    }
    return null;
  };

  const venueTemp = getNearestVenueTemp();
  const tempEstimate = venueTemp ?? weatherTemp ?? 65; // venue → weather API → fallback
  const isIndoor = venueTemp !== null;
  const tempLabel = isIndoor ? 'indoor' : (weatherTemp != null ? 'live' : 'outside');
  const tempHistory = useRef<number[]>(Array(12).fill(tempEstimate));

  const navigateToSense = () => {
    navigation.navigate('CurrentSense' as any, {
      risk,
      mood,
      label: level.label,
      message: level.message,
      levelColor: level.color,
      soundLabel,
      motionLabel,
      db,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KelpBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ScaledText style={styles.wordmark}>sensly</ScaledText>
            <ScaledText style={styles.tagline}>Sensory insights, simply</ScaledText>
          </View>
        </View>

        {/* Sensor cards — tap to see Current Sense */}
        <View style={styles.sensorGrid}>
          <SensorCard
            title="SOUND"
            value={db}
            unit="dB"
            label={soundLabel}
            data={soundHistory.current}
            color="#3AACB2"
            onPress={navigateToSense}
          />
          <SensorCard
            title="MOTION"
            value={motionAvailable ? motionLevel : '--'}
            unit="%"
            label={motionAvailable ? motionLabel : 'unavailable'}
            data={motionHistory.current}
            color="#6BA3C7"
            onPress={navigateToSense}
          />
        </View>

        {/* Light + Temperature cards — second row */}
        <View style={styles.sensorGrid}>
          <SensorCard
            title="LIGHT"
            value={lightEstimate}
            unit="lux"
            label={lightLabel}
            data={lightHistory.current}
            color="#D4C98A"
            onPress={navigateToSense}
          />
          <SensorCard
            title="TEMP"
            value={tempEstimate}
            unit="°F"
            label={tempLabel}
            data={tempHistory.current}
            color="#8BC5A3"
            onPress={navigateToSense}
          />
        </View>

        {/* Quick status card — tap to see full Current Sense */}
        <TouchableOpacity
          style={styles.card}
          onPress={navigateToSense}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="View current sense details"
        >
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <View style={[styles.riskBadge, { backgroundColor: level.color + '22', borderColor: level.color }]}>
                <ScaledText style={[styles.riskLabel, { color: level.color }]}>{level.label}</ScaledText>
              </View>
              <ScaledText style={styles.statusMessage}>{level.message}</ScaledText>
            </View>
            <AxolotlSvg mood={mood} size={80} animate />
          </View>
          <ScaledText style={styles.tapHint}>Tap for details →</ScaledText>
        </TouchableOpacity>
      </ScrollView>
      </KelpBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Frosted glass card — designer's exact spec
  card: {
    ...frostedCard,
    padding: spacing.md,
  },
  sensorGrid: { flexDirection: 'row', gap: spacing.sm },
  sensorCard: { flex: 1, gap: spacing.xs },
  cardMono: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sensorValue: {
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 32,
  },
  sensorUnit: { fontSize: 14, fontWeight: '400' },
  riskBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  riskLabel: { ...typography.bodySm, fontWeight: '600' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusMessage: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  tapHint: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  // Kelp background image container
  kelpContainer: {
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(35,88,105,0.2)',
  },
  kelpImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
