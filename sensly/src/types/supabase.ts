export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_flagged: boolean | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          host_user_id: string | null
          id: string
          is_active: boolean | null
          join_code: string
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          host_user_id?: string | null
          id?: string
          is_active?: boolean | null
          join_code: string
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          host_user_id?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companion_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          created_at: string | null
          crowding_threshold_today: number | null
          id: string
          noise_threshold_today: number | null
          notes: string | null
          profile_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          crowding_threshold_today?: number | null
          id?: string
          noise_threshold_today?: number | null
          notes?: string | null
          profile_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          crowding_threshold_today?: number | null
          id?: string
          noise_threshold_today?: number | null
          notes?: string | null
          profile_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_insights: {
        Row: {
          generated_at: string | null
          id: string
          insights: Json
          user_id: string | null
          week_start: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          insights: Json
          user_id?: string | null
          week_start: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          insights?: Json
          user_id?: string | null
          week_start?: string
        }
        Relationships: []
      }
      profile_shares: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_shares_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          comfort_items: Json | null
          created_at: string | null
          crowding_threshold: number | null
          diagnosis_consent: boolean | null
          diagnosis_tags: Json | null
          display_name: string
          home_venue_id: string | null
          id: string
          is_default: boolean | null
          lighting_preference: string | null
          noise_threshold: number | null
          trigger_categories: Json | null
          triggers: Json | null
          user_id: string | null
        }
        Insert: {
          comfort_items?: Json | null
          created_at?: string | null
          crowding_threshold?: number | null
          diagnosis_consent?: boolean | null
          diagnosis_tags?: Json | null
          display_name?: string
          home_venue_id?: string | null
          id?: string
          is_default?: boolean | null
          lighting_preference?: string | null
          noise_threshold?: number | null
          trigger_categories?: Json | null
          triggers?: Json | null
          user_id?: string | null
        }
        Update: {
          comfort_items?: Json | null
          created_at?: string | null
          crowding_threshold?: number | null
          diagnosis_consent?: boolean | null
          diagnosis_tags?: Json | null
          display_name?: string
          home_venue_id?: string | null
          id?: string
          is_default?: boolean | null
          lighting_preference?: string | null
          noise_threshold?: number | null
          trigger_categories?: Json | null
          triggers?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_venue_id_fkey"
            columns: ["home_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string | null
          crowding: number | null
          day_of_week: number | null
          heart_rate: number | null
          id: string
          lighting: number | null
          noise_db: number | null
          noise_manual: number | null
          notes: string | null
          photo_url: string | null
          predictability: number | null
          smell: number | null
          stress_level: number | null
          time_of_day: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          crowding?: number | null
          day_of_week?: number | null
          heart_rate?: number | null
          id?: string
          lighting?: number | null
          noise_db?: number | null
          noise_manual?: number | null
          notes?: string | null
          photo_url?: string | null
          predictability?: number | null
          smell?: number | null
          stress_level?: number | null
          time_of_day?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          crowding?: number | null
          day_of_week?: number | null
          heart_rate?: number | null
          id?: string
          lighting?: number | null
          noise_db?: number | null
          noise_manual?: number | null
          notes?: string | null
          photo_url?: string | null
          predictability?: number | null
          smell?: number | null
          stress_level?: number | null
          time_of_day?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          is_home: boolean | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          is_home?: boolean | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          is_home?: boolean | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_follows: {
        Row: {
          created_at: string | null
          is_familiar: boolean | null
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          is_familiar?: boolean | null
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          is_familiar?: boolean | null
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_follows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          avg_crowding: number | null
          avg_lighting: number | null
          avg_noise_db: number | null
          avg_predictability: number | null
          avg_smell: number | null
          category: string | null
          created_at: string | null
          id: string
          is_home: boolean | null
          lat: number
          lng: number
          name: string
          osm_id: string | null
          overall_score: number | null
          quiet_hours: Json | null
          sensory_features: Json | null
          total_ratings: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avg_crowding?: number | null
          avg_lighting?: number | null
          avg_noise_db?: number | null
          avg_predictability?: number | null
          avg_smell?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_home?: boolean | null
          lat: number
          lng: number
          name: string
          osm_id?: string | null
          overall_score?: number | null
          quiet_hours?: Json | null
          sensory_features?: Json | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avg_crowding?: number | null
          avg_lighting?: number | null
          avg_noise_db?: number | null
          avg_predictability?: number | null
          avg_smell?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_home?: boolean | null
          lat?: number
          lng?: number
          name?: string
          osm_id?: string | null
          overall_score?: number | null
          quiet_hours?: Json | null
          sensory_features?: Json | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      earth: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
A new version of Supabase CLI is available: v2.95.4 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
