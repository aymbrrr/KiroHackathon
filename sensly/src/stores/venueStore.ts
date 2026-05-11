/**
 * Venue store — nearby venues, followed venues, venue cache.
 * Venues are fetched from Supabase (seeded data + user contributions)
 * and supplemented by Overpass API for OSM venues not yet in our DB.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { scoreToPinStyle, weightedOverallScore } from '../lib/sensoryUtils';

export interface QuietHour {
  day: string;
  start: string;
  end: string;
  label: string;
}

export interface Venue {
  id: string;
  osm_id: string | null;
  name: string;
  category: string | null;
  lat: number;
  lng: number;
  address: string | null;
  avg_noise_db: number | null;
  avg_lighting: number | null;
  avg_crowding: number | null;
  avg_smell: number | null;
  avg_predictability: number | null;
  overall_score: number | null;
  total_ratings: number;
  quiet_hours: QuietHour[] | null;
  sensory_features: string[] | null;
}

interface VenueState {
  nearbyVenues: Venue[];
  venueCache: Record<string, Venue>;
  isLoading: boolean;
  error: string | null;

  fetchNearbyFromDB: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  getVenueById: (id: string) => Promise<Venue | null>;
  upsertVenue: (venue: Partial<Venue>) => Promise<Venue | null>;
  clearError: () => void;
}

export const useVenueStore = create<VenueState>((set, get) => ({
  nearbyVenues: [],
  venueCache: {},
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchNearbyFromDB: async (lat, lng, radiusKm = 0.5) => {
    set({ isLoading: true, error: null });
    try {
      // Use Supabase's earthdistance extension via RPC for radius query
      // Falls back to bounding box if RPC not available
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .gte('lat', lat - latDelta)
        .lte('lat', lat + latDelta)
        .gte('lng', lng - lngDelta)
        .lte('lng', lng + lngDelta)
        .order('total_ratings', { ascending: false })
        .limit(50);

      if (error) throw error;

      const venues = (data ?? []) as Venue[];
      const cache = { ...get().venueCache };
      venues.forEach((v) => { cache[v.id] = v; });

      set({ nearbyVenues: venues, venueCache: cache, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  getVenueById: async (id) => {
    const cached = get().venueCache[id];
    if (cached) return cached;

    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    const venue = data as Venue;
    set((state) => ({ venueCache: { ...state.venueCache, [id]: venue } }));
    return venue;
  },

  upsertVenue: async (venue) => {
    const { data, error } = await supabase
      .from('venues')
      .upsert(venue, { onConflict: 'osm_id' })
      .select()
      .single();

    if (error || !data) return null;
    const saved = data as Venue;
    set((state) => ({
      venueCache: { ...state.venueCache, [saved.id]: saved },
    }));
    return saved;
  },
}));
