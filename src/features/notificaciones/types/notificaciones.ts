import { Ionicons } from "@expo/vector-icons";

export interface NotificacionItem {
  id: string;
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  mensaje: string;
  hora: string;
  fechaIso: string;
  leida: boolean;
  viajeId?: string;
  estadoViaje?: string;
  tipo?: "viaje" | "sistema" | "promocion";
}

export interface PreferenciasNotificaciones {
  promociones: boolean;
  viaje: boolean;
  recordatorios: boolean;
  correo: boolean;
  push: boolean;
  sms: boolean;
}

export const PREFERENCIAS_POR_DEFECTO: PreferenciasNotificaciones = {
  promociones: true,
  viaje: true,
  recordatorios: true,
  correo: true,
  push: true,
  sms: false,
};
