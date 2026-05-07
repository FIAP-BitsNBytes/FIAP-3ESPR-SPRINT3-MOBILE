export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
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
          status: Database['public']['Enums']['appointment_status']
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
          status?: Database['public']['Enums']['appointment_status']
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
          status?: Database['public']['Enums']['appointment_status']
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_clinic_id_fkey'
            columns: ['clinic_id']
            isOneToOne: false
            referencedRelation: 'clinics'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_nutritionist_id_fkey'
            columns: ['nutritionist_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
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
        Relationships: []
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
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number | null
          category: Database['public']['Enums']['log_type']
          clinic_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          food_name: string
          id: string
          logged_at: string
          nutritionist_id: string
          patient_id: string
          quantity: number
          unit: Database['public']['Enums']['measurement_unit']
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          calories?: number | null
          category?: Database['public']['Enums']['log_type']
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          food_name: string
          id?: string
          logged_at?: string
          nutritionist_id: string
          patient_id: string
          quantity?: number
          unit?: Database['public']['Enums']['measurement_unit']
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          calories?: number | null
          category?: Database['public']['Enums']['log_type']
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          food_name?: string
          id?: string
          logged_at?: string
          nutritionist_id?: string
          patient_id?: string
          quantity?: number
          unit?: Database['public']['Enums']['measurement_unit']
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      nutritionist_details: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          crm_crn: string
          id: string
          status: Database['public']['Enums']['nutritionist_status']
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_crn: string
          id: string
          status?: Database['public']['Enums']['nutritionist_status']
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_crn?: string
          id?: string
          status?: Database['public']['Enums']['nutritionist_status']
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      profiles: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          role: Database['public']['Enums']['user_role']
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          id: string
          name: string
          role: Database['public']['Enums']['user_role']
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Functions: {
      accept_current_invite: { Args: never; Returns: undefined }
      archive_old_data: { Args: never; Returns: undefined }
      award_xp: {
        Args: { p_patient_id: string; p_xp_amount: number }
        Returns: undefined
      }
      get_gamification_ranking: {
        Args: { p_limit?: number }
        Returns: {
          clinic_id: string
          clinic_rank: number
          experience: number
          level: number
          patient_id: string
          patient_name: string
          points: number
          streak_days: number
        }[]
      }
      get_user_clinic: { Args: never; Returns: string }
      refresh_gamification_ranking: { Args: never; Returns: undefined }
      search_patients: {
        Args: { p_clinic_id: string; search_term: string }
        Returns: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          role: Database['public']['Enums']['user_role']
          updated_at: string
          updated_by: string | null
        }[]
      }
      set_user_role: {
        Args: {
          p_new_role: Database['public']['Enums']['user_role']
          p_target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
      log_type: 'MEAL' | 'WATER' | 'SUPPLEMENT' | 'EXERCISE'
      measurement_unit: 'GRAMS' | 'MILLILITERS' | 'UNITS' | 'PORTIONS' | 'CALORIES'
      nutritionist_status: 'PENDING' | 'APPROVED' | 'REJECTED'
      user_role: 'PATIENT' | 'NUTRITIONIST' | 'ADMIN'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type AppointmentStatus = Enums<'appointment_status'>
export type LogType = Enums<'log_type'>
export type MeasurementUnit = Enums<'measurement_unit'>
export type NutritionistStatus = Enums<'nutritionist_status'>
export type UserRole = Enums<'user_role'>
