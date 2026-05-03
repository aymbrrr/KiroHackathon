/**
 * OnboardingScreen — 3-step first-run wizard.
 * Shown once after sign-up; gates to Dashboard on all future launches.
 *
 * Step 1: Noise threshold (slider)
 * Step 2: Lighting preference (option cards)
 * Step 3: Sensory triggers (multi-select chips)
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { TRIGGER_OPTIONS } from '../../constants/sensoryScales';
import { useProfileStore } from '../../stores/profileStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ScaledText } from '../../components/shared/ScaledText';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import { AppRootParamList } from '../../navigation/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIGHTING_OPTIONS = [
  { value: 'dim',      label: 'Dim',      icon: '🌙', desc: 'Cozy, low light' },
  { value: 'moderate', label: 'Moderate', icon: '💡', desc: 'Standard lighting' },
  { value: 'bright',   label: 'Bright',   icon: '☀️', desc: 'Well-lit spaces' },
] as const;

type LightingValue = 'dim' | 'moderate' | 'bright';

// ─── Component ────────────────────────────────────────────────────────────────

type OnboardingNavProp = NativeStackNavigationProp<AppRootParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavProp>();
  const { saveProfile } = useProfileStore();
  const { setOnboardingComplete } = useSettingsStore();

  const [step, setStep] = useState(0); // 0, 1, 2
  const [noiseThreshold, setNoiseThreshold] = useState(65);
  const [lightingPref, setLightingPref] = useState<LightingValue>('moderate');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const noiseHint =
    noiseThreshold <= 50
      ? '🔇 Very sensitive'
      : noiseThreshold <= 65
      ? '🔉 Moderate'
      : '🔊 Tolerant';

  const noiseMood: 'alert' | 'happy' | 'thinking' =
    noiseThreshold > 70 ? 'alert' : noiseThreshold < 50 ? 'happy' : 'thinking';

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleTrigger = (trigger: string) => {
    setTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleFinish = async () => {
    setIsSaving(true);
    await saveProfile({
      noise_threshold: noiseThreshold,
      lighting_preference: lightingPref,
      triggers,
    });
    setOnboardingComplete();
    navigation.replace('MainTabs');
  };

  const handleSkip = () => {
    setOnboardingComplete();
    navigation.replace('MainTabs');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Step dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <StepNoise
            noiseThreshold={noiseThreshold}
            setNoiseThreshold={setNoiseThreshold}
            noiseHint={noiseHint}
            mood={noiseMood}
          />
        )}
        {step === 1 && (
          <StepLighting
            lightingPref={lightingPref}
            setLightingPref={setLightingPref}
          />
        )}
        {step === 2 && (
          <StepTriggers
            triggers={triggers}
            toggleTrigger={toggleTrigger}
          />
        )}

        {/* Navigation buttons */}
        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep((s) => s - 1)}
              accessibilityRole="button"
            >
              <ScaledText style={styles.secondaryButtonText}>← Back</ScaledText>
            </TouchableOpacity>
          )}

          {step < 2 ? (
            <TouchableOpacity
              style={[styles.primaryButton, step > 0 && styles.primaryButtonFlex]}
              onPress={() => setStep((s) => s + 1)}
              accessibilityRole="button"
            >
              <ScaledText style={styles.primaryButtonText}>Next →</ScaledText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFlex, isSaving && styles.disabled]}
              onPress={handleFinish}
              disabled={isSaving}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <ScaledText style={styles.primaryButtonText}>Finish →</ScaledText>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Skip link */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
        >
          <ScaledText style={styles.skipText}>Skip for now</ScaledText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step 1: Noise ────────────────────────────────────────────────────────────

interface StepNoiseProps {
  noiseThreshold: number;
  setNoiseThreshold: (v: number) => void;
  noiseHint: string;
  mood: 'alert' | 'happy' | 'thinking';
}

