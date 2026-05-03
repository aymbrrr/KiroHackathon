/**
 * OnboardingScreen — 5-step first-run wizard.
 * Shown once after sign-up; gates to Dashboard on all future launches.
 *
 * Step 0: Welcome — purpose statement + privacy summary (not skippable)
 * Step 1: Noise threshold (slider)
 * Step 2: Lighting preference (option cards)
 * Step 3: Sensory triggers (multi-select chips)
 * Step 4: Personalized tutorial — 3 tiles, condition-aware, not skippable
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

// Steps: 0 = welcome, 1 = noise, 2 = lighting, 3 = triggers, 4 = tutorial

// ─── Component ────────────────────────────────────────────────────────────────

type OnboardingNavProp = NativeStackNavigationProp<AppRootParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavProp>();
  const { saveProfile } = useProfileStore();
  const { setOnboardingComplete } = useSettingsStore();

  const [step, setStep] = useState(0);
  const [noiseThreshold, setNoiseThreshold] = useState(65);
  const [lightingPref, setLightingPref] = useState<LightingValue>('moderate');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const noiseHint =
    noiseThreshold <= 50
      ? '🔇 Very sensitive — quiet spaces only'
      : noiseThreshold <= 65
      ? '🔉 Moderate — most cafés and restaurants'
      : '🔊 Tolerant — comfortable in most environments';

  const noiseMood: 'alert' | 'happy' | 'thinking' =
    noiseThreshold > 70 ? 'alert' : noiseThreshold < 50 ? 'happy' : 'thinking';

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleTrigger = (trigger: string) => {
    setTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  // Step 3 (triggers) → save profile, then advance to tutorial
  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    await saveProfile({
      noise_threshold: noiseThreshold,
      lighting_preference: lightingPref,
      triggers,
    });
    setIsSaving(false);
    setStep(4);
  };

  // Step 4 (tutorial) → mark complete and enter app
  const handleFinish = () => {
    setOnboardingComplete();
    navigation.replace('MainTabs');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Steps 0 and 4 are full-screen, no dots shown
  const showDots = step >= 1 && step <= 3;

  return (
    <SafeAreaView style={styles.container}>
      {/* Step dots — only shown during settings steps 1–3 */}
      {showDots && (
        <View style={styles.dotsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        key={step} // remount scroll position on step change
      >
        {step === 0 && <StepWelcome />}

        {step === 1 && (
          <StepNoise
            noiseThreshold={noiseThreshold}
            setNoiseThreshold={setNoiseThreshold}
            noiseHint={noiseHint}
            mood={noiseMood}
          />
        )}

        {step === 2 && (
          <StepLighting
            lightingPref={lightingPref}
            setLightingPref={setLightingPref}
          />
        )}

        {step === 3 && (
          <StepTriggers
            triggers={triggers}
            toggleTrigger={toggleTrigger}
          />
        )}

        {step === 4 && (
          <StepTutorial
            noiseThreshold={noiseThreshold}
            triggers={triggers}
          />
        )}

        {/* Navigation buttons */}
        <View style={styles.buttonRow}>
          {/* Back button — not on step 0 or step 4 */}
          {step > 0 && step < 4 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep((s) => s - 1)}
              accessibilityRole="button"
            >
              <ScaledText style={styles.secondaryButtonText}>← Back</ScaledText>
            </TouchableOpacity>
          )}

          {/* Primary action */}
          {step === 0 && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFlex]}
              onPress={() => setStep(1)}
              accessibilityRole="button"
            >
              <ScaledText style={styles.primaryButtonText}>Get started →</ScaledText>
            </TouchableOpacity>
          )}

          {step === 1 && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFlex]}
              onPress={() => setStep(2)}
              accessibilityRole="button"
            >
              <ScaledText style={styles.primaryButtonText}>Next →</ScaledText>
            </TouchableOpacity>
          )}

          {step === 2 && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFlex]}
              onPress={() => setStep(3)}
              accessibilityRole="button"
            >
              <ScaledText style={styles.primaryButtonText}>Next →</ScaledText>
            </TouchableOpacity>
          )}

          {step === 3 && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFlex, isSaving && styles.disabled]}
              onPress={handleSaveAndContinue}
              disabled={isSaving}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <ScaledText style={styles.primaryButtonText}>Next →</ScaledText>
              )}
            </TouchableOpacity>
          )}

          {step === 4 && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFlex]}
              onPress={handleFinish}
              accessibilityRole="button"
            >
              <ScaledText style={styles.primaryButtonText}>Let's go 🌊</ScaledText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step 0: Welcome — purpose + privacy ─────────────────────────────────────

