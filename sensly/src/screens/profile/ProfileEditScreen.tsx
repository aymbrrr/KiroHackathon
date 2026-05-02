/**
 * Profile edit screen — set noise threshold, lighting preference, triggers.
 * Changes are persisted to Supabase profiles table and settingsStore.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { supabase } from '../../lib/supabase';
import { TRIGGER_OPTIONS, NOISE_THRESHOLD_DEFAULTS } from '../../constants/sensoryScales';

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
      setIsLoading(false);
    }
  }, [profile]);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaved(false);

    await saveProfile({
      noise_threshold: noiseThreshold,
      lighting_preference: lightingPref,
      triggers: selectedTriggers,
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
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sensory preferences</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Noise threshold */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Noise comfort level</Text>
          <Text style={styles.sectionDesc}>
            You'll get an alert when a venue or your surroundings exceed this level.
          </Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderMin}>🤫 Quiet</Text>
            <Text style={styles.sliderValue}>{noiseThreshold} dB</Text>
            <Text style={styles.sliderMax}>Loud 📢</Text>
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
          <Text style={styles.thresholdHint}>
            {noiseThreshold <= 50 ? '🔇 Very sensitive — quiet spaces only' :
             noiseThreshold <= 65 ? '🔉 Moderate — most cafés and restaurants' :
             '🔊 Tolerant — comfortable in most environments'}
          </Text>
        </View>

        {/* Lighting preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lighting preference</Text>
          <View style={styles.optionRow}>
            {LIGHTING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, lightingPref === opt.value && styles.optionCardActive]}
                onPress={() => setLightingPref(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: lightingPref === opt.value }}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <Text style={[styles.optionLabel, lightingPref === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Triggers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What bothers you most?</Text>
          <Text style={styles.sectionDesc}>Select any that apply — used to personalise your map.</Text>
          {Object.entries(TRIGGER_OPTIONS).map(([category, triggers]) => (
            <View key={category} style={styles.triggerCategory}>
              <Text style={styles.triggerCategoryLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
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
                      <Text style={[styles.triggerChipText, selected && styles.triggerChipTextSelected]}>
                        {trigger}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
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
            : <Text style={styles.saveButtonText}>{saved ? '✅ Saved' : 'Save preferences'}</Text>
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
  sectionTitle: { ...typography.label, color: colors.textSecondary },
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  triggerChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  triggerChipText: { ...typography.bodySm, color: colors.textSecondary },
  triggerChipTextSelected: { color: colors.primary, fontWeight: '600' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButtonText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
  disabled: { opacity: 0.5 },
});
