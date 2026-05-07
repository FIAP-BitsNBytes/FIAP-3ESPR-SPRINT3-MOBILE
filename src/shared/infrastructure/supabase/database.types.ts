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
      appointments: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          id: string
          nutritionist_id: string
          patient_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nutritionist_id: string
          patient_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nutritionist_id?: string
          patient_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      evolution_logs: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          date: string
          deleted_at: string | null
          fat_percentage: number | null
          id: string
          muscle_mass: number | null
          notes: string | null
          nutritionist_id: string
          patient_id: string
          updated_at: string
          updated_by: string | null
          weight: number
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          fat_percentage?: number | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          nutritionist_id: string
          patient_id: string
          updated_at?: string
          updated_by?: string | null
          weight: number
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          fat_percentage?: number | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evolution_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_logs_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_stats: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          experience: number
          level: number
          nutritionist_id: string | null
          patient_id: string
          points: number
          streak_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          experience?: number
          level?: number
          nutritionist_id?: string | null
          patient_id: string
          points?: number
          streak_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          experience?: number
          level?: number
          nutritionist_id?: string | null
          patient_id?: string
          points?: number
          streak_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_stats_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_stats_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_stats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          calories: number | null
          category: Database["public"]["Enums"]["log_type"]
          clinic_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          food_name: string
          id: string
          logged_at: string
          notes: string | null
          nutritionist_id: string | null
          patient_id: string
          plan_item_id: string | null
          quantity: number
          unit: Database["public"]["Enums"]["measurement_unit"]
          updated_at: string
          updated_by: string | null
          xp_earned: number
        }
        Insert: {
          calories?: number | null
          category?: Database["public"]["Enums"]["log_type"]
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          food_name: string
          id?: string
          logged_at?: string
          notes?: string | null
          nutritionist_id?: string | null
          patient_id: string
          plan_item_id?: string | null
          quantity?: number
          unit?: Database["public"]["Enums"]["measurement_unit"]
          updated_at?: string
          updated_by?: string | null
          xp_earned?: number
        }
        Update: {
          calories?: number | null
          category?: Database["public"]["Enums"]["log_type"]
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          food_name?: string
          id?: string
          logged_at?: string
          notes?: string | null
          nutritionist_id?: string | null
          patient_id?: string
          plan_item_id?: string | null
          quantity?: number
          unit?: Database["public"]["Enums"]["measurement_unit"]
          updated_at?: string
          updated_by?: string | null
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          calories: number | null
          created_at: string
          food_name: string
          id: string
          is_active: boolean
          meal_time: Database["public"]["Enums"]["meal_time_type"]
          notes: string | null
          plan_id: string
          purpose: string | null
          quantity: number
          sequence: number
          unit: Database["public"]["Enums"]["measurement_unit"]
          updated_at: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          food_name: string
          id?: string
          is_active?: boolean
          meal_time?: Database["public"]["Enums"]["meal_time_type"]
          notes?: string | null
          plan_id: string
          purpose?: string | null
          quantity: number
          sequence?: number
          unit: Database["public"]["Enums"]["measurement_unit"]
          updated_at?: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          food_name?: string
          id?: string
          is_active?: boolean
          meal_time?: Database["public"]["Enums"]["meal_time_type"]
          notes?: string | null
          plan_id?: string
          purpose?: string | null
          quantity?: number
          sequence?: number
          unit?: Database["public"]["Enums"]["measurement_unit"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          clinic_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          nutritionist_id: string
          patient_id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          nutritionist_id: string
          patient_id: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutritionist_details: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          crm_crn: string
          id: string
          status: Database["public"]["Enums"]["nutritionist_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_crn: string
          id: string
          status?: Database["public"]["Enums"]["nutritionist_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_crn?: string
          id?: string
          status?: Database["public"]["Enums"]["nutritionist_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutritionist_details_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionist_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_details: {
        Row: {
          birth_date: string | null
          clinic_id: string | null
          created_at: string
          created_by: string | null
          goal: string | null
          height: number | null
          id: string
          initial_weight: number | null
          nutritionist_id: string
          prescribed_meals_per_day: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          birth_date?: string | null
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          height?: number | null
          id: string
          initial_weight?: number | null
          nutritionist_id: string
          prescribed_meals_per_day?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          birth_date?: string | null
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          initial_weight?: number | null
          nutritionist_id?: string
          prescribed_meals_per_day?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_details_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_details_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_id: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          id: string
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_gamification_ranking: {
        Row: {
          clinic_id: string | null
          clinic_rank: number | null
          experience: number | null
          level: number | null
          patient_id: string | null
          patient_name: string | null
          points: number | null
          streak_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_stats_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_stats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_current_invite: { Args: never; Returns: undefined }
      archive_old_data: { Args: never; Returns: undefined }
      award_xp: {
        Args: { p_patient_id: string; p_xp_amount: number }
        Returns: undefined
      }
      create_meal_plan: {
        Args: {
          p_end_date?: string
          p_notes?: string
          p_patient_id: string
          p_start_date: string
          p_title: string
        }
        Returns: string
      }
      delete_meal_plan_item: { Args: { p_item_id: string }; Returns: boolean }
      get_gamification_ranking: {
        Args: { p_limit?: number }
        Returns: {
          clinic_rank: number
          experience: number
          level: number
          patient_id: string
          patient_name: string
          points: number
          streak_days: number
        }[]
      }
      get_patient_plan_summary: {
        Args: { p_date?: string; p_patient_id: string }
        Returns: {
          actual_cal: number
          actual_qty: number
          actual_unit: Database["public"]["Enums"]["measurement_unit"]
          adherence_pct: number
          food_name: string
          item_id: string
          log_id: string
          logged_at: string
          meal_time: Database["public"]["Enums"]["meal_time_type"]
          plan_id: string
          plan_title: string
          prescribed_cal: number
          prescribed_qty: number
          prescribed_unit: Database["public"]["Enums"]["measurement_unit"]
          purpose: string
          sequence: number
          xp_earned: number
        }[]
      }
      get_today_plan: {
        Args: { p_date?: string }
        Returns: {
          actual_cal: number
          actual_qty: number
          actual_unit: Database["public"]["Enums"]["measurement_unit"]
          food_name: string
          item_id: string
          log_id: string
          log_notes: string
          logged_at: string
          meal_time: Database["public"]["Enums"]["meal_time_type"]
          prescribed_cal: number
          prescribed_qty: number
          prescribed_unit: Database["public"]["Enums"]["measurement_unit"]
          purpose: string
          sequence: number
          xp_earned: number
        }[]
      }
      get_user_clinic: { Args: never; Returns: string }
      get_user_clinic_safe: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_safe: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      log_free_meal: {
        Args: {
          p_calories?: number
          p_food_name: string
          p_notes?: string
          p_qty: number
          p_unit: Database["public"]["Enums"]["measurement_unit"]
        }
        Returns: Json
      }
      log_meal_from_plan: {
        Args: {
          p_actual_cal?: number
          p_actual_qty: number
          p_actual_unit: Database["public"]["Enums"]["measurement_unit"]
          p_notes?: string
          p_plan_item_id: string
        }
        Returns: Json
      }
      log_water_intake: { Args: { p_amount_ml: number }; Returns: Json }
      refresh_gamification_ranking: { Args: never; Returns: undefined }
      search_patients: {
        Args: { p_clinic_id: string; search_term: string }
        Returns: {
          clinic_id: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          updated_by: string | null
        }[]
      }
      set_user_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["user_role"]
          p_target_user_id: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
      update_user_profile:
        | { Args: { p_name: string; p_phone: string }; Returns: undefined }
        | {
            Args: { p_cpf?: string; p_name: string; p_phone: string }
            Returns: undefined
          }
      upsert_meal_plan_item: {
        Args: {
          p_calories?: number
          p_food_name: string
          p_item_id?: string
          p_meal_time: Database["public"]["Enums"]["meal_time_type"]
          p_notes?: string
          p_plan_id: string
          p_purpose?: string
          p_qty: number
          p_sequence?: number
          p_unit: Database["public"]["Enums"]["measurement_unit"]
        }
        Returns: string
      }
    }
    Enums: {
      appointment_status: "PENDING" | "CONFIRMED" | "CANCELLED"
      log_type: "MEAL" | "WATER" | "SUPPLEMENT" | "EXERCISE"
      meal_time_type:
        | "BREAKFAST"
        | "MORNING_SNACK"
        | "LUNCH"
        | "AFTERNOON_SNACK"
        | "DINNER"
        | "EVENING_SNACK"
        | "ANYTIME"
      measurement_unit:
        | "GRAMS"
        | "MILLILITERS"
        | "UNITS"
        | "PORTIONS"
        | "CALORIES"
      nutritionist_status: "PENDING" | "APPROVED" | "REJECTED"
      user_role: "PATIENT" | "NUTRITIONIST" | "ADMIN"
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

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"]
export type LogType = Database["public"]["Enums"]["log_type"]

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["PENDING", "CONFIRMED", "CANCELLED"],
      log_type: ["MEAL", "WATER", "SUPPLEMENT", "EXERCISE"],
      meal_time_type: [
        "BREAKFAST",
        "MORNING_SNACK",
        "LUNCH",
        "AFTERNOON_SNACK",
        "DINNER",
        "EVENING_SNACK",
        "ANYTIME",
      ],
      measurement_unit: [
        "GRAMS",
        "MILLILITERS",
        "UNITS",
        "PORTIONS",
        "CALORIES",
      ],
      nutritionist_status: ["PENDING", "APPROVED", "REJECTED"],
      user_role: ["PATIENT", "NUTRITIONIST", "ADMIN"],
    },
  },
} as const
