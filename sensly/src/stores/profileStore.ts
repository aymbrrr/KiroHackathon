/**
 * Profile store — active sensory profile, daily threshold override.
 *
 * The profile is loaded from Supabase on auth, and kept in memory.
 * Daily check-in can override the noise threshold for the day.
 * effectiveNoiseThreshold is the value all other code should use.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface SensoryProfile {
  id: string;
  user_id: string;
  display_name: string;
  noise_threshold: number;
  lighting_preference: 'dim' | 'moderate' | 'bright';
  crowding_threshold: number;
  triggers: string[];
  trigger_categories: string[];
  comfort_items: string[];
  diagnosis_tags: string[];
  diagnosis_consent: boolean;
  is_default: boolean;
  created_at: string;
}

interface ProfileState {
  profile: SensoryProfile | null;
  isLoading: boolean;
  error: string | null;
  dailyThresholdOverride: number | null;

  // Derived — use this everywhere, not profile.noise_threshold directly
  effectiveNoiseThreshold: number;

  // Actions
  fetchProfile: () => Promise<void>;
  saveProfile: (data: Partial<SensoryProfile>) => Promise<void>;
  setDailyOverride: (threshold: number | null) => void;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  dailyThresholdOverride: null,

  get effectiveNoiseThreshold() {
    const state = get();
    return state.dailyThresholdOverride ?? state.profile?.noise_threshold ?? 65;
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false, profile: null });
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile exists yet — create a default one
      const defaultProfile = {
        user_id: user.id,
        display_name: 'My profile',
        noise_threshold: 65,
        lighting_preference: 'moderate' as const,
        crowding_threshold: 3,
        triggers: [],
        trigger_categories: [],
        comfort_items: [],
        diagnosis_tags: [],
        diagnosis_consent: false,
        is_default: true,
      };

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (createError) {
        set({ isLoading: false, error: createError.message });
      } else {
        set({ isLoading: false, profile: created as SensoryProfile });
      }
      return;
    }

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      set({ isLoading: false, profile: data as SensoryProfile });
    }
  },

  saveProfile: async (updates) => {
    const { profile } = get();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true, error: null });

    if (profile) {
      // Update existing
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        set({ isLoading: false, error: error.message });
      } else {
        set({ isLoading: false, profile: data as SensoryProfile });
      }
    } else {
      // Create new
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: 'My profile',
          is_default: true,
          ...updates,
        })
        .select()
        .single();

      if (error) {
        set({ isLoading: false, error: error.message });
      } else {
        set({ isLoading: false, profile: data as SensoryProfile });
      }
    }
  },

  setDailyOverride: (threshold) => {
    set({ dailyThresholdOverride: threshold });
  },

  clear: () => {
    set({ profile: null, dailyThresholdOverride: null, error: null });
  },
}));
