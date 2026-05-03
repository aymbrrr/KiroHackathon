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
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { AppRootParamList } from '../../navigation/types';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const { user, signOut } = useAuthStore();

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

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('AccessibilitySettings')}
            accessibilityRole="button"
          >
            <Text style={styles.menuRowText}>Color vision, dyslexia, text size</Text>
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
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeButton: {
    flex: 1,
    ...frostedCard,
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
});
