export interface PostgrestErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * Diccionario de mapeo de errores conocidos de PostgreSQL / PostgREST a español claro.
 */
const MENSAJES_SQLSTATE: Record<string, string> = {
  // Integridad y unicidad
  "23505": "Ya existe un registro con estos datos en el sistema.",
  "23503": "La información vinculada no existe o ya no está disponible.",
  "23502": "Faltan campos obligatorios para completar la operación.",
  "23514": "Los datos ingresados no cumplen con las reglas del servicio.",

  // Autorización y seguridad RLS
  "42501": "No cuentas con los permisos necesarios para realizar esta acción.",
  "PGRST301": "Tu sesión ha expirado o el token de acceso es inválido.",

  // Consultas y PostgREST
  "PGRST116": "El registro solicitado no fue encontrado.",
  "PGRST204": "Las columnas especificadas en la consulta no existen.",
  "PGRST200": "La relación solicitada en la base de datos es ambigua.",

  // Conexión y tiempo de espera
  "57014": "La operación tardó demasiado tiempo y fue cancelada por seguridad.",
  "08000": "No fue posible conectar con el servidor central de datos.",
  "08006": "La conexión con el servidor fue interrumpida.",
};

/**
 * Traduce errores de Supabase / PostgreSQL / Red a mensajes amigables y comprensibles en español.
 * Evita exponer detalles internos de base de datos o fallos en inglés al usuario final.
 */
export function mapearErrorDatabase(
  error: unknown,
  fallback = "Ocurrió un error al procesar tu solicitud. Intenta nuevamente."
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return traducirMensajeTexto(error, fallback);
  }

  if (typeof error === "object") {
    const errObj = error as PostgrestErrorLike;

    // 1. Coincidencia por código SQLSTATE o PostgREST
    if (errObj.code && MENSAJES_SQLSTATE[errObj.code]) {
      return MENSAJES_SQLSTATE[errObj.code];
    }

    // 2. Coincidencia por mensaje de texto devuelto por la BD
    if (errObj.message) {
      return traducirMensajeTexto(errObj.message, fallback);
    }
  }

  if (error instanceof Error) {
    return traducirMensajeTexto(error.message, fallback);
  }

  return fallback;
}

function traducirMensajeTexto(mensaje: string, fallback: string): string {
  const m = mensaje.toLowerCase();

  // Excepciones lanzadas explícitamente desde PL/pgSQL
  if (m.includes("fuera del área de cobertura") || m.includes("cobertura en bagua")) {
    return "La ubicación está fuera de la zona de servicio de Bagua.";
  }
  if (m.includes("viaje no disponible") || m.includes("ya fue tomado")) {
    return "Esta solicitud de viaje ya no se encuentra disponible.";
  }
  if (m.includes("no tienes autorización") || m.includes("no eres el conductor")) {
    return "No cuentas con autorización para modificar este viaje.";
  }
  if (m.includes("monto no válido") || m.includes("piso técnico") || m.includes("contraoferta")) {
    return "La tarifa propuesta no se encuentra dentro de los márgenes permitidos.";
  }
  if (m.includes("jwt expired") || m.includes("token expired")) {
    return "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.";
  }

  // Errores de red y conectividad
  if (m.includes("network request failed") || m.includes("failed to fetch") || m.includes("aborted")) {
    return "Error de conexión a internet. Revisa tu señal y vuelve a intentar.";
  }
  if (m.includes("timeout") || m.includes("timed out")) {
    return "El servidor tardó demasiado en responder. Inténtalo de nuevo.";
  }

  // Si el mensaje es una oración limpia en español de un RAISE EXCEPTION, preservarla
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ0-9\s.,:;()/-]+$/.test(mensaje.trim()) && !mensaje.includes("relation") && !mensaje.includes("syntax error")) {
    return mensaje.trim();
  }

  return fallback;
}
