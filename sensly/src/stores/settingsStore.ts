/**
 * Settings store — accessibility preferences, language.
 * Persisted to AsyncStorage via zustand/middleware.
 *
 * Note: uiMode 'support' (caregiver mode) has been removed as out of scope.
 * The store retains the type for backward compatibility but only 'self' is used.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 'support' retained for type compatibility but no longer exposed in UI
export type UiMode = 'self';

/**
 * Color blindness simulation modes.
 * Research basis (Brettel et al. 1997, Viénot et al. 1999):
 *   - Deuteranopia: missing M-cones (green), affects ~6% of men — most common
 *   - Protanopia: missing L-cones (red), affects ~1% of men
 *   - Tritanopia: missing S-cones (blue), affects ~0.01% — rarest
 *   - Achromatopsia: complete color blindness (very rare, not simulated here)
 */
export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/**
 * Text size preference.
 * Research basis: WCAG 2.1 minimum 16sp body text; 20sp recommended for
 * users with low vision or cognitive differences (APCA guidelines).
 */
export type TextSizeMode = 'normal' | 'large' | 'xlarge';

interface SettingsState {
  uiMode: UiMode;
  language: string;
  colorBlindMode: ColorBlindMode;
  dyslexiaMode: boolean;
  highContrastMode: boolean;
  reduceMotion: boolean;
  textSizeMode: TextSizeMode;
  hasCompletedOnboarding: boolean;

  setUiMode: (mode: UiMode) => void;
  setLanguage: (lang: string) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setDyslexiaMode: (enabled: boolean) => void;
  setHighContrastMode: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setTextSizeMode: (mode: TextSizeMode) => void;
  setOnboardingComplete: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      uiMode: 'self',
      language: 'en',
      colorBlindMode: 'none',
      dyslexiaMode: false,
      highContrastMode: false,
      reduceMotion: false,
      textSizeMode: 'normal',
      hasCompletedOnboarding: false,

      setUiMode: (uiMode) => set({ uiMode }),
      setLanguage: (language) => set({ language }),
      setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
      setDyslexiaMode: (dyslexiaMode) => set({ dyslexiaMode }),
      setHighContrastMode: (highContrastMode) => set({ highContrastMode }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setTextSizeMode: (textSizeMode) => set({ textSizeMode }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'sensly-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
