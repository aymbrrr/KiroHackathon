/**
 * Root navigator — switches between AuthStack and AppTabs
 * based on session state. Listens to Supabase auth state changes
 * and keeps the authStore in sync.
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { colors } from '../constants/theme';

import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

import { MapScreen } from '../screens/map/MapScreen';

// Placeholder for the main app tabs — built in Step 3+
function AppNavigator() {
  return <MapScreen />;
}

export function RootNavigator() {
  const { session, setSession } = useAuthStore();
  const { hasCompletedOnboarding } = useSettingsStore();
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    // Restore session on app launch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh).
    // IMPORTANT: Never call supabase.auth.* inside this callback — it causes
    // deadlocks. Only update local state (setSession is a Zustand setter, safe).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Unsubscribe on unmount to prevent memory leaks
    return () => subscription.unsubscribe();
  }, []); // Empty array — runs once on mount only

  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
