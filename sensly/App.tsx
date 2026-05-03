/**
 * App entry point.
 *
 * The expo-sqlite localStorage polyfill MUST be the first import —
 * it patches the URL implementation that Supabase requires on Hermes/RN 0.81.
 * Do not move or reorder this import.
 */
import 'expo-sqlite/localStorage/install';

import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AccessibilityWrapper } from './src/components/accessibility/AccessibilityWrapper';
import { colors } from './src/constants/theme';

function App() {
  // Load OpenDyslexic at startup so it's available immediately when
  // dyslexia mode is toggled in Accessibility Settings.
  // SIL-OFL license — free for any use.
  const [fontsLoaded, fontError] = useFonts({
    'OpenDyslexic': require('./assets/fonts/OpenDyslexic-Regular.otf'),
    'OpenDyslexic-Bold': require('./assets/fonts/OpenDyslexic-Bold.otf'),
  });

  // Wait for fonts before rendering — prevents flash of unstyled text
  // when dyslexia mode is already enabled from a previous session.
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // fontError means the font file is missing — app still works, just falls
  // back to system font with increased spacing in dyslexia mode.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AccessibilityWrapper>
          <RootNavigator />
        </AccessibilityWrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
