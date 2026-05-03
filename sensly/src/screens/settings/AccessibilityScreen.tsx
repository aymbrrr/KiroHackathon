/**
 * Accessibility screen — text size setting.
 * Embedded in the Profile tab.
 */
import React from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { useSettingsStore, TextSizeMode } from '../../stores/settingsStore';
import { ScaledText } from '../../components/shared/ScaledText';

const TEXT_SIZE_OPTIONS: Array<{ value: TextSizeMode; label: string; preview: number }> = [
  { value: 'normal', label: 'Normal',  preview: 16 },
  { value: 'large',  label: 'Large',   preview: 20 },
  { value: 'xlarge', label: 'X-Large', preview: 24 },
];

export function AccessibilityScreen() {
  const navigation = useNavigation();
  const { textSizeMode, setTextSizeMode } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ScaledText style={styles.backText}>← Back</ScaledText>
        </TouchableOpacity>
        <ScaledText style={styles.title}>Accessibility</ScaledText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Text size</ScaledText>
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
                  <ScaledText style={[styles.sizeLabel, selected && styles.sizeLabelSelected]}>
                    {opt.label}
                  </ScaledText>
                  {/* Fixed-size preview so you can compare before selecting */}
                  <ScaledText style={[{ fontSize: opt.preview }, styles.sizePreview, selected && styles.sizeLabelSelected]}>
                    Aa
                  </ScaledText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.infoBox}>
          <ScaledText style={styles.infoText}>
            💡 Text size applies across the whole app immediately.
          </ScaledText>
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
  sizePreview: { color: colors.textMuted, fontWeight: '700' },
  infoBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  infoText: { ...typography.bodySm, color: colors.primary, lineHeight: 20 },
});
