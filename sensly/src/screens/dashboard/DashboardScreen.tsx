/**
 * Dashboard screen — Home tab.
 * Shows live sensor readings (sound + motion), risk score, and axolotl mood.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, Image,
} from 'react-native';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import kelpBg from '../../../assets/kelp-bg.png';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAudioMeter } from '../../hooks/useAudioMeter';
import { useMotionSensor } from '../../hooks/useMotionSensor';
import { computeRiskScore, riskToMood, riskToLevel, dbToLabel } from '../../lib/sensoryUtils';
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { AppRootParamList } from '../../navigation/types';

// ─── Sensor sparkline (step chart) ───────────────────────────────────────────
function SparkLine({ data, color, width = 110, height = 36 }: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const segW = width / data.length;

  const points = data.map((p, i) => ({
    x: i * segW,
    y: height - ((p - min) / range) * (height - 4) - 2,
  }));

  // Simple SVG-free approximation using View bars
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', width, height, gap: 2 }}>
      {data.map((p, i) => {
        const barH = Math.max(3, ((p - min) / range) * (height - 4) + 2);
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: barH,
              backgroundColor: color,
              borderRadius: 2,
              opacity: 0.75 + (i / data.length) * 0.25,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Sensor card ─────────────────────────────────────────────────────────────
function SensorCard({ title, value, unit, label, data, color }: {
  title: string; value: number | string; unit: string;
  label: string; data: number[]; color: string;
}) {
  return (
    <View style={[styles.card, styles.sensorCard]}>
      <Text style={[styles.cardMono, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.sensorValue, { color: colors.textPrimary }]}>
        {value}<Text style={styles.sensorUnit}> {unit}</Text>
      </Text>
      <SparkLine data={data} color={color} />
      <Text style={[styles.cardMono, { color, marginTop: 4 }]}>{label}</Text>
    </View>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const { db, isListening, start: startMic, stop: stopMic } = useAudioMeter();
  const { motionLevel, isAvailable: motionAvailable } = useMotionSensor();

  // Passive mic monitoring — start on mount, stop on unmount
  useEffect(() => {
    startMic();
    return () => { stopMic(); };
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>sensly</Text>
            <Text style={styles.tagline}>Sensory insights, simply</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ProfileEdit')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Sensor cards */}
        <View style={styles.sensorGrid}>
          <SensorCard
            title="SOUND"
            value={db}
            unit="dB"
            label={soundLabel}
            data={soundHistory.current}
            color="#3AACB2"
          />
          <SensorCard
            title="MOTION"
            value={motionAvailable ? motionLevel : '--'}
            unit="%"
            label={motionAvailable ? motionLabel : 'unavailable'}
            data={motionHistory.current}
            color="#FF8A8A"
          />
        </View>

        {/* Current sense card */}
        <View style={styles.card}>
          <Text style={[styles.cardMono, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            CURRENT SENSE
          </Text>
          <View style={styles.senseRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.senseMessage}>{level.message}</Text>
              <View style={[styles.riskBadge, { backgroundColor: level.color + '22', borderColor: level.color }]}>
                <Text style={[styles.riskLabel, { color: level.color }]}>{level.label}</Text>
              </View>
              <Text style={[styles.riskScore, { color: level.color }]}>
                Risk: {risk}
              </Text>
            </View>
            {/* Axolotl mascot */}
            <AxolotlSvg mood={mood} size={100} animate />
          </View>
        </View>

        {/* Insight / action card */}
        <View style={styles.card}>
          <View style={styles.insightRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardMono, { color: colors.primary, marginBottom: spacing.xs }]}>
                Insight ✦
              </Text>
              <Text style={styles.insightText}>
                {db > 0
                  ? `${dbToLabel(db)} environment — ${soundLabel} noise, ${motionLabel} movement.`
                  : 'Noise, motion, and light combine into your stress risk score.'}
              </Text>
            </View>
            {risk >= 70 && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => navigation.navigate('Calm')}
                accessibilityRole="button"
                accessibilityLabel="Start calm reset"
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Kelp background scene */}
        <View style={styles.kelpContainer}>
          <Image source={kelpBg} style={styles.kelpImage} resizeMode="cover" />
          <View style={styles.kelpOverlay}>
            <View style={styles.kelpBadge}>
              <Text style={styles.kelpBadgeText}>Sensly is monitoring ✦</Text>
              <Text style={styles.kelpBadgeSub}>Stay calm, we've got you</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  senseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  senseMessage: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.xs,
  },
  riskLabel: { ...typography.bodySm, fontWeight: '600' },
  riskScore: { ...typography.bodySm, fontWeight: '700' },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  insightText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  resetButton: {
    backgroundColor: '#F46F61',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexShrink: 0,
  },
  resetButtonText: {
    ...typography.label,
    color: '#fff',
    fontSize: 14,
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
  kelpOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(216,240,250,0.5)',
  },
  kelpBadge: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(35,88,105,0.2)',
  },
  kelpBadgeText: { ...typography.bodySm, color: colors.textPrimary, fontWeight: '600' },
  kelpBadgeSub: { ...typography.bodySm, color: colors.textSecondary, fontSize: 10 },
});
