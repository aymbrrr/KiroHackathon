/**
 * AccessibilityContext — provides font scale and dyslexia font family
 * to all components. Changing these values re-renders the entire tree,
 * which is the only reliable way to update all Text components at once.
 *
 * Usage:
 *   const { fontScale, fontFamily } = useAccessibility();
 *   <Text style={{ fontSize: 16 * fontScale, fontFamily }}>Hello</Text>
 *
 * Or use the ScaledText component which handles this automatically.
 */
import React, { createContext, useContext } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export const FONT_SCALES = {
  normal: 1.0,
  large:  1.25,
  xlarge: 1.5,
};

interface AccessibilityContextValue {
  fontScale: number;
  fontFamily: string | undefined;
  letterSpacing: number;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  fontScale: 1.0,
  fontFamily: undefined,
  letterSpacing: 0,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { textSizeMode, dyslexiaMode } = useSettingsStore();

  const value: AccessibilityContextValue = {
    fontScale: FONT_SCALES[textSizeMode] ?? 1.0,
    // OpenDyslexic loaded via expo-font — falls back to system font if not loaded
    fontFamily: dyslexiaMode ? 'OpenDyslexic' : undefined,
    letterSpacing: dyslexiaMode ? 0.5 : 0,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
