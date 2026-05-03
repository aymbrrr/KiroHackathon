/**
 * Profile screen — sensory preferences, accessibility settings, account.
 * Accessibility settings are embedded inline (text size only).
 */
import React from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore, TextSizeMode } from '../../stores/settingsStore';
import { AppRootParamList } from '../../navigation/types';
import { ScaledText } from '../../components/shared/ScaledText';
import { KelpBackground } from '../../components/shared/KelpBackground';

const TEXT_SIZE_OPTIONS: Array<{ value: TextSizeMode; label: string; preview: number }> = [
  { value: 'normal', label: 'Normal',  preview: 16 },
  { value: 'large',  label: 'Large',   preview: 20 },
  { value: 'xlarge', label: 'X-Large', preview: 24 },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const { user, signOut } = useAuthStore();
  const { textSizeMode, setTextSizeMode } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <KelpBackground variant="kelp2">
      <ScrollView contentContainerStyle={styles.content}>
        <ScaledText style={styles.heading}>Profile</ScaledText>

        {/* Sensory preferences */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Sensory preferences</ScaledText>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('ProfileEdit')}
            accessibilityRole="button"
          >
            <ScaledText style={styles.menuRowText}>Sensory preferences</ScaledText>
            <ScaledText style={styles.menuRowArrow}>›</ScaledText>
          </TouchableOpacity>
        </View>

        {/* Accessibility — inline */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Accessibility</ScaledText>

          {/* Text size */}
          <ScaledText style={styles.subLabel}>Text size</ScaledText>
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
                  {/* Preview uses fixed size so you can see the difference before selecting */}
                  <Text style={[styles.sizePreview, { fontSize: opt.preview }, selected && styles.sizeLabelSelected]}>
                    Aa
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <ScaledText style={styles.sectionTitle}>Account</ScaledText>
          <View style={styles.menuRow}>
            <ScaledText style={styles.menuRowText}>{user?.email ?? 'Signed in'}</ScaledText>
          </View>
          <TouchableOpacity
            style={[styles.menuRow, styles.signOutRow]}
            onPress={signOut}
            accessibilityRole="button"
          >
            <ScaledText style={styles.signOutText}>Sign out</ScaledText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KelpBackground>
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
});
