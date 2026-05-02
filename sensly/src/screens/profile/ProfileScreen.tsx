/**
 * Profile screen — shows active profile, allows switching,
 * links to settings and profile edit.
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { AppRootParamList } from '../../navigation/types';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const { user, signOut } = useAuthStore();
  const { uiMode, setUiMode } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Profile</Text>

        {/* UI Mode toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who is using this app?</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeButton, uiMode === 'self' && styles.modeButtonActive]}
              onPress={() => setUiMode('self')}
              accessibilityRole="radio"
              accessibilityState={{ selected: uiMode === 'self' }}
            >
              <Text style={styles.modeIcon}>🧠</Text>
              <Text style={[styles.modeLabel, uiMode === 'self' && styles.modeLabelActive]}>
                Me
              </Text>
              <Text style={styles.modeDesc}>Large text, simple view</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, uiMode === 'support' && styles.modeButtonActive]}
              onPress={() => setUiMode('support')}
              accessibilityRole="radio"
              accessibilityState={{ selected: uiMode === 'support' }}
            >
              <Text style={styles.modeIcon}>🤝</Text>
              <Text style={[styles.modeLabel, uiMode === 'support' && styles.modeLabelActive]}>
                Supporting someone
              </Text>
              <Text style={styles.modeDesc}>Full details, caregiver view</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  content: { padding: spacing.lg, gap: spacing.xl },
  heading: { ...typography.heading1, color: colors.textPrimary },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.textSecondary },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  modeIcon: { fontSize: 28 },
  modeLabel: { ...typography.label, color: colors.textPrimary, textAlign: 'center' },
  modeLabelActive: { color: colors.primary },
  modeDesc: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', fontSize: 11 },
  menuRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
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
});
