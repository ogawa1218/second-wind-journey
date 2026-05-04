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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          content: string
          context_data: Json | null
          cost_usd: number | null
          created_at: string
          id: string
          input_tokens: number | null
          kind: Database["public"]["Enums"]["ai_kind_type"]
          model: string | null
          output_tokens: number | null
          role: Database["public"]["Enums"]["ai_role_type"]
          user_id: string
        }
        Insert: {
          content: string
          context_data?: Json | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          kind: Database["public"]["Enums"]["ai_kind_type"]
          model?: string | null
          output_tokens?: number | null
          role: Database["public"]["Enums"]["ai_role_type"]
          user_id: string
        }
        Update: {
          content?: string
          context_data?: Json | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          kind?: Database["public"]["Enums"]["ai_kind_type"]
          model?: string | null
          output_tokens?: number | null
          role?: Database["public"]["Enums"]["ai_role_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
      checkup_results: {
        Row: {
          created_at: string
          diastolic_bp: number | null
          examined_on: string
          hba1c: number | null
          hdl: number | null
          id: string
          ldl: number | null
          raw_pdf_url: string | null
          systolic_bp: number | null
          triglyceride: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          diastolic_bp?: number | null
          examined_on: string
          hba1c?: number | null
          hdl?: number | null
          id?: string
          ldl?: number | null
          raw_pdf_url?: string | null
          systolic_bp?: number | null
          triglyceride?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          diastolic_bp?: number | null
          examined_on?: string
          hba1c?: number | null
          hdl?: number | null
          id?: string
          ldl?: number | null
          raw_pdf_url?: string | null
          systolic_bp?: number | null
          triglyceride?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkup_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkup_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_records: {
        Row: {
          body_fat_percent: number | null
          created_at: string
          id: string
          mood: number | null
          note: string | null
          record_date: string
          resting_heart_rate: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_percent?: number | null
          created_at?: string
          id?: string
          mood?: number | null
          note?: string | null
          record_date: string
          resting_heart_rate?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_percent?: number | null
          created_at?: string
          id?: string
          mood?: number | null
          note?: string | null
          record_date?: string
          resting_heart_rate?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          avg_heart_rate: number | null
          avg_pace_seconds_per_km: number | null
          created_at: string
          distance_km: number
          duration_seconds: number
          elevation_gain_m: number | null
          external_id: string | null
          id: string
          ran_at: string
          raw_data: Json | null
          source: Database["public"]["Enums"]["run_source_type"]
          user_id: string
        }
        Insert: {
          avg_heart_rate?: number | null
          avg_pace_seconds_per_km?: number | null
          created_at?: string
          distance_km: number
          duration_seconds: number
          elevation_gain_m?: number | null
          external_id?: string | null
          id?: string
          ran_at: string
          raw_data?: Json | null
          source?: Database["public"]["Enums"]["run_source_type"]
          user_id: string
        }
        Update: {
          avg_heart_rate?: number | null
          avg_pace_seconds_per_km?: number | null
          created_at?: string
          distance_km?: number
          duration_seconds?: number
          elevation_gain_m?: number | null
          external_id?: string | null
          id?: string
          ran_at?: string
          raw_data?: Json | null
          source?: Database["public"]["Enums"]["run_source_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          birth_date: string | null
          coach_tone: Database["public"]["Enums"]["coach_tone_type"]
          created_at: string
          crisis_detected_at: string | null
          display_name: string | null
          email: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string
          onboarding_completed_at: string | null
          target_full_marathon_seconds: number | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          coach_tone?: Database["public"]["Enums"]["coach_tone_type"]
          created_at?: string
          crisis_detected_at?: string | null
          display_name?: string | null
          email: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id: string
          onboarding_completed_at?: string | null
          target_full_marathon_seconds?: number | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          coach_tone?: Database["public"]["Enums"]["coach_tone_type"]
          created_at?: string
          crisis_detected_at?: string | null
          display_name?: string | null
          email?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          onboarding_completed_at?: string | null
          target_full_marathon_seconds?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      vitality_score_snapshots: {
        Row: {
          breakdown: Json
          chronological_age: number
          clipped: boolean
          created_at: string
          diff: number
          id: string
          layer1_score: number
          layer2_score: number | null
          reliability: Database["public"]["Enums"]["reliability_type"]
          snapshot_date: string
          user_id: string
          vitality_score: number
        }
        Insert: {
          breakdown: Json
          chronological_age: number
          clipped?: boolean
          created_at?: string
          diff: number
          id?: string
          layer1_score: number
          layer2_score?: number | null
          reliability: Database["public"]["Enums"]["reliability_type"]
          snapshot_date: string
          user_id: string
          vitality_score: number
        }
        Update: {
          breakdown?: Json
          chronological_age?: number
          clipped?: boolean
          created_at?: string
          diff?: number
          id?: string
          layer1_score?: number
          layer2_score?: number | null
          reliability?: Database["public"]["Enums"]["reliability_type"]
          snapshot_date?: string
          user_id?: string
          vitality_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "vitality_score_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitality_score_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          created_at: string
          id: string
          markdown_content: string
          stats: Json | null
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          markdown_content: string
          stats?: Json | null
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          markdown_content?: string
          stats?: Json | null
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_global_monthly_ai_cost: {
        Row: {
          active_users: number | null
          global_budget_pct: number | null
          month: string | null
          total_cost_usd: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      v_latest_vitality_score: {
        Row: {
          breakdown: Json | null
          chronological_age: number | null
          clipped: boolean | null
          diff: number | null
          layer1_score: number | null
          layer2_score: number | null
          prev_vitality_score: number | null
          reliability: Database["public"]["Enums"]["reliability_type"] | null
          score_delta: number | null
          snapshot_date: string | null
          user_id: string | null
          vitality_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitality_score_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitality_score_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
      v_monthly_ai_usage: {
        Row: {
          budget_usage_pct: number | null
          month: string | null
          request_count: number | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_age: {
        Row: {
          age_decimal: number | null
          age_years: number | null
          birth_date: string | null
          coach_tone: Database["public"]["Enums"]["coach_tone_type"] | null
          created_at: string | null
          crisis_detected_at: string | null
          display_name: string | null
          email: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string | null
          onboarding_completed_at: string | null
          target_full_marathon_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          age_decimal?: never
          age_years?: never
          birth_date?: string | null
          coach_tone?: Database["public"]["Enums"]["coach_tone_type"] | null
          created_at?: string | null
          crisis_detected_at?: string | null
          display_name?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string | null
          onboarding_completed_at?: string | null
          target_full_marathon_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          age_decimal?: never
          age_years?: never
          birth_date?: string | null
          coach_tone?: Database["public"]["Enums"]["coach_tone_type"] | null
          created_at?: string | null
          crisis_detected_at?: string | null
          display_name?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string | null
          onboarding_completed_at?: string | null
          target_full_marathon_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_weekly_run_stats: {
        Row: {
          avg_pace_seconds_per_km: number | null
          best_pace_seconds_per_km: number | null
          last_ran_at: string | null
          run_count: number | null
          run_days: number | null
          total_distance_km: number | null
          total_duration_seconds: number | null
          user_id: string | null
          weekly_met_minutes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_age"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_kind_type:
        | "daily_action"
        | "chat"
        | "weekly_review"
        | "crisis_response"
      ai_role_type: "user" | "assistant" | "system"
      coach_tone_type: "coach" | "spartan" | "supporter"
      gender_type: "male" | "female" | "other"
      reliability_type: "low" | "medium" | "high"
      run_source_type: "garmin" | "strava" | "manual"
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
    Enums: {
      ai_kind_type: [
        "daily_action",
        "chat",
        "weekly_review",
        "crisis_response",
      ],
      ai_role_type: ["user", "assistant", "system"],
      coach_tone_type: ["coach", "spartan", "supporter"],
      gender_type: ["male", "female", "other"],
      reliability_type: ["low", "medium", "high"],
      run_source_type: ["garmin", "strava", "manual"],
    },
  },
} as const
