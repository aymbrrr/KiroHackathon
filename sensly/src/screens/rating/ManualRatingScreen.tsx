/**
 * Manual rating screen — Step 2 of the rating flow.
 * Collects lighting, crowding, smell, predictability ratings via visual sliders.
 * Noise is pre-populated from AutoSense if available.
 * Submits the full rating to Supabase on confirm.
 */
import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { SensorySlider, SliderOption } from '../../components/rating/SensorySlider';
import { useAuthStore } from '../../stores/authStore';
import { useVenueStore } from '../../stores/venueStore';
import { validate } from '../../lib/validation';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import { RatingStackParamList } from './AutoSenseScreen';
import { ScaledText } from '../../components/shared/ScaledText';

type Props = {
  navigation: NativeStackNavigationProp<RatingStackParamList, 'ManualRating'>;
  route: RouteProp<RatingStackParamList, 'ManualRating'>;
};

// ─── Slider option sets ───────────────────────────────────────────────────────

const LIGHTING_OPTIONS: SliderOption[] = [
  { value: 1, icon: '🕯️', label: 'Very dim' },
  { value: 2, icon: '🌙', label: 'Dim' },
  { value: 3, icon: '💡', label: 'Moderate' },
  { value: 4, icon: '☀️', label: 'Bright' },
  { value: 5, icon: '🔆', label: 'Harsh' },
];

const CROWDING_OPTIONS: SliderOption[] = [
  { value: 1, icon: '🏜️', label: 'Empty' },
  { value: 2, icon: '🚶', label: 'Quiet' },
  { value: 3, icon: '👥', label: 'Moderate' },
  { value: 4, icon: '🧑‍🤝‍🧑', label: 'Busy' },
  { value: 5, icon: '🫂', label: 'Packed' },
];

const SMELL_OPTIONS: SliderOption[] = [
  { value: 1, icon: '✨', label: 'Neutral' },
  { value: 2, icon: '🌿', label: 'Mild' },
  { value: 3, icon: '🌸', label: 'Noticeable' },
  { value: 4, icon: '💨', label: 'Strong' },
  { value: 5, icon: '🤢', label: 'Overwhelming' },
];

const PREDICTABILITY_OPTIONS: SliderOption[] = [
  { value: 1, icon: '🌀', label: 'Chaotic' },
  { value: 2, icon: '🎲', label: 'Variable' },
  { value: 3, icon: '📋', label: 'Moderate' },
  { value: 4, icon: '🗓️', label: 'Consistent' },
  { value: 5, icon: '🎯', label: 'Routine' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ManualRatingScreen({ navigation, route }: Props) {
  const { venueId, venueName, noiseMeasurement } = route.params;
  const { user } = useAuthStore();
  const { submitRating } = useVenueStore();

  const [lighting, setLighting] = useState<number | null>(null);
  const [crowding, setCrowding] = useState<number | null>(null);
  const [smell, setSmell] = useState<number | null>(null);
  const [predictability, setPredictability] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = lighting !== null && crowding !== null && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay =
        hour < 12 ? 'morning' :
        hour < 17 ? 'afternoon' :
        hour < 21 ? 'evening' : 'night';

      const payload = {
        venue_id: venueId,
        user_id: user.id,
        noise_db: noiseMeasurement?.avg ?? null,
        lighting: validate.rating(lighting!),
        crowding: validate.rating(crowding!),
        smell: smell ? validate.rating(smell) : null,
        predictability: predictability ? validate.rating(predictability) : null,
        notes: notes.trim() ? validate.text(notes) : null,
        time_of_day: timeOfDay,
        day_of_week: now.getDay(),
      };

      const { error: dbError } = await submitRating(payload);
      if (dbError) throw new Error(dbError);

      setSubmitted(true);
    } catch (e: any) {
      setError('Something went wrong — try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <AxolotlSvg mood="happy" size={100} />
          <ScaledText style={styles.successIcon}>✅</ScaledText>
          <ScaledText style={styles.successHeading}>Rating submitted</ScaledText>
          <ScaledText style={styles.successBody}>
            Thanks for helping the community know what {venueName} is like.
          </ScaledText>
          <TouchableOpacity
            style={styles.backToMapButton}
            onPress={() => navigation.getParent()?.goBack()}
            accessibilityRole="button"
          >
            <ScaledText style={styles.backToMapText}>Back to map</ScaledText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <ScaledText style={styles.title} numberOfLines={1}>{venueName}</ScaledText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Noise summary from AutoSense */}
        {noiseMeasurement && (
          <View style={styles.noiseSummary}>
            <ScaledText style={styles.noiseSummaryText}>
              🎙️ Measured <ScaledText style={styles.bold}>{noiseMeasurement.avg} dB</ScaledText> — auto-filled
            </ScaledText>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <ScaledText style={styles.errorText}>{error}</ScaledText>
          </View>
        )}

        {/* Required sliders */}
        <SensorySlider
          label="Lighting *"
          options={LIGHTING_OPTIONS}
          value={lighting}
          onChange={setLighting}
        />
        <SensorySlider
          label="Crowding *"
          options={CROWDING_OPTIONS}
          value={crowding}
          onChange={setCrowding}
        />

        {/* Optional sliders */}
        <SensorySlider
          label="Smell (optional)"
          options={SMELL_OPTIONS}
          value={smell}
          onChange={setSmell}
        />
        <SensorySlider
          label="Predictability (optional)"
          options={PREDICTABILITY_OPTIONS}
          value={predictability}
          onChange={setPredictability}
        />

        {/* Notes */}
        <View style={styles.notesField}>
          <ScaledText style={styles.notesLabel}>Notes (optional)</ScaledText>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. quiet corner in the back, loud music on weekends"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            accessibilityLabel="Optional notes about this venue"
          />
        </View>

        <ScaledText style={styles.requiredNote}>* Required</ScaledText>
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.disabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit rating"
        >
          {isSubmitting
            ? <ActivityIndicator color={colors.textInverse} />
            : <ScaledText style={styles.primaryButtonText}>Submit rating</ScaledText>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 24, color: colors.primary },
  title: { ...typography.heading3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  noiseSummary: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  noiseSummaryText: { ...typography.body, color: colors.primary },
  bold: { fontWeight: '700' },
  errorBox: { backgroundColor: '#FDECEA', borderRadius: 8, padding: spacing.md },
  errorText: { ...typography.bodySm, color: colors.error },
  notesField: { gap: spacing.xs },
  notesLabel: { ...typography.label, color: colors.textSecondary },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(58,172,178,0.4)',
    borderRadius: 14,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  requiredNote: { ...typography.bodySm, color: colors.textMuted },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  primaryButton: {
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
  primaryButtonText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
  disabled: { opacity: 0.4 },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  successIcon: { fontSize: 56 },
  successHeading: { ...typography.heading2, color: colors.textPrimary, textAlign: 'center' },
  successBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  backToMapButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minHeight: 52,
    minWidth: 200,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  backToMapText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
});
