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
    PostgrestVersion: "14.18"
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
      calificaciones: {
        Row: {
          autor_id: string
          comentario: string | null
          creado_en: string
          id: string
          puntuacion: number
          receptor_id: string
          viaje_id: string
        }
        Insert: {
          autor_id: string
          comentario?: string | null
          creado_en?: string
          id?: string
          puntuacion: number
          receptor_id: string
          viaje_id: string
        }
        Update: {
          autor_id?: string
          comentario?: string | null
          creado_en?: string
          id?: string
          puntuacion?: number
          receptor_id?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_receptor_id_fkey"
            columns: ["receptor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      conductores_perfil: {
        Row: {
          calificacion_promedio: number | null
          en_linea: boolean | null
          estado: Database["public"]["Enums"]["estado_verificacion"] | null
          lat_actual: number | null
          lng_actual: number | null
          saldo_billetera: number | null
          usuario_id: string
          viajes_completados: number | null
        }
        Insert: {
          calificacion_promedio?: number | null
          en_linea?: boolean | null
          estado?: Database["public"]["Enums"]["estado_verificacion"] | null
          lat_actual?: number | null
          lng_actual?: number | null
          saldo_billetera?: number | null
          usuario_id: string
          viajes_completados?: number | null
        }
        Update: {
          calificacion_promedio?: number | null
          en_linea?: boolean | null
          estado?: Database["public"]["Enums"]["estado_verificacion"] | null
          lat_actual?: number | null
          lng_actual?: number | null
          saldo_billetera?: number | null
          usuario_id?: string
          viajes_completados?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conductores_perfil_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          estado: Database["public"]["Enums"]["estado_verificacion"] | null
          fecha_subida: string
          id: string
          motivo_rechazo: string | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
          url_archivo: string
          usuario_id: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["estado_verificacion"] | null
          fecha_subida?: string
          id?: string
          motivo_rechazo?: string | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
          url_archivo: string
          usuario_id: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["estado_verificacion"] | null
          fecha_subida?: string
          id?: string
          motivo_rechazo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          url_archivo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_viaje: {
        Row: {
          contenido: string
          creado_en: string
          id: string
          leido: boolean | null
          remitente_id: string
          viaje_id: string
        }
        Insert: {
          contenido: string
          creado_en?: string
          id?: string
          leido?: boolean | null
          remitente_id: string
          viaje_id: string
        }
        Update: {
          contenido?: string
          creado_en?: string
          id?: string
          leido?: boolean | null
          remitente_id?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_viaje_remitente_id_fkey"
            columns: ["remitente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_viaje_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      pasajeros_perfil: {
        Row: {
          calificacion_promedio: number | null
          preferencias: Json | null
          usuario_id: string
        }
        Insert: {
          calificacion_promedio?: number | null
          preferencias?: Json | null
          usuario_id: string
        }
        Update: {
          calificacion_promedio?: number | null
          preferencias?: Json | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasajeros_perfil_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones: {
        Row: {
          conductor_id: string
          creado_en: string
          id: string
          monto: number
          tipo: Database["public"]["Enums"]["tipo_transaccion"]
          viaje_id: string | null
        }
        Insert: {
          conductor_id: string
          creado_en?: string
          id?: string
          monto: number
          tipo: Database["public"]["Enums"]["tipo_transaccion"]
          viaje_id?: string | null
        }
        Update: {
          conductor_id?: string
          creado_en?: string
          id?: string
          monto?: number
          tipo?: Database["public"]["Enums"]["tipo_transaccion"]
          viaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductores_perfil"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "transacciones_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          apellidos: string
          avatar_url: string | null
          creado_en: string
          dni: string | null
          fecha_nacimiento: string | null
          expo_push_token: string | null
          foto_url: string | null
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"] | null
          telefono: string
        }
        Insert: {
          apellidos: string
          avatar_url?: string | null
          creado_en?: string
          dni?: string | null
          fecha_nacimiento?: string | null
          expo_push_token?: string | null
          foto_url?: string | null
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"] | null
          telefono: string
        }
        Update: {
          apellidos?: string
          avatar_url?: string | null
          creado_en?: string
          dni?: string | null
          fecha_nacimiento?: string | null
          expo_push_token?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"] | null
          telefono?: string
        }
        Relationships: []
      }
      vehiculos: {
        Row: {
          activo: boolean | null
          anio: number | null
          capacidad: number | null
          color: string
          conductor_id: string
          creado_en: string
          id: string
          marca: string
          modelo: string
          placa: string
        }
        Insert: {
          activo?: boolean | null
          anio?: number | null
          capacidad?: number | null
          color: string
          conductor_id: string
          creado_en?: string
          id?: string
          marca: string
          modelo: string
          placa: string
        }
        Update: {
          activo?: boolean | null
          anio?: number | null
          capacidad?: number | null
          color?: string
          conductor_id?: string
          creado_en?: string
          id?: string
          marca?: string
          modelo?: string
          placa?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductores_perfil"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      verificaciones_telefono: {
        Row: {
          consumido: boolean
          creado_en: string
          expira_en: string
          id: string
          pin_id: string
          telefono: string
          verificado: boolean
        }
        Insert: {
          consumido?: boolean
          creado_en?: string
          expira_en: string
          id?: string
          pin_id: string
          telefono: string
          verificado?: boolean
        }
        Update: {
          consumido?: boolean
          creado_en?: string
          expira_en?: string
          id?: string
          pin_id?: string
          telefono?: string
          verificado?: boolean
        }
        Relationships: []
      }
      viajes: {
        Row: {
          aceptado_en: string | null
          conductor_id: string | null
          creado_en: string
          destino_lat: number
          destino_lng: number
          destino_texto: string
          distancia_km: number | null
          estado: Database["public"]["Enums"]["estado_viaje"] | null
          finalizado_en: string | null
          id: string
          metodo_pago: string | null
          origen_lat: number
          origen_lng: number
          origen_texto: string
          pasajero_id: string
          tarifa_estimada: number
          tarifa_final: number | null
        }
        Insert: {
          aceptado_en?: string | null
          conductor_id?: string | null
          creado_en?: string
          destino_lat: number
          destino_lng: number
          destino_texto: string
          distancia_km?: number | null
          estado?: Database["public"]["Enums"]["estado_viaje"] | null
          finalizado_en?: string | null
          id?: string
          metodo_pago?: string | null
          origen_lat: number
          origen_lng: number
          origen_texto: string
          pasajero_id: string
          tarifa_estimada: number
          tarifa_final?: number | null
        }
        Update: {
          aceptado_en?: string | null
          conductor_id?: string | null
          creado_en?: string
          destino_lat?: number
          destino_lng?: number
          destino_texto?: string
          distancia_km?: number | null
          estado?: Database["public"]["Enums"]["estado_viaje"] | null
          finalizado_en?: string | null
          id?: string
          metodo_pago?: string | null
          origen_lat?: number
          origen_lng?: number
          origen_texto?: string
          pasajero_id?: string
          tarifa_estimada?: number
          tarifa_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "viajes_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductores_perfil"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "viajes_pasajero_id_fkey"
            columns: ["pasajero_id"]
            isOneToOne: false
            referencedRelation: "pasajeros_perfil"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reservar_otp_conductor: { Args: { p_telefono: string }; Returns: Json }
      cancelar_viaje_pasajero: { Args: { p_viaje_id: string }; Returns: undefined }
      aceptar_viaje: { Args: { p_viaje_id: string }; Returns: undefined }
      finalizar_viaje: { Args: { p_viaje_id: string }; Returns: undefined }
      obtener_conductor_viaje: {
        Args: { p_viaje_id: string }
        Returns: {
          nombre: string
          apellidos: string
          foto_url: string | null
          telefono: string
          calificacion: number | null
          viajes_completados: number | null
          placa: string | null
          marca: string | null
          modelo: string | null
          color: string | null
          lat_actual: number | null
          lng_actual: number | null
        }[]
      }
    }
    Enums: {
      estado_verificacion: "pendiente" | "aprobado" | "rechazado" | "suspendido"
      estado_viaje:
        | "buscando"
        | "aceptado"
        | "en_camino_origen"
        | "esperando_pasajero"
        | "en_viaje"
        | "finalizado"
        | "cancelado_pasajero"
        | "cancelado_conductor"
      rol_usuario: "pasajero" | "conductor" | "admin"
      tipo_documento:
        | "DNI"
        | "DNI_FRONTAL"
        | "DNI_POSTERIOR"
        | "SELFIE"
        | "LICENCIA"
        | "SOAT"
        | "ANTECEDENTES"
        | "TARJETA_PROPIEDAD"
      tipo_transaccion:
        | "cobro_viaje"
        | "pago_comision"
        | "retiro_banco"
        | "bono"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      estado_verificacion: ["pendiente", "aprobado", "rechazado", "suspendido"],
      estado_viaje: [
        "buscando",
        "aceptado",
        "en_camino_origen",
        "esperando_pasajero",
        "en_viaje",
        "finalizado",
        "cancelado_pasajero",
        "cancelado_conductor",
      ],
      rol_usuario: ["pasajero", "conductor", "admin"],
      tipo_documento: [
        "DNI",
        "DNI_FRONTAL",
        "DNI_POSTERIOR",
        "SELFIE",
        "LICENCIA",
        "SOAT",
        "ANTECEDENTES",
        "TARJETA_PROPIEDAD",
      ],
      tipo_transaccion: [
        "cobro_viaje",
        "pago_comision",
        "retiro_banco",
        "bono",
      ],
    },
  },
} as const
