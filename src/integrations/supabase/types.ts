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
      admin_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string | null
          content_md: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          is_published: boolean
          meta_description: string
          published_at: string | null
          related_seo_slugs: string[]
          related_slugs: string[]
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_published?: boolean
          meta_description: string
          published_at?: string | null
          related_seo_slugs?: string[]
          related_slugs?: string[]
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_published?: boolean
          meta_description?: string
          published_at?: string | null
          related_seo_slugs?: string[]
          related_slugs?: string[]
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_follows: {
        Row: {
          created_at: string
          creator_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      credit_history: {
        Row: {
          admin_id: string | null
          balance_after: number
          created_at: string
          delta: number
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      export_logs: {
        Row: {
          created_at: string
          format: string
          id: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          format: string
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          ref_username: string | null
          source: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          ref_username?: string | null
          source?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ref_username?: string | null
          source?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          template_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          template_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          template_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shared_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          creator_featured: boolean
          display_name: string | null
          facebook_url: string | null
          follower_count: number
          following_count: number
          id: string
          instagram_url: string | null
          is_featured_creator: boolean
          twitter_url: string | null
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creator_featured?: boolean
          display_name?: string | null
          facebook_url?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          instagram_url?: string | null
          is_featured_creator?: boolean
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creator_featured?: boolean
          display_name?: string | null
          facebook_url?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          instagram_url?: string | null
          is_featured_creator?: boolean
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          event: string
          id: string
          ref_username: string
          target_user_id: string | null
          visitor_session: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ref_username: string
          target_user_id?: string | null
          visitor_session?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ref_username?: string
          target_user_id?: string | null
          visitor_session?: string | null
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          benefits_json: Json
          category: string | null
          created_at: string
          faq_json: Json
          featured_template_ids: string[]
          h1: string | null
          howto_json: Json
          id: string
          intro_text: string
          is_indexable: boolean
          keyword: string
          meta_description: string
          page_type: string
          related_slugs: string[]
          route_path: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          benefits_json?: Json
          category?: string | null
          created_at?: string
          faq_json?: Json
          featured_template_ids?: string[]
          h1?: string | null
          howto_json?: Json
          id?: string
          intro_text: string
          is_indexable?: boolean
          keyword: string
          meta_description: string
          page_type?: string
          related_slugs?: string[]
          route_path?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          benefits_json?: Json
          category?: string | null
          created_at?: string
          faq_json?: Json
          featured_template_ids?: string[]
          h1?: string | null
          howto_json?: Json
          id?: string
          intro_text?: string
          is_indexable?: boolean
          keyword?: string
          meta_description?: string
          page_type?: string
          related_slugs?: string[]
          route_path?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_templates: {
        Row: {
          bottom_layer_config: Json
          bottom_layer_url: string
          canvas_h: number
          canvas_ratio: string
          canvas_w: number
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          download_count: number
          event_type: string | null
          expires_at: string | null
          format: string | null
          id: string
          is_featured: boolean
          is_public: boolean
          is_staff_pick: boolean
          is_trending: boolean
          language: string
          like_count: number
          lock_settings: Json
          owner_id: string
          preview_url: string | null
          published_at: string | null
          slug: string | null
          status: string
          tags: string[]
          template_type: string
          title: string
          top_layer_config: Json
          updated_at: string
          usage_count: number
          view_count: number
          visibility: string
        }
        Insert: {
          bottom_layer_config?: Json
          bottom_layer_url: string
          canvas_h: number
          canvas_ratio: string
          canvas_w: number
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          event_type?: string | null
          expires_at?: string | null
          format?: string | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          is_staff_pick?: boolean
          is_trending?: boolean
          language?: string
          like_count?: number
          lock_settings?: Json
          owner_id: string
          preview_url?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string
          tags?: string[]
          template_type?: string
          title?: string
          top_layer_config?: Json
          updated_at?: string
          usage_count?: number
          view_count?: number
          visibility?: string
        }
        Update: {
          bottom_layer_config?: Json
          bottom_layer_url?: string
          canvas_h?: number
          canvas_ratio?: string
          canvas_w?: number
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          event_type?: string | null
          expires_at?: string | null
          format?: string | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          is_staff_pick?: boolean
          is_trending?: boolean
          language?: string
          like_count?: number
          lock_settings?: Json
          owner_id?: string
          preview_url?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string
          tags?: string[]
          template_type?: string
          title?: string
          top_layer_config?: Json
          updated_at?: string
          usage_count?: number
          view_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_templates_owner_profile_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      template_clones: {
        Row: {
          cloned_template_id: string
          created_at: string
          id: string
          source_template_id: string
          user_id: string
        }
        Insert: {
          cloned_template_id: string
          created_at?: string
          id?: string
          source_template_id: string
          user_id: string
        }
        Update: {
          cloned_template_id?: string
          created_at?: string
          id?: string
          source_template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_clones_cloned_template_id_fkey"
            columns: ["cloned_template_id"]
            isOneToOne: false
            referencedRelation: "shared_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_clones_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "shared_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_collections: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_indexable: boolean
          is_published: boolean
          match_category: string | null
          match_tags: string[]
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_indexable?: boolean
          is_published?: boolean
          match_category?: string | null
          match_tags?: string[]
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_indexable?: boolean
          is_published?: boolean
          match_category?: string | null
          match_tags?: string[]
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_favorites: {
        Row: {
          created_at: string
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_favorites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shared_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          template_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          template_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shared_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_seo: {
        Row: {
          created_at: string
          id: string
          intro_text: string
          is_indexable: boolean
          meta_description: string
          slug: string
          tags: string[]
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intro_text?: string
          is_indexable?: boolean
          meta_description: string
          slug: string
          tags?: string[]
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intro_text?: string
          is_indexable?: boolean
          meta_description?: string
          slug?: string
          tags?: string[]
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          credit_points: number
          id: string
          last_credit_reset: string
          premium_expires_at: string | null
          premium_started_at: string | null
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_points?: number
          id?: string
          last_credit_reset?: string
          premium_expires_at?: string | null
          premium_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_points?: number
          id?: string
          last_credit_reset?: string
          premium_expires_at?: string | null
          premium_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clone_template: { Args: { _template_id: string }; Returns: string }
      get_public_stats: {
        Args: never
        Returns: {
          total_creators: number
          total_downloads: number
          total_templates: number
          total_uses: number
          total_views: number
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_template_download: {
        Args: { _template_id: string }
        Returns: undefined
      }
      increment_template_use: {
        Args: { _template_id: string }
        Returns: undefined
      }
      increment_template_view: {
        Args: { _template_id: string }
        Returns: undefined
      }
      is_admin_or_super: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_notifications_read: { Args: { _ids: string[] }; Returns: number }
      slugify: { Args: { input: string }; Returns: string }
      toggle_follow: { Args: { _creator_id: string }; Returns: boolean }
      track_referral: {
        Args: {
          _event: string
          _ref: string
          _session?: string
          _target?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      notification_type:
        | "template_used"
        | "template_favorited"
        | "new_follower"
        | "template_trending"
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
      app_role: ["admin", "user"],
      notification_type: [
        "template_used",
        "template_favorited",
        "new_follower",
        "template_trending",
      ],
    },
  },
} as const