function StepWelcome() {
  return (
    <View style={styles.stepContainer}>
      <AxolotlSvg mood="happy" size={140} animate />

      <ScaledText style={styles.wordmark}>sensly</ScaledText>
      <ScaledText style={styles.tagline}>Know before you go.</ScaledText>

      <ScaledText style={styles.purposeBody}>
        Sensly helps you find venues that work for your senses — before you walk in.
        Your phone measures noise in real time, and the community rates lighting,
        crowding, and predictability so you can plan ahead.
      </ScaledText>

      {/* Privacy card */}
      <View style={[frostedCard, styles.card, styles.privacyCard]}>
        <ScaledText style={styles.sectionLabel}>Your privacy</ScaledText>

        <View style={styles.privacyRow}>
          <ScaledText style={styles.privacyIcon}>🔒</ScaledText>
          <ScaledText style={styles.privacyText}>
            Your preferences stay on your device and are never shared with other users.
          </ScaledText>
        </View>

        <View style={styles.privacyRow}>
          <ScaledText style={styles.privacyIcon}>👤</ScaledText>
          <ScaledText style={styles.privacyText}>
            All venue ratings you submit are anonymous — no one can trace them back to you.
          </ScaledText>
        </View>

        <View style={styles.privacyRow}>
          <ScaledText style={styles.privacyIcon}>📍</ScaledText>
          <ScaledText style={styles.privacyText}>
            Location is used in-session only to show nearby venues. We never store your location history.
          </ScaledText>
        </View>

        <View style={styles.privacyRow}>
          <ScaledText style={styles.privacyIcon}>🎙️</ScaledText>
          <ScaledText style={styles.privacyText}>
            The microphone measures noise levels only — no audio is ever recorded or stored.
          </ScaledText>
        </View>
      </View>
    </View>
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
        Select any that apply — this personalises your map and tips.
      </ScaledText>

      <View style={[frostedCard, styles.card]}>
        {Object.entries(TRIGGER_OPTIONS).map(([category, items]) => (
          <View key={category} style={styles.triggerCategory}>
            <ScaledText style={styles.sectionLabel}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </ScaledText>
            <View style={styles.triggerChips}>
              {(items as readonly string[]).map((trigger) => {
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

// ─── Step 4: Personalized tutorial ───────────────────────────────────────────

interface StepTutorialProps {
  noiseThreshold: number;
  triggers: string[];
}

/**
 * Derives a short, warm, research-backed tip based on the user's noise threshold
 * and selected triggers. Uses plain language — no clinical labels.
 *
 * Research basis:
 * - Unpredictable sounds are more distressing than consistent loud noise (NIH PMC7855558)
 * - Pre-visit environmental awareness is one of the most effective coping strategies
 * - Motion (fidgeting) is a self-regulation behaviour common in sensory-sensitive individuals
 */
function getTip(noiseThreshold: number, triggers: string[]): string {
  const hasSoundTrigger = triggers.some((t) =>
    ['sudden sounds', 'background noise', 'music', 'crowds'].includes(t.toLowerCase())
  );
  const hasCrowdTrigger = triggers.some((t) =>
    ['crowding', 'crowds', 'queues', 'personal space'].includes(t.toLowerCase())
  );
  const hasSmellTrigger = triggers.some((t) =>
    ['smell', 'food smells', 'cleaning products', 'perfume'].includes(t.toLowerCase())
  );

  if (hasSoundTrigger || noiseThreshold <= 55) {
    return 'Unpredictable sounds — like alarms or sudden announcements — are harder on the nervous system than consistent background noise. Sensly flags both so you can plan ahead.';
  }
  if (hasCrowdTrigger) {
    return 'Crowded venues are often quieter at off-peak times. The time heatmap on each venue shows when it\'s least busy — tap any venue to see it.';
  }
  if (hasSmellTrigger) {
    return 'Smell sensitivity is real and often underestimated. Community ratings include smell intensity so you can filter for low-odour venues.';
  }
  // Default tip
  return 'Knowing what a space is like before you arrive is one of the most effective ways to reduce sensory overload. That\'s exactly what Sensly is built for.';
}

function StepTutorial({ noiseThreshold, triggers }: StepTutorialProps) {
  const tip = getTip(noiseThreshold, triggers);

  return (
    <View style={styles.stepContainer}>
      <AxolotlSvg mood="relieved" size={130} animate />

      <ScaledText style={styles.stepTitle}>You're all set.</ScaledText>
      <ScaledText style={styles.stepSubtitle}>
        Here's how to get the most out of sensly.
      </ScaledText>

      {/* Tile 1 — Map */}
      <View style={[frostedCard, styles.card, styles.tileCard]}>
        <View style={styles.tileHeader}>
          <ScaledText style={styles.tileIcon}>🗺️</ScaledText>
          <ScaledText style={styles.tileTitle}>Check the map first</ScaledText>
        </View>
        <ScaledText style={styles.tileBody}>
          Tap any venue to see noise, lighting, crowding, and smell scores — all rated by people
          like you. The time heatmap shows the quietest hours to visit.
        </ScaledText>
      </View>

      {/* Tile 2 — Sense / mic */}
      <View style={[frostedCard, styles.card, styles.tileCard]}>
        <View style={styles.tileHeader}>
          <ScaledText style={styles.tileIcon}>🎙️</ScaledText>
          <ScaledText style={styles.tileTitle}>Measure your space</ScaledText>
        </View>
        <ScaledText style={styles.tileBody}>
          The Sense tab reads the room in 30 seconds using your mic. It measures decibels —
          not audio — so nothing is ever recorded. Use it to rate a venue or check your
          current environment.
        </ScaledText>
      </View>

      {/* Tile 3 — Motion sensor */}
      <View style={[frostedCard, styles.card, styles.tileCard]}>
        <View style={styles.tileHeader}>
          <ScaledText style={styles.tileIcon}>📱</ScaledText>
          <ScaledText style={styles.tileTitle}>Track your body's signals</ScaledText>
        </View>
        <ScaledText style={styles.tileBody}>
          The Home screen tracks motion as a sign of sensory load. Keep your phone in your
          pocket for ambient movement, or rest it on your leg to pick up fidgeting — a natural
          self-regulation response. Higher motion + high noise = your risk score goes up.
        </ScaledText>
      </View>

      {/* Personalised tip */}
      <View style={styles.tipCard}>
        <ScaledText style={styles.tipLabel}>💡 Based on your preferences</ScaledText>
        <ScaledText style={styles.tipBody}>{tip}</ScaledText>
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

  // ── Welcome step ──
  wordmark: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  purposeBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  privacyCard: {
    gap: spacing.md,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  privacyIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  privacyText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // ── Settings steps ──
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

  // ── Tutorial step ──
  tileCard: {
    gap: spacing.sm,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tileIcon: {
    fontSize: 22,
  },
  tileTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  tileBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipCard: {
    width: '100%',
    backgroundColor: colors.primaryMuted,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  tipBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ── Buttons ──
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
  disabled: {
    opacity: 0.5,
  },
});
