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

// 2. apiperu_hook: consulta el dni al escribir los 8 digitos
export function useConsultaDniQuery(
  dni: string,
  onEncontrado?: (nombres: string, apellidos: string) => void
) {
  const limpio = (dni || "").trim();
  const dniCompleto = /^\d{8}$/.test(limpio);

  const { data, error, isFetching, isSuccess, fetchStatus } = useQuery({
    queryKey: claveIdentidadDni(limpio),
    queryFn: () => identidadService.validarIdentidadDNI(limpio),
    // solo consulta cuando hay 8 digitos
    enabled: dniCompleto,
    // guarda en cache 24 horas para no repetir la consulta
    staleTime: UN_DIA,
    gcTime: UN_DIA,
    retry: false,
  });

  // avisa una sola vez para no repetir
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