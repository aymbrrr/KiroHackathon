/**
 * Venue detail screen — full detail view for a venue.
 * Shows: score, radar chart, time heatmap, sensory features, rating CTA.
 *
 * Navigated to from the map bottom sheet "See full details" or
 * directly from search results.
 */
import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { useVenueStore, Venue } from '../../stores/venueStore';
import { supabase } from '../../lib/supabase';
import { SensoryRadar } from '../../components/venue/SensoryRadar';
import { TimeHeatmap } from '../../components/venue/TimeHeatmap';
import { scoreToPinStyle, dbToLabel } from '../../lib/sensoryUtils';
import { useSettingsStore } from '../../stores/settingsStore';
import { AppRootParamList } from '../../navigation/types';
import { ScaledText } from '../../components/shared/ScaledText';
import { KelpBackground } from '../../components/shared/KelpBackground';

// Extend AppRootParamList to include VenueDetail
export type VenueDetailParamList = AppRootParamList & {
  VenueDetail: { venueId: string };
};

type Props = {
  navigation: NativeStackNavigationProp<VenueDetailParamList, 'VenueDetail'>;
  route: RouteProp<VenueDetailParamList, 'VenueDetail'>;
};

interface RatingRow {
  day_of_week: number | null;
  time_of_day: string | null;
  noise_db: number | null;
}

export function VenueDetailScreen({ navigation, route }: Props) {
  const { venueId } = route.params;
  const { getVenueById } = useVenueStore();
  const { uiMode } = useSettingsStore();
  const selfMode = uiMode === 'self';

  const [venue, setVenue] = useState<Venue | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const v = await getVenueById(venueId);
      setVenue(v);

      if (v) {
        const { data } = await supabase
          .from('ratings')
          .select('day_of_week, time_of_day, noise_db')
          .eq('venue_id', venueId)
          .order('created_at', { ascending: false })
          .limit(100);
        setRatings((data ?? []) as RatingRow[]);
      }
      setIsLoading(false);
    }
    load();
  }, [venueId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!venue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ScaledText style={styles.errorText}>Venue not found</ScaledText>
        </View>
      </SafeAreaView>
    );
  }

  const pin = scoreToPinStyle(venue.overall_score);
  const noiseLabel = venue.avg_noise_db != null
    ? `${Math.round(venue.avg_noise_db)} dB — ${dbToLabel(venue.avg_noise_db)}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <KelpBackground variant="kelp2">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <ScaledText style={styles.backText}>←</ScaledText>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <ScaledText style={styles.venueName} numberOfLines={2}>{venue.name}</ScaledText>
          {venue.address && (
            <ScaledText style={styles.venueAddress} numberOfLines={1}>{venue.address}</ScaledText>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall score badge */}
        <View style={styles.scoreBadgeRow}>
          <View style={[styles.scoreBadge, { backgroundColor: pin.color + '22', borderColor: pin.color }]}>
            <View style={[styles.scoreDot, { backgroundColor: pin.color }]} />
            <ScaledText style={[styles.scoreBadgeText, { color: pin.color }]}>{pin.label}</ScaledText>
          </View>
          <ScaledText style={styles.ratingCount}>
            {venue.total_ratings} rating{venue.total_ratings !== 1 ? 's' : ''}
          </ScaledText>
        </View>

        {/* Quick stats */}
        {!selfMode && (
          <View style={styles.statsRow}>
            {noiseLabel && <StatChip icon="🎙️" label={noiseLabel} />}
            {venue.avg_lighting != null && (
              <StatChip icon="💡" label={`Lighting: ${venue.avg_lighting.toFixed(1)}/5`} />
            )}
            {venue.avg_crowding != null && (
              <StatChip icon="👥" label={`Crowding: ${venue.avg_crowding.toFixed(1)}/5`} />
            )}
          </View>
        )}

        {selfMode && noiseLabel && (
          <View style={styles.selfNoiseBanner}>
            <ScaledText style={styles.selfNoiseText}>🎙️ {noiseLabel}</ScaledText>
          </View>
        )}

        {/* Sensory features */}
        {venue.sensory_features && venue.sensory_features.length > 0 && (
          <View style={styles.section}>
            <ScaledText style={styles.sectionTitle}>Sensory features</ScaledText>
            <View style={styles.featureChips}>
              {venue.sensory_features.map((f, i) => (
                <View key={i} style={styles.featureChip}>
                  <ScaledText style={styles.featureChipText}>{f}</ScaledText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Radar chart */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Sensory profile</ScaledText>
          <SensoryRadar venue={venue} selfMode={selfMode} />
        </View>

        {/* Time heatmap — Support mode only */}
        {!selfMode && (
          <View style={styles.section}>
            <ScaledText style={styles.sectionTitle}>Best times to visit</ScaledText>
            <TimeHeatmap ratings={ratings} />
          </View>
        )}

        {/* Quiet hours */}
        {venue.quiet_hours && venue.quiet_hours.length > 0 && (
          <View style={styles.section}>
            <ScaledText style={styles.sectionTitle}>Quiet hours</ScaledText>
            {venue.quiet_hours.map((qh, i) => (
              <View key={i} style={styles.quietHourRow}>
                <ScaledText style={styles.quietHourText}>
                  🔇 {qh.label} — {qh.day?.toUpperCase()} {qh.start}–{qh.end}
                </ScaledText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Rate CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => navigation.navigate('Rating', {
            venueId: venue.id,
            venueName: venue.name,
          })}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${venue.name}`}
        >
          <ScaledText style={styles.rateButtonText}>🎙️ Rate this place</ScaledText>
        </TouchableOpacity>
      </View>
      </KelpBackground>
    </SafeAreaView>
  );
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <ScaledText style={styles.statIcon}>{icon}</ScaledText>
      <ScaledText style={styles.statLabel}>{label}</ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...typography.body, color: colors.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    gap: spacing.md,
  },
  backButton: { paddingTop: 2 },
  backText: { fontSize: 22, color: colors.primary },
  headerTitle: { flex: 1 },
  venueName: { ...typography.heading2, color: colors.textPrimary },
  venueAddress: { ...typography.bodySm, color: colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  scoreBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBadge: {
    ...frostedCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  scoreBadgeText: { ...typography.label, fontSize: 14 },
  ratingCount: { ...typography.bodySm, color: colors.textMuted },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...frostedCard,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statIcon: { fontSize: 13 },
  statLabel: { ...typography.bodySm, color: colors.textSecondary },
  selfNoiseBanner: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 10,
    padding: spacing.md,
  },
  selfNoiseText: { ...typography.bodyLg, color: colors.primary, fontWeight: '600' },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  featureChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  featureChip: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  featureChipText: { ...typography.bodySm, color: colors.textInverse },
  quietHourRow: {
    ...frostedCard,
    padding: spacing.sm,
  },
  quietHourText: { ...typography.bodySm, color: colors.textSecondary },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  rateButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  rateButtonText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
});
