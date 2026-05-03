/**
 * App entry point.
 *
 * The expo-sqlite localStorage polyfill MUST be the first import —
 * it patches the URL implementation that Supabase requires on Hermes/RN 0.81.
 * Do not move or reorder this import.
 */
import 'expo-sqlite/localStorage/install';

import { registerRootComponent } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* AccessibilityProvider re-renders the tree when text size or
            dyslexia mode changes, ensuring all ScaledText components update */}
        <AccessibilityProvider>
          <RootNavigator />
        </AccessibilityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
