
export const CODIGOS_ERROR_DNI = {
  INVALIDO: "DNI_INVALIDO",
  NO_ENCONTRADO: "DNI_NO_ENCONTRADO",
  DUPLICADO: "DNI_YA_REGISTRADO",
  SIN_CONEXION: "SIN_CONEXION",
  TIMEOUT: "TIEMPO_AGOTADO",
  PROVEEDOR: "ERROR_PROVEEDOR",
  NO_AUTORIZADO: "NO_AUTORIZADO",
} as const;

export type CodigoErrorDni =
  (typeof CODIGOS_ERROR_DNI)[keyof typeof CODIGOS_ERROR_DNI];

export interface DatosIdentidadDni {
  nombres: string;
  apellidos: string;
}

export interface RespuestaDni {
  ok: true;
  nombres: string;
  apellidos: string;
}

export interface ApiPeruDniDTO {
  success: boolean;
  data?: {
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
  } | null;
}

export class ErrorConsultaDni extends Error {
  readonly code: CodigoErrorDni;

  constructor(
    public readonly codigo: CodigoErrorDni,
    mensaje: string
  ) {
    super(mensaje);
    this.name = "ErrorConsultaDni";
    this.code = codigo;
  }
}

function esObjeto(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

export function esRespuestaDni(
  valor: unknown
): valor is RespuestaDni {
  if (!esObjeto(valor)) return false;

  return (
    valor.ok === true &&
    typeof valor.nombres === "string" &&
    valor.nombres.trim().length > 0 &&
    typeof valor.apellidos === "string" &&
    valor.apellidos.trim().length > 0
  );
}

export function mapearRespuestaDni(
  valor: unknown
): DatosIdentidadDni {
  if (!esRespuestaDni(valor)) {
    throw new ErrorConsultaDni(
      CODIGOS_ERROR_DNI.PROVEEDOR,
      "El servicio devolvió datos de identidad inválidos."
    );
  }

  return {
    nombres: valor.nombres.trim(),
    apellidos: valor.apellidos.trim(),
  };
}

export function mapearRespuestaApiPeru(
  valor: unknown
): DatosIdentidadDni {
  if (!esObjeto(valor) || valor.success !== true) {
    throw new ErrorConsultaDni(
      CODIGOS_ERROR_DNI.NO_ENCONTRADO,
      "No se encontraron datos para este DNI."
    );
  }

  const data = valor.data;

  if (!esObjeto(data)) {
    throw new ErrorConsultaDni(
      CODIGOS_ERROR_DNI.PROVEEDOR,
      "La respuesta del proveedor no contiene datos válidos."
    );
  }

  const nombres =
    typeof data.nombres === "string"
      ? data.nombres.trim()
      : "";

  const paterno =
    typeof data.apellido_paterno === "string"
      ? data.apellido_paterno.trim()
      : "";

  const materno =
    typeof data.apellido_materno === "string"
      ? data.apellido_materno.trim()
      : "";

  const apellidos = [paterno, materno]
    .filter(Boolean)
    .join(" ");

  if (!nombres || !apellidos) {
    throw new ErrorConsultaDni(
      CODIGOS_ERROR_DNI.PROVEEDOR,
      "El proveedor devolvió información incompleta."
    );
  }

  return { nombres, apellidos };
}
