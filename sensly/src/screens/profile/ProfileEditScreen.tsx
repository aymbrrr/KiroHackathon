/**
 * Profile edit screen — set noise threshold, lighting preference, triggers.
 * Changes are persisted to Supabase profiles table and settingsStore.
 */
import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { supabase } from '../../lib/supabase';
import { TRIGGER_OPTIONS, NOISE_THRESHOLD_DEFAULTS } from '../../constants/sensoryScales';
import { ScaledText } from '../../components/shared/ScaledText';

const LIGHTING_OPTIONS = [
  { value: 'dim',      label: 'Dim',      icon: '🌙', desc: 'Cozy, low light' },
  { value: 'moderate', label: 'Moderate', icon: '💡', desc: 'Standard lighting' },
  { value: 'bright',   label: 'Bright',   icon: '☀️', desc: 'Well-lit spaces' },
] as const;

export function ProfileEditScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { profile, saveProfile, fetchProfile } = useProfileStore();

  const [noiseThreshold, setNoiseThreshold] = useState(65);
  const [lightingPref, setLightingPref] = useState<'dim' | 'moderate' | 'bright'>('moderate');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [diagnosisConsent, setDiagnosisConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load existing profile from store
  useEffect(() => {
    if (!user) return;
    fetchProfile().then(() => setIsLoading(false));
  }, [user]);

  // Sync local state when profile loads
  useEffect(() => {
    if (profile) {
      setNoiseThreshold(profile.noise_threshold ?? 65);
      setLightingPref(profile.lighting_preference ?? 'moderate');
      setSelectedTriggers(profile.triggers ?? []);
      setSelectedDiagnoses((profile.diagnosis_tags as string[]) ?? []);
      setDiagnosisConsent(profile.diagnosis_consent ?? false);
      setIsLoading(false);
    }
  }, [profile]);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const DIAGNOSIS_OPTIONS = [
    { id: 'autism', label: 'Autism / ASD', emoji: '🧩' },
    { id: 'adhd', label: 'ADHD', emoji: '⚡' },
    { id: 'ptsd', label: 'PTSD', emoji: '🛡️' },
    { id: 'spd', label: 'Sensory Processing', emoji: '🌀' },
    { id: 'anxiety', label: 'Anxiety', emoji: '💭' },
    { id: 'migraine', label: 'Migraine', emoji: '🤕' },
    { id: 'ocd', label: 'OCD', emoji: '🔄' },
    { id: 'dyslexia', label: 'Dyslexia', emoji: '📖' },
  ];

  // Research-backed threshold defaults per diagnosis
  const DIAGNOSIS_THRESHOLDS: Record<string, number> = {
    autism: 55, migraine: 55, spd: 55,
    ptsd: 60, anxiety: 60,
    adhd: 65, ocd: 65, dyslexia: 65,
  };

  const toggleDiagnosis = (id: string) => {
    setSelectedDiagnoses((prev) => {
      const next = prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id];
      // Auto-adjust noise threshold to the most sensitive diagnosis
      if (next.length > 0) {
        const lowestThreshold = Math.min(...next.map(d => DIAGNOSIS_THRESHOLDS[d] ?? 65));
        setNoiseThreshold(lowestThreshold);
        if (!diagnosisConsent) setDiagnosisConsent(true);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaved(false);

    await saveProfile({
      noise_threshold: noiseThreshold,
      lighting_preference: lightingPref,
      triggers: selectedTriggers,
      diagnosis_tags: diagnosisConsent ? selectedDiagnoses : [],
      diagnosis_consent: diagnosisConsent && selectedDiagnoses.length > 0,
    });

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => navigation.goBack(), 800);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <ScaledText style={styles.backText}>← Back</ScaledText>
        </TouchableOpacity>
        <ScaledText style={styles.title}>Sensory preferences</ScaledText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Noise threshold */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Noise comfort level</ScaledText>
          <ScaledText style={styles.sectionDesc}>
            You'll get an alert when a venue or your surroundings exceed this level.
          </ScaledText>
          <View style={styles.sliderRow}>
            <ScaledText style={styles.sliderMin}>🤫 Quiet</ScaledText>
            <ScaledText style={styles.sliderValue}>{noiseThreshold} dB</ScaledText>
            <ScaledText style={styles.sliderMax}>Loud 📢</ScaledText>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={30}
            maximumValue={90}
            step={5}
            value={noiseThreshold}
            onValueChange={setNoiseThreshold}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            accessibilityLabel="Noise comfort threshold"
          />
          <ScaledText style={styles.thresholdHint}>
            {noiseThreshold <= 50 ? '🔇 Very sensitive — quiet spaces only' :
             noiseThreshold <= 65 ? '🔉 Moderate — most cafés and restaurants' :
             '🔊 Tolerant — comfortable in most environments'}
          </ScaledText>
        </View>

        {/* Lighting preference */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Lighting preference</ScaledText>
          <View style={styles.optionRow}>
            {LIGHTING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, lightingPref === opt.value && styles.optionCardActive]}
                onPress={() => setLightingPref(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: lightingPref === opt.value }}
              >
                <ScaledText style={styles.optionIcon}>{opt.icon}</ScaledText>
                <ScaledText style={[styles.optionLabel, lightingPref === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </ScaledText>
                <ScaledText style={styles.optionDesc}>{opt.desc}</ScaledText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Triggers */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>What bothers you most?</ScaledText>
          <ScaledText style={styles.sectionDesc}>Select any that apply — used to personalise your map.</ScaledText>
          {Object.entries(TRIGGER_OPTIONS).map(([category, triggers]) => (
            <View key={category} style={styles.triggerCategory}>
              <ScaledText style={styles.triggerCategoryLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}</ScaledText>
              <View style={styles.triggerChips}>
                {triggers.map((trigger) => {
                  const selected = selectedTriggers.includes(trigger);
                  return (
                    <TouchableOpacity
                      key={trigger}
                      style={[styles.triggerChip, selected && styles.triggerChipSelected]}
                      onPress={() => toggleTrigger(trigger)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <ScaledText style={[styles.triggerChipText, selected && styles.triggerChipTextSelected]}>
                        {trigger}
                      </ScaledText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Diagnosis tags — optional */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Diagnoses (optional)</ScaledText>
          <ScaledText style={styles.sectionDesc}>
            Completely optional. Helps us set better defaults for you. Never shared with other users.
          </ScaledText>
          <View style={styles.triggerChips}>
            {DIAGNOSIS_OPTIONS.map((diag) => {
              const sel = selectedDiagnoses.includes(diag.id);
              return (
                <TouchableOpacity
                  key={diag.id}
                  style={[styles.triggerChip, sel && styles.triggerChipSelected]}
                  onPress={() => toggleDiagnosis(diag.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: sel }}
                >
                  <ScaledText style={[styles.triggerChipText, sel && styles.triggerChipTextSelected]}>
                    {diag.emoji} {diag.label}
                  </ScaledText>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedDiagnoses.length > 0 && (
            <ScaledText style={styles.diagnosisHint}>
              🔒 This info is private and encrypted. It's only used to adjust your noise threshold and suggest relevant calming tools.
            </ScaledText>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityRole="button"
        >
          {isSaving
            ? <ActivityIndicator color={colors.textInverse} />
            : <ScaledText style={styles.saveButtonText}>{saved ? '✅ Saved' : 'Save preferences'}</ScaledText>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  backText: { ...typography.body, color: colors.primary, width: 60 },
  title: { ...typography.heading3, color: colors.textPrimary },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sectionDesc: { ...typography.bodySm, color: colors.textMuted, lineHeight: 20 },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderMin: { ...typography.bodySm, color: colors.textMuted },
  sliderMax: { ...typography.bodySm, color: colors.textMuted },
  sliderValue: { ...typography.heading3, color: colors.primary },
  slider: { width: '100%', height: 40 },
  thresholdHint: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' },
  optionRow: { flexDirection: 'row', gap: spacing.sm },
  optionCard: {
    flex: 1,
    ...frostedCard,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    minHeight: 80,
    justifyContent: 'center',
  },
  optionCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  optionIcon: { fontSize: 24 },
  optionLabel: { ...typography.label, color: colors.textPrimary, fontSize: 13 },
  optionLabelActive: { color: colors.primary },
  optionDesc: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', fontSize: 10 },
  triggerCategory: { gap: spacing.xs },
  triggerCategoryLabel: { ...typography.bodySm, color: colors.textMuted, fontWeight: '600', textTransform: 'capitalize' },
  triggerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  triggerChip: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(58,172,178,0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  triggerChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  triggerChipText: { ...typography.bodySm, color: colors.textSecondary },
  triggerChipTextSelected: { color: colors.primary, fontWeight: '600' },
  diagnosisHint: { ...typography.bodySm, color: colors.textMuted, lineHeight: 18, marginTop: spacing.xs, fontStyle: 'italic' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  saveButton: {
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
  saveButtonText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
  disabled: { opacity: 0.5 },
});
