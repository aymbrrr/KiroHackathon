/**
 * Settings store — UI mode, accessibility preferences, language.
 * Persisted to AsyncStorage via zustand/middleware.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UiMode = 'self' | 'support';
export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

interface SettingsState {
  uiMode: UiMode;
  language: string;
  colorBlindMode: ColorBlindMode;
  dyslexiaMode: boolean;
  hasCompletedOnboarding: boolean;

  setUiMode: (mode: UiMode) => void;
  setLanguage: (lang: string) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setDyslexiaMode: (enabled: boolean) => void;
  setOnboardingComplete: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      uiMode: 'self',
      language: 'en',
      colorBlindMode: 'none',
      dyslexiaMode: false,
      hasCompletedOnboarding: false,

      setUiMode: (uiMode) => set({ uiMode }),
      setLanguage: (language) => set({ language }),
      setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
      setDyslexiaMode: (dyslexiaMode) => set({ dyslexiaMode }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'sensly-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
