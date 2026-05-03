/**
 * AccessibilityContext — provides font scale to all ScaledText components.
 * Changing textSizeMode re-renders the entire tree so all text updates instantly.
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
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  fontScale: 1.0,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { textSizeMode } = useSettingsStore();

  return (
    <AccessibilityContext.Provider value={{ fontScale: FONT_SCALES[textSizeMode] ?? 1.0 }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
