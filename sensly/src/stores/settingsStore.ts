/**
 * Settings store — accessibility preferences, language.
 * Persisted to AsyncStorage via zustand/middleware.
 *
 * _hasHydrated: tracks whether AsyncStorage rehydration is complete.
 * RootNavigator waits for this before mounting AppNavigator so that
 * initialRouteName is set from the correct persisted value, not the default.
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
  _hasHydrated: boolean;

  setUiMode: (mode: UiMode) => void;
  setLanguage: (lang: string) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setTextSizeMode: (mode: TextSizeMode) => void;
  setOnboardingComplete: () => void;
  resetOnboarding: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      uiMode: 'self',
      language: 'en',
      colorBlindMode: 'none',
      textSizeMode: 'normal',
      hasCompletedOnboarding: false,
      _hasHydrated: false,

      setUiMode: (uiMode) => set({ uiMode }),
      setLanguage: (language) => set({ language }),
      setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
      setTextSizeMode: (textSizeMode) => set({ textSizeMode }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      // Called on sign-out so a new account on the same device sees onboarding
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'sensly-settings-v2',
      storage: createJSONStorage(() => AsyncStorage),
      // _hasHydrated is runtime-only — never persist it
      partialize: (state) => ({
        uiMode: state.uiMode,
        language: state.language,
        colorBlindMode: state.colorBlindMode,
        textSizeMode: state.textSizeMode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        // Called once AsyncStorage has finished loading into the store
        state?.setHasHydrated(true);
      },
    }
  )
);
