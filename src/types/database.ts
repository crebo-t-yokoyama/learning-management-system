export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          provider_account_id: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          is_active: boolean | null
          overview: string | null
          search_vector: unknown | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          overview?: string | null
          search_vector?: unknown | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          overview?: string | null
          search_vector?: unknown | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          due_date: string | null
          id: string
          learner_id: string
          progress_percentage: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          learner_id: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          learner_id?: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "enrollments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "enrollments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "enrollments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_records: {
        Row: {
          course_id: string
          created_at: string | null
          cumulative_learning_minutes: number | null
          enrollment_id: string
          id: string
          learner_id: string
          learning_memo: string | null
          progress_percentage: number | null
          session_date: string
          session_duration_minutes: number | null
          session_end_time: string | null
          session_start_time: string
          understanding_level: number | null
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          cumulative_learning_minutes?: number | null
          enrollment_id: string
          id?: string
          learner_id: string
          learning_memo?: string | null
          progress_percentage?: number | null
          session_date?: string
          session_duration_minutes?: number | null
          session_end_time?: string | null
          session_start_time?: string
          understanding_level?: number | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          cumulative_learning_minutes?: number | null
          enrollment_id?: string
          id?: string
          learner_id?: string
          learning_memo?: string | null
          progress_percentage?: number | null
          session_date?: string
          session_duration_minutes?: number | null
          session_end_time?: string | null
          session_start_time?: string
          understanding_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "learning_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "learning_records_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_records_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "learning_records_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          expires: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires: string
          id?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["learner_id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          email_verified: string | null
          full_name: string | null
          hire_date: string | null
          id: string
          image: string | null
          last_login_at: string | null
          name: string | null
          position: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          email_verified?: string | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          image?: string | null
          last_login_at?: string | null
          name?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          email_verified?: string | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          image?: string | null
          last_login_at?: string | null
          name?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      course_statistics: {
        Row: {
          avg_learning_minutes: number | null
          avg_progress_percentage: number | null
          avg_understanding_level: number | null
          category: string | null
          completed_learners: number | null
          course_id: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          in_progress_learners: number | null
          title: string | null
          total_learners: number | null
          total_learning_sessions: number | null
        }
        Relationships: []
      }
      department_learning_statistics: {
        Row: {
          assigned_enrollments: number | null
          avg_progress_percentage: number | null
          avg_understanding_level: number | null
          completed_enrollments: number | null
          department: string | null
          in_progress_enrollments: number | null
          total_courses_assigned: number | null
          total_learners: number | null
          total_learning_minutes: number | null
        }
        Relationships: []
      }
      learning_statistics: {
        Row: {
          assigned_at: string | null
          avg_understanding_level: number | null
          category: string | null
          completed_at: string | null
          course_id: string | null
          course_title: string | null
          department: string | null
          difficulty_level: string | null
          enrollment_status: string | null
          full_name: string | null
          last_learning_date: string | null
          learner_id: string | null
          learning_sessions: number | null
          progress_percentage: number | null
          started_at: string | null
          total_learning_minutes: number | null
        }
        Relationships: []
      }
      mv_learning_progress_summary: {
        Row: {
          active_learners: number | null
          avg_progress: number | null
          avg_understanding: number | null
          category: string | null
          course_id: string | null
          course_title: string | null
          date: string | null
          total_minutes: number | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "learning_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_statistics"
            referencedColumns: ["course_id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_old_learning_records: {
        Args: { retention_months?: number }
        Returns: number
      }
      create_initial_admin: {
        Args: {
          admin_email: string
          admin_name?: string
          admin_department?: string
        }
        Returns: string
      }
      refresh_learning_progress_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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

// 学習管理システム用の便利な型定義エクスポート
export type User = Tables<'users'>
export type Course = Tables<'courses'>
export type Enrollment = Tables<'enrollments'>
export type LearningRecord = Tables<'learning_records'>

// 統計ビューの型定義
export type LearningStatistics = Tables<'learning_statistics'>
export type CourseStatistics = Tables<'course_statistics'>
export type DepartmentLearningStatistics = Tables<'department_learning_statistics'>

// Insert用の型定義
export type UserInsert = TablesInsert<'users'>
export type CourseInsert = TablesInsert<'courses'>
export type EnrollmentInsert = TablesInsert<'enrollments'>
export type LearningRecordInsert = TablesInsert<'learning_records'>

// Update用の型定義
export type UserUpdate = TablesUpdate<'users'>
export type CourseUpdate = TablesUpdate<'courses'>
export type EnrollmentUpdate = TablesUpdate<'enrollments'>
export type LearningRecordUpdate = TablesUpdate<'learning_records'>

// 学習管理システム固有の型定義
export type UserRole = 'admin' | 'learner'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type EnrollmentStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type UnderstandingLevel = 1 | 2 | 3 | 4 | 5

// 認証システム用の拡張型定義
export interface AuthUser extends User {
  role: UserRole
}

// セッション情報の拡張
export interface ExtendedSession {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
    department?: string | null
    full_name?: string | null
  }
}

// 認証関連のレスポンス型
export interface AuthResponse {
  success: boolean
  message?: string
  user?: AuthUser
}

// 権限チェックの結果型
export interface PermissionCheck {
  hasPermission: boolean
  reason?: string
}

// API用の認証必須リクエスト型
export interface AuthenticatedRequest<T = Record<string, unknown>> {
  user: AuthUser
  data: T
}

// ログイン情報型
export interface LoginCredentials {
  email: string
  password: string
}

// ユーザー作成用型（パスワード込み）
export interface UserCreateData extends UserInsert {
  password: string
  confirmPassword: string
}

// ユーザープロファイル更新用型
export interface UserProfileUpdate {
  name?: string
  full_name?: string
  department?: string
  position?: string
}

// セッション管理用の型
export interface SessionData {
  id: string
  email: string
  name?: string | null
  role: UserRole
  fullName?: string | null
  department?: string | null
  lastLoginAt?: string | null
}
