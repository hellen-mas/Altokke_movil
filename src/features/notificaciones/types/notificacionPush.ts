export const CATEGORIAS_PUSH = [
  "aprobaciones",
  "viajes",
  "pagos",
  "cuenta",
] as const;

export type CategoriaPush =
  (typeof CATEGORIAS_PUSH)[number];

export type DestinoViajePush =
  | "solicitudes"
  | "viaje-activo"
  | "buscando-conductor";

export interface DatosNotificacionPush {
  categoria?: CategoriaPush;
  tipo?: string;
  destino?: DestinoViajePush;
  viaje_id?: string;
}
