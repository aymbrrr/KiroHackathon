/**
 * Settings store — accessibility preferences, language.
 * Persisted to AsyncStorage via zustand/middleware.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UiMode = 'self' | 'support';
export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
export type TextSizeMode = 'normal' | 'large' | 'xlarge';

interface SettingsState {
  uiMode: UiMode;
  language: string;
  colorBlindMode: ColorBlindMode;
  textSizeMode: TextSizeMode;
  hasCompletedOnboarding: boolean;

  setUiMode: (mode: UiMode) => void;
  setLanguage: (lang: string) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setTextSizeMode: (mode: TextSizeMode) => void;
  setOnboardingComplete: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      uiMode: 'self',
      language: 'en',
      colorBlindMode: 'none',
      textSizeMode: 'normal',
      hasCompletedOnboarding: false,

      setUiMode: (uiMode) => set({ uiMode }),
      setLanguage: (language) => set({ language }),
      setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
      setTextSizeMode: (textSizeMode) => set({ textSizeMode }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'sensly-settings-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
