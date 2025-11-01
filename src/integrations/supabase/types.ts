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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          brand_color: string | null
          business_name: string
          created_at: string | null
          id: string
          logo_url: string | null
          user_id: string
        }
        Insert: {
          brand_color?: string | null
          business_name: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          user_id: string
        }
        Update: {
          brand_color?: string | null
          business_name?: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          sent_at: string | null
          status: string
          submitted_at: string | null
          unique_token: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          unique_token: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          unique_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          allow_photo: boolean | null
          allow_rating: boolean | null
          allow_text: boolean | null
          allow_video: boolean | null
          business_id: string
          created_at: string
          custom_questions: Json | null
          description: string | null
          id: string
          name: string
          total_sent: number | null
          total_submitted: number | null
          unique_slug: string | null
          updated_at: string | null
        }
        Insert: {
          allow_photo?: boolean | null
          allow_rating?: boolean | null
          allow_text?: boolean | null
          allow_video?: boolean | null
          business_id: string
          created_at?: string
          custom_questions?: Json | null
          description?: string | null
          id?: string
          name: string
          total_sent?: number | null
          total_submitted?: number | null
          unique_slug?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_photo?: boolean | null
          allow_rating?: boolean | null
          allow_text?: boolean | null
          allow_video?: boolean | null
          business_id?: string
          created_at?: string
          custom_questions?: Json | null
          description?: string | null
          id?: string
          name?: string
          total_sent?: number | null
          total_submitted?: number | null
          unique_slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      testimonial_photos: {
        Row: {
          approved_at: string | null
          id: string
          photo_url: string
          status: string
          testimonial_id: string
          uploaded_at: string
        }
        Insert: {
          approved_at?: string | null
          id?: string
          photo_url: string
          status?: string
          testimonial_id: string
          uploaded_at?: string
        }
        Update: {
          approved_at?: string | null
          id?: string
          photo_url?: string
          status?: string
          testimonial_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_photos_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_videos: {
        Row: {
          approved_at: string | null
          id: string
          status: string
          testimonial_id: string
          uploaded_at: string
          video_url: string
        }
        Insert: {
          approved_at?: string | null
          id?: string
          status?: string
          testimonial_id: string
          uploaded_at?: string
          video_url: string
        }
        Update: {
          approved_at?: string | null
          id?: string
          status?: string
          testimonial_id?: string
          uploaded_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_videos_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          business_id: string
          campaign_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          photo_url: string | null
          rating: number
          status: string | null
          text: string
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          photo_url?: string | null
          rating: number
          status?: string | null
          text: string
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          rating?: number
          status?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
