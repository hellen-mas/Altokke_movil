import {
  CODIGOS_ERROR_DNI,
  ErrorConsultaDni,
  type CodigoErrorDni,
} from "@/features/autenticacion/services/identidad.dto";
import { identidadService } from "@/features/autenticacion/services/identidadService";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const UN_DIA = 1000 * 60 * 60 * 24;
const MENSAJE_SIN_CONEXION =
  "No tienes conexión a internet. La consulta se reanudará al volver la conexión.";

export const claveIdentidadDni = (dni: string) => ["identidad-dni", dni] as const;

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorConsultaDni && error.codigo === CODIGOS_ERROR_DNI.DUPLICADO) {
    return "Este número de DNI ya está registrado en otra cuenta de Altokke.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo validar el DNI. Inténtalo nuevamente.";
}

// 3. APIPERU_HOOK_QUERY: Custom hook con TanStack Query para consultar DNI con validación a 8 dígitos y caché de 24h
export function useConsultaDniQuery(
  dni: string,
  onEncontrado?: (nombres: string, apellidos: string) => void
) {
  const limpio = (dni || "").trim();
  const dniCompleto = /^\d{8}$/.test(limpio);

  const { data, error, isFetching, isSuccess, fetchStatus } = useQuery({
    queryKey: claveIdentidadDni(limpio),
    queryFn: () => identidadService.validarIdentidadDNI(limpio),
    // enabled: Solo se dispara con 8 dígitos numéricos exactos (evita peticiones innecesarias)
    enabled: dniCompleto,
    // staleTime / gcTime: Guarda en caché 24 horas para no pagar de más a la API ni saturar la red
    staleTime: UN_DIA,
    gcTime: UN_DIA,
    // retry: false: Si el DNI no existe o está duplicado, no reintenta automáticamente
    retry: false,
  });

  // useRef para evitar notificar repetidamente a la UI si la pantalla se re-renderiza
  const ultimoNotificado = useRef<string | null>(null);

  useEffect(() => {
    if (!dniCompleto) {
      ultimoNotificado.current = null;
      return;
    }
    if (!data || ultimoNotificado.current === limpio) return;

    ultimoNotificado.current = limpio;
    onEncontrado?.(data.nombres, data.apellidos);
  }, [data, dniCompleto, limpio, onEncontrado]);

  // "paused": no hay internet; TanStack la reanuda sola al volver la conexión.
  const sinConexion = fetchStatus === "paused";

  const codigoError: CodigoErrorDni | null = sinConexion
    ? CODIGOS_ERROR_DNI.SIN_CONEXION
    : error instanceof ErrorConsultaDni
      ? error.codigo
      : null;

  return {
    cargando: isFetching,
    error: sinConexion ? MENSAJE_SIN_CONEXION : error ? mensajeDeError(error) : "",
    codigoError,
    dniVerificado: isSuccess ? limpio : "",
    esValido: dniCompleto && isSuccess,
  };
}