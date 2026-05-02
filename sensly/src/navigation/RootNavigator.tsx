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
import { AutoSenseScreen } from '../screens/rating/AutoSenseScreen';
import { ManualRatingScreen } from '../screens/rating/ManualRatingScreen';
import { RatingStackParamList } from '../screens/rating/AutoSenseScreen';
import { AppRootParamList } from './types';
import { RouteProp, useRoute } from '@react-navigation/native';

const RatingStack = createNativeStackNavigator<RatingStackParamList>();
const AppRootStack = createNativeStackNavigator<AppRootParamList>();

function RatingNavigator() {
  const route = useRoute<RouteProp<AppRootParamList, 'Rating'>>();
  const { venueId, venueName } = route.params;

  return (
    <RatingStack.Navigator screenOptions={{ headerShown: false }}>
      <RatingStack.Screen
        name="AutoSense"
        component={AutoSenseScreen}
        initialParams={{ venueId, venueName }}
      />
      <RatingStack.Screen name="ManualRating" component={ManualRatingScreen} />
    </RatingStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppRootStack.Navigator screenOptions={{ headerShown: false }}>
      <AppRootStack.Screen name="MainMap" component={MapScreen} />
      <AppRootStack.Screen
        name="Rating"
        component={RatingNavigator}
        options={{ presentation: 'modal' }}
      />
    </AppRootStack.Navigator>
  );
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
