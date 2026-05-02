import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

export function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [emailSent, setEmailSent] = useState(false);

  const handleSignUp = async () => {
    setLocalError('');
    clearError();

    if (!email.trim()) { setLocalError('Email is required'); return; }
    if (password.length < 8) { setLocalError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setLocalError('Passwords do not match'); return; }

    await signUp(email.trim().toLowerCase(), password);
    // If email confirmation is OFF in Supabase: onAuthStateChange fires immediately
    // and RootNavigator auto-switches to the map. Nothing needed here.
    // If email confirmation is ON: no session yet, show "check your email" message.
    setEmailSent(true);
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Your contributions are always anonymous to other users.
            </Text>
          </View>

          <View style={styles.form}>
            {displayError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {emailSent && !error ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  ✅ Check your email to confirm your account, then sign in.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SignIn')}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Go to sign in</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    returnKeyType="next"
                    accessibilityLabel="Email address"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    autoComplete="new-password"
                    returnKeyType="next"
                    accessibilityLabel="Password"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Confirm password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Repeat your password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    accessibilityLabel="Confirm password"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, (!email || !password || !confirm || isLoading) && styles.disabled]}
                  onPress={handleSignUp}
                  disabled={!email || !password || !confirm || isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                >
                  {isLoading
                    ? <ActivityIndicator color={colors.textInverse} />
                    : <Text style={styles.primaryButtonText}>Create account</Text>
                  }
                </TouchableOpacity>

                <Text style={styles.privacyNote}>
                  Your ratings and contributions are always anonymous. We never share your personal data.
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            accessibilityRole="button"
            style={styles.switchLink}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchTextBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: spacing.xl },
  header: { paddingTop: spacing.lg, marginBottom: spacing.xl },
  backButton: { marginBottom: spacing.md },
  backText: { ...typography.body, color: colors.primary },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: spacing.md },
  errorBox: { backgroundColor: '#FDECEA', borderRadius: 8, padding: spacing.md },
  errorText: { ...typography.bodySm, color: colors.error },
  successBox: { backgroundColor: '#E8F4FB', borderRadius: 8, padding: spacing.md, gap: spacing.md },
  successText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
  disabled: { opacity: 0.5 },
  privacyNote: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  switchLink: { alignItems: 'center', paddingVertical: spacing.xl },
  switchText: { ...typography.body, color: colors.textSecondary },
  switchTextBold: { color: colors.primary, fontWeight: '600' },
});
