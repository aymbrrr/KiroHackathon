/**
 * Root navigator — switches between AuthStack and AppTabs
 * based on session state. Listens to Supabase auth state changes
 * and keeps the authStore in sync.
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { colors } from '../constants/theme';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { AutoSenseScreen } from '../screens/rating/AutoSenseScreen';
import { ManualRatingScreen } from '../screens/rating/ManualRatingScreen';
import { VenueDetailScreen } from '../screens/venue/VenueDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen';
import { AuthStackParamList, AppRootParamList, AppTabParamList } from './types';
import { RatingStackParamList } from '../screens/rating/AutoSenseScreen';

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

const Tab = createBottomTabNavigator<AppTabParamList>();

function TabNavigator() {
  const { uiMode } = useSettingsStore();
  const selfMode = uiMode === 'self';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: !selfMode,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderMuted,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Map: '🗺️', Search: '🔍', Followed: '⭐', Profile: '👤',
          };
          return <Text style={{ fontSize: selfMode ? 26 : 22 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

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
      <AppRootStack.Screen name="MainTabs" component={TabNavigator} />
      <AppRootStack.Screen
        name="Rating"
        component={RatingNavigator}
        options={{ presentation: 'modal' }}
      />
      <AppRootStack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <AppRootStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </AppRootStack.Navigator>
  );
}

export function RootNavigator() {
  const { session, setSession } = useAuthStore();
  const { fetchProfile, clear: clearProfile } = useProfileStore();
  const { hasCompletedOnboarding } = useSettingsStore();
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    // Restore session on app launch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile();
      setIsInitializing(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh).
    // IMPORTANT: Never call supabase.auth.* inside this callback — it causes
    // deadlocks. Only update local state (setSession is a Zustand setter, safe).
    // fetchProfile calls supabase.from('profiles') which is safe — not an auth call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          // Profile loads on sign in — auto-creates default if none exists
          fetchProfile();
        } else {
          clearProfile();
        }
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
