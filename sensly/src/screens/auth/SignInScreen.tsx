import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { AuthStackParamList } from '../../navigation/types';
import { ScaledText } from '../../components/shared/ScaledText';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
};

export function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    clearError();
    await signIn(email.trim().toLowerCase(), password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <ScaledText style={styles.backText}>← Back</ScaledText>
          </TouchableOpacity>
          <ScaledText style={styles.wordmark}>sensly</ScaledText>
          <ScaledText style={styles.title}>Welcome back</ScaledText>
        </View>

        <View style={[frostedCard, styles.form]}>
          {error ? (
            <View style={styles.errorBox}>
              <ScaledText style={styles.errorText}>{error}</ScaledText>
            </View>
          ) : null}

          <View style={styles.field}>
            <ScaledText style={styles.label}>Email</ScaledText>
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
            <ScaledText style={styles.label}>Password</ScaledText>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              accessibilityLabel="Password"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!email || !password || isLoading) && styles.disabled]}
            onPress={handleSignIn}
            disabled={!email || !password || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {isLoading
              ? <ActivityIndicator color={colors.textInverse} />
              : <ScaledText style={styles.primaryButtonText}>Sign in</ScaledText>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          accessibilityRole="button"
          style={styles.switchLink}
        >
          <ScaledText style={styles.switchText}>
            Don't have an account?{' '}
            <ScaledText style={styles.switchTextBold}>Create one</ScaledText>
          </ScaledText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#DFF6F7' },
  inner: { flex: 1, paddingHorizontal: spacing.xl },
  header: { paddingTop: spacing.lg, marginBottom: spacing.xl },
  backButton: { marginBottom: spacing.md },
  backText: { ...typography.body, color: colors.primary },
  wordmark: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  form: { gap: spacing.md, padding: spacing.lg },
  errorBox: {
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: spacing.md,
  },
  errorText: { ...typography.bodySm, color: colors.error },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary },
  input: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(58,172,178,0.4)',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
  disabled: { opacity: 0.5 },
  switchLink: { alignItems: 'center', paddingVertical: spacing.xl },
  switchText: { ...typography.body, color: colors.textSecondary },
  switchTextBold: { color: colors.primary, fontWeight: '600' },
});
