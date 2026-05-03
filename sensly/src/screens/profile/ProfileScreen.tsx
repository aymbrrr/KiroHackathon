/**
 * Profile screen — sensory preferences, accessibility settings, account.
 * Accessibility settings are embedded inline (text size + dyslexia mode).
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore, TextSizeMode } from '../../stores/settingsStore';
import { AppRootParamList } from '../../navigation/types';

const TEXT_SIZE_OPTIONS: Array<{ value: TextSizeMode; label: string; preview: number }> = [
  { value: 'normal', label: 'Normal',  preview: 16 },
  { value: 'large',  label: 'Large',   preview: 20 },
  { value: 'xlarge', label: 'X-Large', preview: 24 },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const { user, signOut } = useAuthStore();
  const {
    dyslexiaMode, setDyslexiaMode,
    textSizeMode, setTextSizeMode,
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Profile</Text>

        {/* Sensory preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensory preferences</Text>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('ProfileEdit')}
            accessibilityRole="button"
          >
            <Text style={styles.menuRowText}>Edit noise threshold & triggers</Text>
            <Text style={styles.menuRowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Accessibility — inline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>

          {/* Text size */}
          <Text style={styles.subLabel}>Text size</Text>
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
                  {/* Live preview of the font size */}
                  <Text style={[styles.sizePreview, { fontSize: opt.preview }, selected && styles.sizeLabelSelected]}>
                    Aa
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dyslexia mode */}
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

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuRow}>
            <Text style={styles.menuRowText}>{user?.email ?? 'Signed in'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.menuRow, styles.signOutRow]}
            onPress={signOut}
            accessibilityRole="button"
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  heading: { ...typography.heading1, color: colors.textPrimary },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  subLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuRow: {
    ...frostedCard,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  menuRowText: { ...typography.body, color: colors.textPrimary },
  menuRowArrow: { ...typography.body, color: colors.textMuted, fontSize: 20 },
  signOutRow: { backgroundColor: '#FDECEA' },
  signOutText: { ...typography.body, color: colors.error, fontWeight: '600' },
  // Text size
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
  sizeLabel: { ...typography.label, color: colors.textPrimary, fontSize: 12 },
  sizeLabelSelected: { color: colors.primary },
  sizePreview: { color: colors.textMuted, fontWeight: '700' },
  // Dyslexia toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleLabel: { ...typography.label, color: colors.textPrimary },
  toggleDesc: { ...typography.bodySm, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
});
