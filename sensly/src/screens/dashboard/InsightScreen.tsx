/**
 * Insight screen — shows the AI-generated insight and reset action.
 * Navigated to from CurrentSenseScreen.
 */
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import { dbToLabel } from '../../lib/sensoryUtils';
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { AppRootParamList } from '../../navigation/types';

type RouteParams = {
  Insight: {
    risk: number;
    soundLabel: string;
    motionLabel: string;
    db: number;
  };
};

export function InsightScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'Insight'>>();
  const { risk, soundLabel, motionLabel, db } = route.params;

  const insightText = db > 0
    ? `${dbToLabel(db)} environment — ${soundLabel} noise, ${motionLabel} movement.`
    : 'Noise, motion, and light combine into your stress risk score.';

  const tips = [
    risk > 70 && '🔴 Your risk is elevated — consider a sensory reset.',
    soundLabel === 'loud' && '🔊 Noise is the biggest factor right now. Headphones may help.',
    motionLabel === 'active' && '🏃 Lots of movement around you. A quieter spot might feel better.',
    risk <= 40 && '🟢 You\'re in a calm environment. Good time to recharge.',
  ].filter(Boolean);

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

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Insight ✦</Text>
          <AxolotlSvg mood={risk > 70 ? 'stressed' : risk > 40 ? 'thinking' : 'happy'} size={60} />
        </View>

        {/* Main insight card */}
        <View style={styles.card}>
          <Text style={styles.insightText}>{insightText}</Text>
        </View>

        {/* Tips */}
        {tips.length > 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>What this means for you</Text>
            {tips.map((tip, i) => (
              <Text key={i} style={styles.tipText}>{tip}</Text>
            ))}
          </View>
        )}

        {/* Risk gauge */}
        <View style={styles.riskCard}>
          <Text style={styles.riskCardLabel}>RISK SCORE</Text>
          <Text style={[styles.riskValue, {
            color: risk > 70 ? '#EC7D6E' : risk > 40 ? '#F2B85B' : '#46B7AE',
          }]}>{risk}</Text>
          <View style={styles.riskBar}>
            <View style={[styles.riskBarFill, {
              width: `${Math.min(100, risk)}%`,
              backgroundColor: risk > 70 ? '#EC7D6E' : risk > 40 ? '#F2B85B' : '#46B7AE',
            }]} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {risk >= 70 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => navigation.navigate('Calm')}
              accessibilityRole="button"
            >
              <Text style={styles.resetButtonText}>Start Sensory Reset</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.popToTop()}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
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
    gap: spacing.lg,
  },
  backButton: { paddingVertical: spacing.sm },
  backText: { ...typography.body, color: colors.primary },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    ...frostedCard,
    padding: spacing.lg,
  },
  insightText: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  tipsCard: {
    ...frostedCard,
    backgroundColor: 'rgba(240,250,251,0.8)',
    borderColor: 'rgba(79,179,191,0.3)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tipsTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  riskCard: {
    ...frostedCard,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  riskCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  riskValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  riskBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actions: { gap: spacing.sm },
  resetButton: {
    backgroundColor: '#F46F61',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  resetButtonText: { ...typography.label, color: '#fff', fontSize: 16 },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.label, color: colors.primary, fontSize: 16 },
});
