export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      authorized_ids: {
        Row: {
          created_at: string | null
          id: string
          id_type: Database["public"]["Enums"]["id_verification_type"]
          id_value: string
          is_active: boolean | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_type: Database["public"]["Enums"]["id_verification_type"]
          id_value: string
          is_active?: boolean | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_type?: Database["public"]["Enums"]["id_verification_type"]
          id_value?: string
          is_active?: boolean | null
          organization_id?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          position: number
          voting_session_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          position: number
          voting_session_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number
          voting_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_voting_session_id_fkey"
            columns: ["voting_session_id"]
            isOneToOne: false
            referencedRelation: "voting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          blockchain_tx_hash: string | null
          candidate_id: string
          created_at: string | null
          id: string
          verified_id: string | null
          voter_id: string | null
          voter_wallet_address: string | null
          voting_session_id: string
        }
        Insert: {
          blockchain_tx_hash?: string | null
          candidate_id: string
          created_at?: string | null
          id?: string
          verified_id?: string | null
          voter_id?: string | null
          voter_wallet_address?: string | null
          voting_session_id: string
        }
        Update: {
          blockchain_tx_hash?: string | null
          candidate_id?: string
          created_at?: string | null
          id?: string
          verified_id?: string | null
          voter_id?: string | null
          voter_wallet_address?: string | null
          voting_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voting_session_id_fkey"
            columns: ["voting_session_id"]
            isOneToOne: false
            referencedRelation: "voting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_sessions: {
        Row: {
          access_type: Database["public"]["Enums"]["voting_access_type"] | null
          created_at: string | null
          creator_id: string
          description: string | null
          end_time: string
          id: string
          id_verification_type:
            | Database["public"]["Enums"]["id_verification_type"]
            | null
          organization_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["voting_status"] | null
          title: string
          updated_at: string | null
          voter_identity_visible: boolean | null
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["voting_access_type"] | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          end_time: string
          id?: string
          id_verification_type?:
            | Database["public"]["Enums"]["id_verification_type"]
            | null
          organization_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["voting_status"] | null
          title: string
          updated_at?: string | null
          voter_identity_visible?: boolean | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["voting_access_type"] | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          end_time?: string
          id?: string
          id_verification_type?:
            | Database["public"]["Enums"]["id_verification_type"]
            | null
          organization_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["voting_status"] | null
          title?: string
          updated_at?: string | null
          voter_identity_visible?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      id_verification_type: "employee" | "student" | "staff" | "custom"
      user_role: "admin" | "initiator" | "voter"
      voting_access_type: "public" | "organization" | "restricted"
      voting_status: "draft" | "scheduled" | "active" | "ended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      id_verification_type: ["employee", "student", "staff", "custom"],
      user_role: ["admin", "initiator", "voter"],
      voting_access_type: ["public", "organization", "restricted"],
      voting_status: ["draft", "scheduled", "active", "ended"],
    },
  },
} as const
