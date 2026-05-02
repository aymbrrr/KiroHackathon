/**
 * Supabase database types.
 *
 * In production, generate this file with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 *
 * For now, hand-written to match the schema in detailed-design.md Section 4.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      venues: {
        Row: {
          id:                   string;
          osm_id:               string | null;
          name:                 string;
          category:             string | null;
          lat:                  number;
          lng:                  number;
          address:              string | null;
          avg_noise_db:         number | null;
          avg_lighting:         number | null;
          avg_crowding:         number | null;
          avg_smell:            number | null;
          avg_predictability:   number | null;
          overall_score:        number | null;
          total_ratings:        number;
          quiet_hours:          Json | null;
          sensory_features:     Json | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: Omit<Database['public']['Tables']['venues']['Row'],
          'id' | 'created_at' | 'updated_at' | 'total_ratings'>;
        Update: Partial<Database['public']['Tables']['venues']['Insert']>;
      };

      ratings: {
        Row: {
          id:             string;
          venue_id:       string;
          user_id:        string;
          noise_db:       number | null;
          noise_manual:   number | null;
          lighting:       number | null;
          crowding:       number | null;
          smell:          number | null;
          predictability: number | null;
          time_of_day:    'morning' | 'afternoon' | 'evening' | 'night' | null;
          day_of_week:    number | null;
          heart_rate:     number | null;
          stress_level:   number | null;
          notes:          string | null;
          photo_url:      string | null;
          created_at:     string;
        };
        Insert: Omit<Database['public']['Tables']['ratings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
      };

      profiles: {
        Row: {
          id:                   string;
          user_id:              string;
          display_name:         string;
          noise_threshold:      number;
          lighting_preference:  'dim' | 'moderate' | 'bright';
          crowding_threshold:   number;
          triggers:             string[];
          trigger_categories:   string[];
          comfort_items:        string[];
          diagnosis_tags:       string[];
          diagnosis_consent:    boolean;
          is_default:           boolean;
          created_at:           string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      comments: {
        Row: {
          id:         string;
          venue_id:   string;
          user_id:    string;
          body:       string;
          is_flagged: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };

      venue_follows: {
        Row: {
          user_id:      string;
          venue_id:     string;
          is_familiar:  boolean;
          created_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['venue_follows']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['venue_follows']['Insert']>;
      };

      user_activity: {
        Row: {
          id:             string;
          user_id:        string;
          activity_type:  'rating' | 'home_log' | 'check_in';
          venue_id:       string | null;
          is_home:        boolean;
          created_at:     string;
        };
        Insert: Omit<Database['public']['Tables']['user_activity']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_activity']['Insert']>;
      };

      daily_checkins: {
        Row: {
          id:                       string;
          user_id:                  string;
          profile_id:               string;
          noise_threshold_today:    number | null;
          crowding_threshold_today: number | null;
          notes:                    string | null;
          created_at:               string;
        };
        Insert: Omit<Database['public']['Tables']['daily_checkins']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['daily_checkins']['Insert']>;
      };

      companion_sessions: {
        Row: {
          id:           string;
          host_user_id: string;
          join_code:    string;
          profile_id:   string | null;
          is_active:    boolean;
          created_at:   string;
          expires_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['companion_sessions']['Row'], 'id' | 'created_at' | 'expires_at'>;
        Update: Partial<Database['public']['Tables']['companion_sessions']['Insert']>;
      };

      profile_shares: {
        Row: {
          id:         string;
          user_id:    string;
          profile_id: string;
          token:      string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profile_shares']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['profile_shares']['Insert']>;
      };

      journal_insights: {
        Row: {
          id:           string;
          user_id:      string;
          week_start:   string;
          insights:     Json;
          generated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['journal_insights']['Row'], 'id' | 'generated_at'>;
        Update: Partial<Database['public']['Tables']['journal_insights']['Insert']>;
      };
    };
  };
}
