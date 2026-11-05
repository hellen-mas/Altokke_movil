import NetInfo from "@react-native-community/netinfo";
import { invocarEdgeFunction } from "@/shared/api/supabase";
import {
  CODIGOS_ERROR_DNI,
  ErrorConsultaDni,
  mapearRespuestaDni,
  type DatosIdentidadDni,
  type CodigoErrorDni,
} from "./identidad.dto";

const cacheDni = new Map<string, DatosIdentidadDni>();

const MENSAJE_SIN_CONEXION = "No tienes conexión a internet. Revisa tu conexión e inténtalo nuevamente.";

function esCodigoDni(valor: unknown): valor is CodigoErrorDni {
  return Object.values(CODIGOS_ERROR_DNI).some(
    (codigo) => codigo === valor
  );
}

function convertirError(error: unknown): ErrorConsultaDni {
  if (error instanceof ErrorConsultaDni) {
    return error;
  }

  const fallo = error as {
    code?: unknown;
    message?: unknown;
    name?: unknown;
  } | null;

  const codigo = fallo?.code;

  if (esCodigoDni(codigo)) {
    return new ErrorConsultaDni(
      codigo,
      typeof fallo?.message === "string"
        ? fallo.message
        : "No fue posible consultar el DNI."
    );
  }

  if (
    fallo?.name === "AbortError" ||
    fallo?.name === "TimeoutError"
  ) {
    return new ErrorConsultaDni(
      CODIGOS_ERROR_DNI.TIMEOUT,
      "La consulta de DNI tardó demasiado."
    );
  }

  return new ErrorConsultaDni(
    CODIGOS_ERROR_DNI.PROVEEDOR,
    typeof fallo?.message === "string"
      ? fallo.message
      : "No fue posible consultar los datos del DNI."
  );
}

export const identidadService = {
  async existeDni(dni: string): Promise<boolean> {
    const limpio = dni.trim();

    if (!/^\\d{8}$/.test(limpio)) {
      throw new ErrorConsultaDni(
        CODIGOS_ERROR_DNI.INVALIDO,
        "El DNI debe contener exactamente 8 dígitos."
      );
    }

    try {
      await invocarEdgeFunction<unknown>("consultar-dni", { dni: limpio }, 10000);
      return false;
    } catch (error) {
      const convertido = convertirError(error);
      if (convertido.codigo === CODIGOS_ERROR_DNI.DUPLICADO) {
        return true;
      }
      throw convertido;
    }
  },

  async validarIdentidadDNI(dni: string): Promise<DatosIdentidadDni> {
    const limpio = dni.trim();

    if (!/^\d{8}$/.test(limpio)) {
      throw new ErrorConsultaDni(
        CODIGOS_ERROR_DNI.INVALIDO,
        "El DNI debe contener exactamente 8 dígitos."
      );
    }

    const red = await NetInfo.fetch().catch(() => null);

    if (
      red?.isConnected === false ||
      red?.isInternetReachable === false
    ) {
      throw new ErrorConsultaDni(
        CODIGOS_ERROR_DNI.SIN_CONEXION,
        MENSAJE_SIN_CONEXION
      );
    }

    try {
      const respuesta = await invocarEdgeFunction<unknown>(
        "consultar-dni",
        { dni: limpio },
        10000
      );

      return mapearRespuestaDni(respuesta);
    } catch (error) {
      throw convertirError(error);
    }
  },
};
