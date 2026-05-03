/**
 * Root navigator.
 * Tab order: Home (Dashboard) → Map → Calm → Profile
 * Matches designer's Layout.tsx intent with Dashboard as default.
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, Image } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { colors } from '../constants/theme';

import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { CalmScreen } from '../screens/calm/CalmScreen';
import { JournalScreen } from '../screens/journal/JournalScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AutoSenseScreen } from '../screens/rating/AutoSenseScreen';
import { ManualRatingScreen } from '../screens/rating/ManualRatingScreen';
import { VenueDetailScreen } from '../screens/venue/VenueDetailScreen';
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen';
import { CurrentSenseScreen } from '../screens/dashboard/CurrentSenseScreen';
import { InsightScreen } from '../screens/dashboard/InsightScreen';
import { DailyCheckIn } from '../components/profile/DailyCheckIn';
import { useProfileStore } from '../stores/profileStore';

import { AuthStackParamList, AppRootParamList, AppTabParamList } from './types';
import { RatingStackParamList } from '../screens/rating/AutoSenseScreen';

// ─── Auth stack ───────────────────────────────────────────────────────────────
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

// ─── Bottom tabs ──────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<AppTabParamList>();

function TabNavigator() {
  const { uiMode } = useSettingsStore();
  const selfMode = uiMode === 'self';

  // Custom tab icons from assets
  const TAB_ICONS: Record<string, any> = {
    Home: require('../../assets/home.png'),
    Journal: require('../../assets/journal.png'),
    Map: require('../../assets/map.png'),
    Calm: require('../../assets/calm.png'),
    Profile: require('../../assets/profile.png'),
  };

  const iconSize = selfMode ? 32 : 28;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: !selfMode,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderTopColor: 'rgba(79,179,191,0.2)',
          borderTopWidth: 1.5,
        },
        tabBarIcon: ({ focused }) => (
          <Image
            source={TAB_ICONS[route.name]}
            style={{
              width: iconSize,
              height: iconSize,
              opacity: focused ? 1 : 0.5,
            }}
            resizeMode="contain"
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Calm" component={CalmScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Rating modal stack ───────────────────────────────────────────────────────
const RatingStack = createNativeStackNavigator<RatingStackParamList>();

function RatingNavigator() {
  const route = useRoute<RouteProp<AppRootParamList, 'Rating'>>();
  const { venueId, venueName, venueLat, venueLng } = route.params;

  return (
    <RatingStack.Navigator screenOptions={{ headerShown: false }}>
      <RatingStack.Screen
        name="AutoSense"
        component={AutoSenseScreen}
        initialParams={{ venueId, venueName, venueLat, venueLng }}
      />
      <RatingStack.Screen name="ManualRating" component={ManualRatingScreen} />
    </RatingStack.Navigator>
  );
}

// ─── App root stack ───────────────────────────────────────────────────────────
const AppRootStack = createNativeStackNavigator<AppRootParamList>();

function AppNavigator() {
  const { hasCompletedOnboarding } = useSettingsStore();

  return (
    <AppRootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'}
    >
      <AppRootStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AppRootStack.Screen name="MainTabs" component={TabNavigator} />
      <AppRootStack.Screen
        name="Rating"
        component={RatingNavigator}
        options={{ presentation: 'modal' }}
      />
      <AppRootStack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <AppRootStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <AppRootStack.Screen name="CurrentSense" component={CurrentSenseScreen} />
      <AppRootStack.Screen name="Insight" component={InsightScreen} />
      <AppRootStack.Screen
        name="Calm"
        component={CalmScreen}
        options={{ presentation: 'modal' }}
      />
    </AppRootStack.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function RootNavigator() {
  const { session, setSession } = useAuthStore();
  const { fetchProfile, clear: clearProfile } = useProfileStore();
  const { hasCompletedOnboarding, _hasHydrated, resetOnboarding } = useSettingsStore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [showCheckIn, setShowCheckIn] = React.useState(false);
  const checkInShownRef = React.useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile();
        // Only show daily check-in once onboarding is complete
        if (!checkInShownRef.current && hasCompletedOnboarding) {
          checkInShownRef.current = true;
          setTimeout(() => setShowCheckIn(true), 1000);
        }
      }
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchProfile();
        } else {
          clearProfile();
          setShowCheckIn(false);
          checkInShownRef.current = false;
          // Reset onboarding flag so a new account on the same device sees the wizard
          resetOnboarding();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Wait for AsyncStorage to finish rehydrating the settings store.
  // Without this, initialRouteName in AppNavigator reads the default (false)
  // before the persisted value loads — causing returning users to see onboarding.
  if (isInitializing || !_hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <>
          <AppNavigator />
          <DailyCheckIn
            visible={showCheckIn}
            onDismiss={() => setShowCheckIn(false)}
          />
        </>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
