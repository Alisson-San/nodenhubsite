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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_type: string
          id: string
          record_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_type: string
          id?: string
          record_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_type?: string
          id?: string
          record_id?: string | null
        }
        Relationships: []
      }
      catalog_badges: {
        Row: {
          background_color: string
          border_color: string
          created_at: string
          icon_key: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          text_color: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          background_color?: string
          border_color?: string
          created_at?: string
          icon_key?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          text_color?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          background_color?: string
          border_color?: string
          created_at?: string
          icon_key?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          text_color?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      catalog_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon_key: string | null
          id: string
          is_active: boolean
          name: string
          service_page_id: string
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          name: string
          service_page_id: string
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service_page_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_categories_service_page_id_fkey"
            columns: ["service_page_id"]
            isOneToOne: false
            referencedRelation: "service_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_tiers: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          division: Database["public"]["Enums"]["service_division"] | null
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          division?: Database["public"]["Enums"]["service_division"] | null
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          division?: Database["public"]["Enums"]["service_division"] | null
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pricing_item_badges: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          pricing_item_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          pricing_item_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          pricing_item_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_item_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "catalog_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_item_badges_pricing_item_id_fkey"
            columns: ["pricing_item_id"]
            isOneToOne: false
            referencedRelation: "pricing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_items: {
        Row: {
          badge: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          cta_label: string | null
          cta_message: string | null
          description: string
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          item_kind: Database["public"]["Enums"]["catalog_item_kind"]
          name: string
          note: string | null
          price: number | null
          price_label: string | null
          price_prefix: string | null
          price_suffix: string | null
          price_type: Database["public"]["Enums"]["price_type"]
          service_page_id: string
          sort_order: number
          tier_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          cta_label?: string | null
          cta_message?: string | null
          description: string
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          item_kind?: Database["public"]["Enums"]["catalog_item_kind"]
          name: string
          note?: string | null
          price?: number | null
          price_label?: string | null
          price_prefix?: string | null
          price_suffix?: string | null
          price_type: Database["public"]["Enums"]["price_type"]
          service_page_id: string
          sort_order?: number
          tier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          cta_label?: string | null
          cta_message?: string | null
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          item_kind?: Database["public"]["Enums"]["catalog_item_kind"]
          name?: string
          note?: string | null
          price?: number | null
          price_label?: string | null
          price_prefix?: string | null
          price_suffix?: string | null
          price_type?: Database["public"]["Enums"]["price_type"]
          service_page_id?: string
          sort_order?: number
          tier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_items_service_page_id_fkey"
            columns: ["service_page_id"]
            isOneToOne: false
            referencedRelation: "service_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_items_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "catalog_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pages: {
        Row: {
          accent_color: string
          accent_secondary_color: string
          canonical_path: string
          created_at: string
          cta_button_label: string
          cta_description: string
          cta_eyebrow: string
          cta_message: string
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          cta_title: string
          division: Database["public"]["Enums"]["service_division"]
          hero_description: string
          hero_eyebrow: string
          hero_highlights: Json
          hero_primary_label: string | null
          hero_primary_message: string
          hero_secondary_href: string | null
          hero_secondary_label: string | null
          hero_title: string
          id: string
          is_published: boolean
          pricing_description: string
          pricing_disclaimer: string | null
          pricing_eyebrow: string | null
          pricing_title: string
          seo_description: string
          seo_title: string
          services_description: string
          services_eyebrow: string | null
          services_title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_color?: string
          accent_secondary_color?: string
          canonical_path: string
          created_at?: string
          cta_button_label: string
          cta_description: string
          cta_eyebrow: string
          cta_message: string
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          cta_title: string
          division: Database["public"]["Enums"]["service_division"]
          hero_description: string
          hero_eyebrow: string
          hero_highlights?: Json
          hero_primary_label?: string | null
          hero_primary_message: string
          hero_secondary_href?: string | null
          hero_secondary_label?: string | null
          hero_title: string
          id?: string
          is_published?: boolean
          pricing_description: string
          pricing_disclaimer?: string | null
          pricing_eyebrow?: string | null
          pricing_title: string
          seo_description: string
          seo_title: string
          services_description: string
          services_eyebrow?: string | null
          services_title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_color?: string
          accent_secondary_color?: string
          canonical_path?: string
          created_at?: string
          cta_button_label?: string
          cta_description?: string
          cta_eyebrow?: string
          cta_message?: string
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          cta_title?: string
          division?: Database["public"]["Enums"]["service_division"]
          hero_description?: string
          hero_eyebrow?: string
          hero_highlights?: Json
          hero_primary_label?: string | null
          hero_primary_message?: string
          hero_secondary_href?: string | null
          hero_secondary_label?: string | null
          hero_title?: string
          id?: string
          is_published?: boolean
          pricing_description?: string
          pricing_disclaimer?: string | null
          pricing_eyebrow?: string | null
          pricing_title?: string
          seo_description?: string
          seo_title?: string
          services_description?: string
          services_eyebrow?: string | null
          services_title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          badge: string | null
          created_at: string
          description: string
          features: Json
          id: string
          is_active: boolean
          service_page_id: string
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description: string
          features?: Json
          id?: string
          is_active?: boolean
          service_page_id: string
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          service_page_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_service_page_id_fkey"
            columns: ["service_page_id"]
            isOneToOne: false
            referencedRelation: "service_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          platform: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          url: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          platform: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          platform?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      move_catalog_badge: {
        Args: { p_direction: number; p_item_id: string }
        Returns: boolean
      }
      move_catalog_category: {
        Args: { p_direction: number; p_item_id: string }
        Returns: boolean
      }
      move_catalog_tier: {
        Args: { p_direction: number; p_item_id: string }
        Returns: boolean
      }
      move_pricing_item: {
        Args: { p_direction: number; p_item_id: string }
        Returns: boolean
      }
      move_service_item: {
        Args: { p_direction: number; p_item_id: string }
        Returns: boolean
      }
      save_pricing_catalog_item: {
        Args: {
          p_badge_ids: string[]
          p_category_id: string
          p_compare_at_price: number
          p_cta_label: string
          p_cta_message: string
          p_description: string
          p_features: Json
          p_is_active: boolean
          p_is_featured: boolean
          p_item_kind: Database["public"]["Enums"]["catalog_item_kind"]
          p_name: string
          p_note: string
          p_price: number
          p_price_label: string
          p_price_prefix: string
          p_price_suffix: string
          p_price_type: Database["public"]["Enums"]["price_type"]
          p_pricing_id: string
          p_service_page_id: string
          p_sort_order: number
          p_tier_id: string
          p_updated_by: string
        }
        Returns: string
      }
    }
    Enums: {
      audit_action: "insert" | "update" | "delete"
      catalog_item_kind: "service" | "package" | "product" | "consulting"
      price_type: "fixed" | "starting_at" | "consultation" | "free"
      service_division: "home" | "game" | "data"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action: ["insert", "update", "delete"],
      catalog_item_kind: ["service", "package", "product", "consulting"],
      price_type: ["fixed", "starting_at", "consultation", "free"],
      service_division: ["home", "game", "data"],
    },
  },
} as const
