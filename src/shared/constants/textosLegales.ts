export interface SeccionTextoLegal {
  subtitulo?: string;
  contenido: string;
}

export interface TextoLegal {
  titulo: string;
  secciones: SeccionTextoLegal[];
}

// Textos copiados de preferencias.tsx y TerminosConductor.tsx para revisión legal
export const TERMINOS_SERVICIO: TextoLegal = {
  titulo: "Términos de servicio",
  secciones: [
    {
      subtitulo: "Términos y condiciones",
      contenido:
        "1. Mayoría de edad (+18 años).\n" +
        "2. Uso responsable del servicio de mototaxi.\n" +
        "3. Veracidad de los datos proporcionados.\n" +
        "4. El uso indebido puede ocasionar la suspensión de la cuenta.",
    },
    {
      subtitulo: "Términos y condiciones",
      contenido:
        "1. LICENCIA DE CONDUCIR\n\n" +
        "El conductor debe contar con una licencia de conducir Clase B, categoría II-C (B-IIc), vigente y correspondiente al vehículo menor utilizado para prestar el servicio de mototaxi.\n\n" +
        "2. DOCUMENTACIÓN Y SEGURO\n\n" +
        "El conductor debe mantener vigente el SOAT o CAT emitido por una AFOCAT autorizada, junto a la tarjeta de propiedad y revisión técnica obligatoria.\n\n" +
        "3. SEGURIDAD Y TRATO AL PASAJERO\n\n" +
        "El conductor debe respetar las normas de tránsito, límites de velocidad y capacidad máxima permitida (hasta 3 pasajeros según D.S. 055-2010-MTC).\n\n" +
        "4. RESPETO DE TARIFAS Y TRANSPARENCIA\n\n" +
        "Se debe respetar la tarifa informada por la aplicación, sin cobros indebidos no acordados.",
    },
  ],
};

export const POLITICA_PRIVACIDAD: TextoLegal = {
  titulo: "Política de privacidad",
  secciones: [
    {
      subtitulo: "Protección de datos personales (Ley N° 29733)",
      contenido:
        "ALTOKKE realiza el tratamiento de datos personales conforme a la Ley N° 29733.\n\n" +
        "Finalidad: Verificación de identidad ante RENIEC, geolocalización en tiempo real durante carreras activas, trazabilidad de seguridad y atención de emergencias.\n\n" +
        "Tus datos de ubicación solo se transmiten durante la prestación del servicio. Tienes derecho de acceso, rectificación, cancelación y oposición (ARCO).",
    },
  ],
};
