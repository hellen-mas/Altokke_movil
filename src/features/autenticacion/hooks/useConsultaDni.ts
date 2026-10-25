import { useState, useEffect, useRef } from "react";
import { authService } from "@/features/autenticacion/services/authService";

interface ResultadoConsultaDni {
  cargando: boolean;
  error: string;
  dniVerificado: string;
  esValido: boolean;
}

export function useConsultaDni(
  dni: string,
  onEncontrado?: (nombres: string, apellidos: string) => void
): ResultadoConsultaDni {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [dniVerificado, setDniVerificado] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const limpio = (dni || "").trim();

    if (!/^\d{8}$/.test(limpio)) {
      setDniVerificado("");
      setError("");
      setCargando(false);
      return;
    }

    if (dniVerificado === limpio) return;

    const idActual = ++requestId.current;
    const timer = setTimeout(async () => {
      setCargando(true);
      setError("");

      try {
        const datos = await authService.validarIdentidadDNI(limpio);
        if (idActual !== requestId.current) return;

        setDniVerificado(limpio);
        onEncontrado?.(datos.nombres, datos.apellidos);
      } catch (err: any) {
        if (idActual !== requestId.current) return;

        setDniVerificado("");
        setError(
          err?.code === "DNI_YA_REGISTRADO"
            ? "Este número de DNI ya está registrado en otra cuenta de Altokke."
            : err?.message || "No se pudo validar el DNI. Inténtalo nuevamente."
        );
      } finally {
        if (idActual === requestId.current) setCargando(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [dni]);

  return {
    cargando,
    error,
    dniVerificado,
    esValido: dniVerificado === (dni || "").trim() && dniVerificado.length === 8,
  };
}
