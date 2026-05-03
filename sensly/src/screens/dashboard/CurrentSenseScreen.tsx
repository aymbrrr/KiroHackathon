/**
 * Current Sense screen — shows risk level, axolotl mood, and kelp scene.
 * Navigated to from Dashboard by tapping a sensor card.
 */
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import kelpBg from '../../../assets/kelp-bg.png';
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { AppRootParamList } from '../../navigation/types';

type RouteParams = {
  CurrentSense: {
    risk: number;
    mood: string;
    label: string;
    message: string;
    levelColor: string;
    soundLabel: string;
    motionLabel: string;
    db: number;
  };
};

export function CurrentSenseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'CurrentSense'>>();
  const { risk, mood, label, message, levelColor, soundLabel, motionLabel, db } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Axolotl — large and centered */}
        <View style={styles.axolotlContainer}>
          <AxolotlSvg mood={mood as any} size={180} animate />
        </View>

        {/* Current sense card */}
        <View style={styles.card}>
          <Text style={styles.cardMono}>CURRENT SENSE</Text>
          <Text style={styles.senseMessage}>{message}</Text>
          <View style={[styles.riskBadge, { backgroundColor: levelColor + '22', borderColor: levelColor }]}>
            <Text style={[styles.riskLabel, { color: levelColor }]}>{label}</Text>
          </View>
          <Text style={[styles.riskScore, { color: levelColor }]}>Risk: {risk}</Text>
          <View style={styles.sensorSummary}>
            <Text style={styles.sensorSummaryText}>🔊 {soundLabel}  ·  🏃 {motionLabel}</Text>
          </View>
        </View>

        {/* Kelp scene */}
        <View style={styles.kelpContainer}>
          <Image source={kelpBg} style={styles.kelpImage} resizeMode="cover" />
          <View style={styles.kelpOverlay}>
            <View style={styles.kelpBadge}>
              <Text style={styles.kelpBadgeText}>Sensly is monitoring ✦</Text>
              <Text style={styles.kelpBadgeSub}>Stay calm, we've got you</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.insightButton}
            onPress={() => navigation.navigate('Insight' as any, { risk, soundLabel, motionLabel, db })}
            accessibilityRole="button"
          >
            <Text style={styles.insightButtonText}>View Insight ✦</Text>
          </TouchableOpacity>

          {risk >= 70 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => navigation.navigate('Calm')}
              accessibilityRole="button"
            >
              <Text style={styles.resetButtonText}>Start Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  backButton: { paddingVertical: spacing.sm },
  backText: { ...typography.body, color: colors.primary },
  axolotlContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  card: {
    ...frostedCard,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardMono: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  senseMessage: {
    ...typography.heading3,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  riskLabel: { ...typography.bodySm, fontWeight: '600' },
  riskScore: { ...typography.body, fontWeight: '700' },
  sensorSummary: { marginTop: spacing.xs },
  sensorSummaryText: { ...typography.bodySm, color: colors.textMuted },
  kelpContainer: {
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(35,88,105,0.2)',
  },
  kelpImage: { position: 'absolute', width: '100%', height: '100%' },
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
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  insightButton: {
    ...frostedCard,
    padding: spacing.md,
    alignItems: 'center',
  },
  insightButtonText: { ...typography.label, color: colors.primary, fontSize: 16 },
  resetButton: {
    backgroundColor: '#F46F61',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  resetButtonText: { ...typography.label, color: '#fff', fontSize: 16 },
});