function StepNoise({ noiseThreshold, setNoiseThreshold, noiseHint, mood }: StepNoiseProps) {
  return (
    <View style={styles.stepContainer}>
      <AxolotlSvg mood={mood} size={120} animate />

      <ScaledText style={styles.stepTitle}>How loud is too loud for you?</ScaledText>
      <ScaledText style={styles.stepSubtitle}>
        We'll alert you when venues exceed your comfort level.
      </ScaledText>

      <View style={[frostedCard, styles.card]}>
        <ScaledText style={styles.sectionLabel}>Noise comfort level</ScaledText>

        <View style={styles.sliderValueRow}>
          <ScaledText style={styles.sliderIcon}>🔊</ScaledText>
          <ScaledText style={styles.sliderValue}>{noiseThreshold} dB</ScaledText>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={40}
          maximumValue={90}
          step={5}
          value={noiseThreshold}
          onValueChange={setNoiseThreshold}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          accessibilityLabel="Noise comfort threshold"
        />

        <ScaledText style={styles.thresholdHint}>{noiseHint}</ScaledText>
      </View>
    </View>
  );
}

// ─── Step 2: Lighting ─────────────────────────────────────────────────────────

interface StepLightingProps {
  lightingPref: LightingValue;
  setLightingPref: (v: LightingValue) => void;
}

function StepLighting({ lightingPref, setLightingPref }: StepLightingProps) {
  return (
    <View style={styles.stepContainer}>
      <AxolotlSvg mood="happy" size={120} animate />

      <ScaledText style={styles.stepTitle}>What lighting feels comfortable?</ScaledText>

      <View style={[frostedCard, styles.card]}>
        <ScaledText style={styles.sectionLabel}>Lighting preference</ScaledText>

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
              <ScaledText
                style={[styles.optionLabel, lightingPref === opt.value && styles.optionLabelActive]}
              >
                {opt.label}
              </ScaledText>
              <ScaledText style={styles.optionDesc}>{opt.desc}</ScaledText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Step 3: Triggers ─────────────────────────────────────────────────────────

interface StepTriggersProps {
  triggers: string[];
  toggleTrigger: (t: string) => void;
}

function StepTriggers({ triggers, toggleTrigger }: StepTriggersProps) {
  return (
    <View style={styles.stepContainer}>
      <AxolotlSvg mood="thinking" size={120} animate />

      <ScaledText style={styles.stepTitle}>What bothers you most?</ScaledText>
      <ScaledText style={styles.stepSubtitle}>
        Select any that apply — skip if unsure.
      </ScaledText>

      <View style={[frostedCard, styles.card]}>
        {Object.entries(TRIGGER_OPTIONS).map(([category, items]) => (
          <View key={category} style={styles.triggerCategory}>
            <ScaledText style={styles.sectionLabel}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </ScaledText>
            <View style={styles.triggerChips}>
              {items.map((trigger) => {
                const selected = triggers.includes(trigger);
                return (
                  <TouchableOpacity
                    key={trigger}
                    style={[styles.triggerChip, selected && styles.triggerChipSelected]}
                    onPress={() => toggleTrigger(trigger)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <ScaledText
                      style={[
                        styles.triggerChipText,
                        selected && styles.triggerChipTextSelected,
                      ]}
                    >
                      {trigger}
                    </ScaledText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
    borderRadius: 4,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  stepContainer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  stepTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    width: '100%',
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sliderValueRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sliderIcon: {
    fontSize: 18,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thresholdHint: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    ...frostedCard,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    minHeight: 80,
    justifyContent: 'center',
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 13,
  },
  optionLabelActive: {
    color: colors.primary,
  },
  optionDesc: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 10,
  },
  triggerCategory: {
    gap: spacing.xs,
  },
  triggerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  triggerChip: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(58,172,178,0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  triggerChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  triggerChipText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  triggerChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonFlex: {
    flex: 1,
  },
  primaryButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 17,
  },
  secondaryButton: {
    borderRadius: 30,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 17,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.5,
  },
});
