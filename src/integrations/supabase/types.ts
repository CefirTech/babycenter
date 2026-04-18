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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ressource: string
          ressource_id: string | null
          user_id: string | null
          user_nom: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ressource: string
          ressource_id?: string | null
          user_id?: string | null
          user_nom?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ressource?: string
          ressource_id?: string | null
          user_id?: string | null
          user_nom?: string | null
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          montant: number
          motif: string
          reference: string | null
          session_id: string | null
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          montant: number
          motif: string
          reference?: string | null
          session_id?: string | null
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          montant?: number
          motif?: string
          reference?: string | null
          session_id?: string | null
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          ecart: number | null
          fermee_le: string | null
          fermee_par: string | null
          id: string
          notes: string | null
          ouverte_le: string
          ouverte_par: string | null
          ouverte_par_nom: string | null
          solde_ouverture: number
          solde_reel: number | null
          solde_theorique: number | null
          statut: string
        }
        Insert: {
          ecart?: number | null
          fermee_le?: string | null
          fermee_par?: string | null
          id?: string
          notes?: string | null
          ouverte_le?: string
          ouverte_par?: string | null
          ouverte_par_nom?: string | null
          solde_ouverture?: number
          solde_reel?: number | null
          solde_theorique?: number | null
          statut?: string
        }
        Update: {
          ecart?: number | null
          fermee_le?: string | null
          fermee_par?: string | null
          id?: string
          notes?: string | null
          ouverte_le?: string
          ouverte_par?: string | null
          ouverte_par_nom?: string | null
          solde_ouverture?: number
          solde_reel?: number | null
          solde_theorique?: number | null
          statut?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          genre: string | null
          id: string
          image_url: string | null
          nom: string
          ordre: number
          parent_id: string | null
          slug: string
          tranche_age: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          nom: string
          ordre?: number
          parent_id?: string | null
          slug: string
          tranche_age?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          nom?: string
          ordre?: number
          parent_id?: string | null
          slug?: string
          tranche_age?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          notes: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          date_depense: string
          description: string
          id: string
          justificatif_url: string | null
          mode_paiement: Database["public"]["Enums"]["payment_method"] | null
          montant: number
          updated_at: string
        }
        Insert: {
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          date_depense?: string
          description: string
          id?: string
          justificatif_url?: string | null
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          montant: number
          updated_at?: string
        }
        Update: {
          categorie?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          date_depense?: string
          description?: string
          id?: string
          justificatif_url?: string | null
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          montant?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          couleur: string | null
          created_at: string
          id: string
          order_id: string
          prix_unitaire: number
          product_id: string | null
          product_nom: string
          quantite: number
          taille: string | null
          total: number
          variant_id: string | null
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          id?: string
          order_id: string
          prix_unitaire: number
          product_id?: string | null
          product_nom: string
          quantite?: number
          taille?: string | null
          total: number
          variant_id?: string | null
        }
        Update: {
          couleur?: string | null
          created_at?: string
          id?: string
          order_id?: string
          prix_unitaire?: number
          product_id?: string | null
          product_nom?: string
          quantite?: number
          taille?: string | null
          total?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          canal: Database["public"]["Enums"]["order_channel"]
          created_at: string
          customer_adresse: string | null
          customer_id: string | null
          customer_nom: string
          customer_telephone: string | null
          frais_livraison: number
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_method"] | null
          notes: string | null
          numero_commande: string
          remise: number
          sous_total: number
          statut: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          canal?: Database["public"]["Enums"]["order_channel"]
          created_at?: string
          customer_adresse?: string | null
          customer_id?: string | null
          customer_nom: string
          customer_telephone?: string | null
          frais_livraison?: number
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          numero_commande?: string
          remise?: number
          sous_total?: number
          statut?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["order_channel"]
          created_at?: string
          customer_adresse?: string | null
          customer_id?: string | null
          customer_nom?: string
          customer_telephone?: string | null
          frais_livraison?: number
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          numero_commande?: string
          remise?: number
          sous_total?: number
          statut?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          couleur: string | null
          created_at: string
          id: string
          product_id: string
          seuil_alerte: number
          sku: string | null
          stock: number
          taille: string | null
          updated_at: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          id?: string
          product_id: string
          seuil_alerte?: number
          sku?: string | null
          stock?: number
          taille?: string | null
          updated_at?: string
        }
        Update: {
          couleur?: string | null
          created_at?: string
          id?: string
          product_id?: string
          seuil_alerte?: number
          sku?: string | null
          stock?: number
          taille?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          categorie_id: string | null
          code_produit: string
          created_at: string
          description: string | null
          entretien: string | null
          est_meilleure_vente: boolean
          est_nouveaute: boolean
          genre: string | null
          id: string
          images: string[]
          marque: string | null
          matiere: string | null
          nom: string
          prix_achat: number
          prix_promo: number | null
          prix_vente: number
          slug: string
          statut: Database["public"]["Enums"]["product_status"]
          tranche_age: string | null
          updated_at: string
        }
        Insert: {
          categorie_id?: string | null
          code_produit: string
          created_at?: string
          description?: string | null
          entretien?: string | null
          est_meilleure_vente?: boolean
          est_nouveaute?: boolean
          genre?: string | null
          id?: string
          images?: string[]
          marque?: string | null
          matiere?: string | null
          nom: string
          prix_achat?: number
          prix_promo?: number | null
          prix_vente?: number
          slug: string
          statut?: Database["public"]["Enums"]["product_status"]
          tranche_age?: string | null
          updated_at?: string
        }
        Update: {
          categorie_id?: string | null
          code_produit?: string
          created_at?: string
          description?: string | null
          entretien?: string | null
          est_meilleure_vente?: boolean
          est_nouveaute?: boolean
          genre?: string | null
          id?: string
          images?: string[]
          marque?: string | null
          matiere?: string | null
          nom?: string
          prix_achat?: number
          prix_promo?: number | null
          prix_vente?: number
          slug?: string
          statut?: Database["public"]["Enums"]["product_status"]
          tranche_age?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          date_debut: string
          date_fin: string | null
          description: string | null
          id: string
          montant_min_commande: number | null
          nom: string
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string
          utilisations: number
          utilisations_max: number | null
          valeur: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          id?: string
          montant_min_commande?: number | null
          nom: string
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
          utilisations?: number
          utilisations_max?: number | null
          valeur: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          id?: string
          montant_min_commande?: number | null
          nom?: string
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
          utilisations?: number
          utilisations_max?: number | null
          valeur?: number
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          couleur: string | null
          created_at: string
          id: string
          prix_unitaire: number
          product_id: string | null
          product_nom: string
          quantite: number
          sale_id: string
          taille: string | null
          total: number
          variant_id: string | null
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          id?: string
          prix_unitaire: number
          product_id?: string | null
          product_nom: string
          quantite?: number
          sale_id: string
          taille?: string | null
          total: number
          variant_id?: string | null
        }
        Update: {
          couleur?: string | null
          created_at?: string
          id?: string
          prix_unitaire?: number
          product_id?: string | null
          product_nom?: string
          quantite?: number
          sale_id?: string
          taille?: string | null
          total?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          numero_vente: string
          remise: number
          sous_total: number
          total: number
          vendeur_id: string | null
          vendeur_nom: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          numero_vente: string
          remise?: number
          sous_total?: number
          total?: number
          vendeur_id?: string | null
          vendeur_nom?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          numero_vente?: string
          remise?: number
          sous_total?: number
          total?: number
          vendeur_id?: string | null
          vendeur_nom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          cle: string
          description: string | null
          updated_at: string
          valeur: Json
        }
        Insert: {
          cle: string
          description?: string | null
          updated_at?: string
          valeur: Json
        }
        Update: {
          cle?: string
          description?: string | null
          updated_at?: string
          valeur?: Json
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "vendeur"
      cash_movement_type: "entree" | "sortie"
      expense_category:
        | "loyer"
        | "fournisseurs"
        | "salaires"
        | "marketing"
        | "logistique"
        | "utilities"
        | "autre"
      order_channel: "boutique" | "whatsapp" | "site" | "telephone"
      order_status:
        | "en_attente_paiement"
        | "payee"
        | "en_preparation"
        | "expediee"
        | "livree"
        | "annulee"
      payment_method:
        | "especes"
        | "orange_money"
        | "moov_money"
        | "mtn_money"
        | "wave"
        | "carte"
        | "virement"
      product_status: "actif" | "inactif" | "rupture"
      promotion_type: "pourcentage" | "montant_fixe"
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
      app_role: ["admin", "manager", "vendeur"],
      cash_movement_type: ["entree", "sortie"],
      expense_category: [
        "loyer",
        "fournisseurs",
        "salaires",
        "marketing",
        "logistique",
        "utilities",
        "autre",
      ],
      order_channel: ["boutique", "whatsapp", "site", "telephone"],
      order_status: [
        "en_attente_paiement",
        "payee",
        "en_preparation",
        "expediee",
        "livree",
        "annulee",
      ],
      payment_method: [
        "especes",
        "orange_money",
        "moov_money",
        "mtn_money",
        "wave",
        "carte",
        "virement",
      ],
      product_status: ["actif", "inactif", "rupture"],
      promotion_type: ["pourcentage", "montant_fixe"],
    },
  },
} as const
