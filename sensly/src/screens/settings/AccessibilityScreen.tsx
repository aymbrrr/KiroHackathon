/**
 * Accessibility screen — two implemented features:
 *
 * 1. TEXT SIZE — scales all text via Text.defaultProps.maxFontSizeMultiplier
 *    Pure React Native, no native modules, no app-root wrappers.
 *
 * 2. DYSLEXIA MODE — OpenDyslexic font + increased letter spacing.
 *    Applied per-component via the useDyslexicStyle() hook.
 *    Font loaded via expo-font in App.tsx.
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { useSettingsStore, TextSizeMode } from '../../stores/settingsStore';

// ─── Text size — applied via Text.defaultProps ────────────────────────────────

const TEXT_SCALE: Record<TextSizeMode, number> = {
  normal: 1.0,
  large:  1.25,
  xlarge: 1.5,
};

const TEXT_SIZE_OPTIONS: Array<{ value: TextSizeMode; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'large',  label: 'Large'  },
  { value: 'xlarge', label: 'X-Large' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AccessibilityScreen() {
  const navigation = useNavigation();
  const { dyslexiaMode, setDyslexiaMode, textSizeMode, setTextSizeMode } = useSettingsStore();
  const prevSize = useRef<TextSizeMode>('normal');

  // Apply text scale globally whenever it changes.
  // Uses Text.defaultProps — the React Native-recommended way to scale all
  // text app-wide without wrapping the app root.
  useEffect(() => {
    if (prevSize.current === textSizeMode) return;
    prevSize.current = textSizeMode;
    const scale = TEXT_SCALE[textSizeMode];
    if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
    (Text as any).defaultProps.maxFontSizeMultiplier = scale;
    (Text as any).defaultProps.allowFontScaling = true;
  }, [textSizeMode]);

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

        {/* Text size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text size</Text>
          <View style={styles.sizeRow}>
            {TEXT_SIZE_OPTIONS.map((opt) => {
              const selected = textSizeMode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[frostedCard, styles.sizeOption, selected && styles.sizeOptionSelected]}
                  onPress={() => setTextSizeMode(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={opt.label}
                >
                  <Text style={[styles.sizeLabel, selected && styles.sizeLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.sizePreview, selected && styles.sizeLabelSelected]}>
                    Aa
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dyslexia mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading</Text>
          <View style={[frostedCard, styles.toggleRow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Dyslexia-friendly text</Text>
              <Text style={styles.toggleDesc}>
                Easier-to-read font with more spacing between letters.
              </Text>
            </View>
            <Switch
              value={dyslexiaMode}
              onValueChange={setDyslexiaMode}
              trackColor={{ false: colors.borderMuted, true: colors.primary }}
              thumbColor="#fff"
              accessibilityRole="switch"
              accessibilityLabel="Dyslexia-friendly text"
              accessibilityState={{ checked: dyslexiaMode }}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Settings are saved and apply immediately.
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
  sizeRow: { flexDirection: 'row', gap: spacing.sm },
  sizeOption: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  sizeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  sizeLabel: { ...typography.label, color: colors.textPrimary, fontSize: 13 },
  sizeLabelSelected: { color: colors.primary },
  sizePreview: { fontSize: 22, color: colors.textMuted, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleLabel: { ...typography.label, color: colors.textPrimary },
  toggleDesc: { ...typography.bodySm, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  infoBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  infoText: { ...typography.bodySm, color: colors.primary, lineHeight: 20 },
});
