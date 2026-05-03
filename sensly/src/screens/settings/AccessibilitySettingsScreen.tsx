/**
 * Accessibility settings screen.
 *
 * Features (all research-backed):
 *
 * 1. Color blindness simulation
 *    - Deuteranopia, Protanopia, Tritanopia
 *    - Applied via react-native-color-matrix-image-filters (native ColorMatrix)
 *    - Matrices from Brettel et al. 1997 / Viénot et al. 1999
 *
 * 2. Dyslexia-friendly mode
 *    - OpenDyslexic font (SIL-OFL license, free)
 *    - Increased letter spacing (+0.5px) and line height (1.6×)
 *    - Left-aligned text only (never justified)
 *    - Research: NIH PMC5629233 — OpenDyslexic improves reading rate for
 *      some dyslexic readers; combined with spacing improvements shows
 *      consistent benefit (British Dyslexia Association guidelines)
 *
 * 3. High contrast mode
 *    - Increases text/background contrast ratios
 *    - Targets WCAG AAA (7:1) vs standard AA (4.5:1)
 *    - Benefits: low vision, photosensitivity, bright outdoor use
 *
 * 4. Reduce motion
 *    - Disables non-essential animations (breathing circle, axolotl bob, etc.)
 *    - Respects system-level AccessibilityInfo.isReduceMotionEnabled()
 *    - Research: WCAG 2.3.3 — motion can trigger vestibular disorders,
 *      migraines, and anxiety in neurodivergent users
 *
 * 5. Text size
 *    - Normal (16sp), Large (20sp), X-Large (24sp)
 *    - Research: WCAG 1.4.4 — text must be resizable to 200% without
 *      loss of content; 20sp minimum recommended for cognitive accessibility
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { useSettingsStore, ColorBlindMode, TextSizeMode } from '../../stores/settingsStore';

// ─── Color blindness options ──────────────────────────────────────────────────

const COLOR_BLIND_OPTIONS: Array<{
  value: ColorBlindMode;
  label: string;
  desc: string;
  prevalence: string;
}> = [
  {
    value: 'none',
    label: 'None',
    desc: 'Standard colors',
    prevalence: '',
  },
  {
    value: 'deuteranopia',
    label: 'Deuteranopia',
    desc: 'Red-green (missing green cones)',
    prevalence: '~6% of men',
  },
  {
    value: 'protanopia',
    label: 'Protanopia',
    desc: 'Red-green (missing red cones)',
    prevalence: '~1% of men',
  },
  {
    value: 'tritanopia',
    label: 'Tritanopia',
    desc: 'Blue-yellow (missing blue cones)',
    prevalence: '~0.01%',
  },
];

// ─── Text size options ────────────────────────────────────────────────────────

const TEXT_SIZE_OPTIONS: Array<{ value: TextSizeMode; label: string; desc: string }> = [
  { value: 'normal', label: 'Normal', desc: '16sp — standard' },
  { value: 'large',  label: 'Large',  desc: '20sp — recommended for cognitive accessibility' },
  { value: 'xlarge', label: 'X-Large', desc: '24sp — maximum readability' },
];

// ─── Section component ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label, desc, value, onToggle,
}: {
  label: string; desc: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={[frostedCard, styles.toggleRow]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.borderMuted, true: colors.primary }}
        thumbColor={value ? '#fff' : '#fff'}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function AccessibilitySettingsScreen() {
  const navigation = useNavigation();
  const {
    colorBlindMode, setColorBlindMode,
    dyslexiaMode, setDyslexiaMode,
    highContrastMode, setHighContrastMode,
    reduceMotion, setReduceMotion,
    textSizeMode, setTextSizeMode,
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Accessibility</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Color blindness */}
        <Section title="Color vision">
          <Text style={styles.sectionDesc}>
            Applies a simulation filter to help you see how the app looks with different color vision.
            Affects the entire app.
          </Text>
          {COLOR_BLIND_OPTIONS.map((opt) => {
            const selected = colorBlindMode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[frostedCard, styles.optionRow, selected && styles.optionRowSelected]}
                onPress={() => setColorBlindMode(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${opt.label}${opt.prevalence ? ` — ${opt.prevalence}` : ''}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                    {opt.prevalence ? (
                      <Text style={styles.prevalence}> · {opt.prevalence}</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </Section>

        {/* Dyslexia mode */}
        <Section title="Reading">
          <ToggleRow
            label="Dyslexia-friendly text"
            desc="Uses OpenDyslexic font with increased letter spacing and line height. Helps reduce letter reversal and improve reading flow."
            value={dyslexiaMode}
            onToggle={setDyslexiaMode}
          />

          {/* Text size */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Text size</Text>
          <View style={styles.textSizeRow}>
            {TEXT_SIZE_OPTIONS.map((opt) => {
              const selected = textSizeMode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[frostedCard, styles.textSizeOption, selected && styles.optionRowSelected]}
                  onPress={() => setTextSizeMode(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.textSizeLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.textSizeDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Display */}
        <Section title="Display">
          <ToggleRow
            label="High contrast"
            desc="Increases text and border contrast to WCAG AAA (7:1 ratio). Helps with low vision and bright outdoor use."
            value={highContrastMode}
            onToggle={setHighContrastMode}
          />
          <ToggleRow
            label="Reduce motion"
            desc="Disables non-essential animations (breathing circles, mascot movement). Recommended for vestibular disorders and migraines."
            value={reduceMotion}
            onToggle={setReduceMotion}
          />
        </Section>

        {/* Info note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 These settings are saved to your device and apply immediately. They do not affect other users.
          </Text>
        </View>

      </ScrollView>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionLabel: { ...typography.label, color: colors.textPrimary },
  optionLabelSelected: { color: colors.primary },
  prevalence: { ...typography.bodySm, color: colors.textMuted, fontWeight: '400' },
  optionDesc: { ...typography.bodySm, color: colors.textMuted, marginTop: 2 },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleLabel: { ...typography.label, color: colors.textPrimary },
  toggleDesc: { ...typography.bodySm, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  textSizeRow: { flexDirection: 'row', gap: spacing.sm },
  textSizeOption: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  textSizeLabel: { ...typography.label, color: colors.textPrimary, fontSize: 13 },
  textSizeDesc: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', fontSize: 10 },
  infoBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  infoText: { ...typography.bodySm, color: colors.primary, lineHeight: 20 },
});
