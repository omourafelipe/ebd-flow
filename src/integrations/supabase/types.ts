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
      alunos: {
        Row: {
          classe_id: string
          created_at: string
          data_ingresso: string | null
          data_nascimento: string | null
          deleted_at: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          sexo: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          classe_id: string
          created_at?: string
          data_ingresso?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          sexo?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          classe_id?: string
          created_at?: string
          data_ingresso?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          sexo?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          classe_id: string
          created_at: string
          data_aula: string
          deleted_at: string | null
          id: string
          numero_licao: number | null
          observacoes: string | null
          professor: string | null
          professor_id: string | null
          professor_substituto: string | null
          tema: string
          updated_at: string
        }
        Insert: {
          classe_id: string
          created_at?: string
          data_aula: string
          deleted_at?: string | null
          id?: string
          numero_licao?: number | null
          observacoes?: string | null
          professor?: string | null
          professor_id?: string | null
          professor_substituto?: string | null
          tema: string
          updated_at?: string
        }
        Update: {
          classe_id?: string
          created_at?: string
          data_aula?: string
          deleted_at?: string | null
          id?: string
          numero_licao?: number | null
          observacoes?: string | null
          professor?: string | null
          professor_id?: string | null
          professor_substituto?: string | null
          tema?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          cor: string | null
          created_at: string
          deleted_at: string | null
          departamento: string | null
          faixa_etaria: string | null
          id: string
          nome: string
          observacoes: string | null
          professor: string
          professor_auxiliar: string | null
          professor_auxiliar_id: string | null
          professor_id: string | null
          sala: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          deleted_at?: string | null
          departamento?: string | null
          faixa_etaria?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          professor: string
          professor_auxiliar?: string | null
          professor_auxiliar_id?: string | null
          professor_id?: string | null
          sala?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          deleted_at?: string | null
          departamento?: string | null
          faixa_etaria?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          professor?: string
          professor_auxiliar?: string | null
          professor_auxiliar_id?: string | null
          professor_id?: string | null
          sala?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          ano_letivo: number
          created_at: string
          id: string
          logo_url: string | null
          nome_igreja: string
          tema: string
          updated_at: string
        }
        Insert: {
          ano_letivo?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          nome_igreja: string
          tema?: string
          updated_at?: string
        }
        Update: {
          ano_letivo?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          nome_igreja?: string
          tema?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          carga_horaria: number | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          deleted_at: string | null
          descricao: string | null
          id: string
          nome: string
          professor: string | null
          professor_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          carga_horaria?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          professor?: string | null
          professor_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          carga_horaria?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          professor?: string | null
          professor_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      curso_aluno: {
        Row: {
          aluno_id: string
          created_at: string
          curso_id: string
          data_matricula: string
          id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          curso_id: string
          data_matricula: string
          id?: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          curso_id?: string
          data_matricula?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_aluno_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_aluno_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_classes: {
        Row: {
          aluno_id: string
          classe_destino_id: string | null
          classe_origem_id: string | null
          created_at: string
          data_evento: string
          id: string
          motivo: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          classe_destino_id?: string | null
          classe_origem_id?: string | null
          created_at?: string
          data_evento: string
          id?: string
          motivo?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          classe_destino_id?: string | null
          classe_origem_id?: string | null
          created_at?: string
          data_evento?: string
          id?: string
          motivo?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_classes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_classes_classe_destino_id_fkey"
            columns: ["classe_destino_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_classes_classe_origem_id_fkey"
            columns: ["classe_origem_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          aluno_id: string
          aula_id: string
          created_at: string
          id: string
          observacoes: string | null
          presente: boolean
          trouxe_biblia: boolean
          updated_at: string
        }
        Insert: {
          aluno_id: string
          aula_id: string
          created_at?: string
          id?: string
          observacoes?: string | null
          presente?: boolean
          trouxe_biblia?: boolean
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          presente?: boolean
          trouxe_biblia?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          role?: string
          updated_at?: string
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
