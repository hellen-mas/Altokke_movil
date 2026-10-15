
import { supabase } from "@/lib/supabase";

type ResultadoEnvio = {
  enviado: boolean;
  solicitudId: string;
  mensaje: string;
};

type ResultadoVerificacion = {
  verificado: boolean;
  mensaje: string;
};

async function invocarOtp<T>(body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(
    "conductor-otp",
    { body }
  );

  if (error) {
    let mensaje = "No se pudo conectar al servicio OTP.";

    if (error.context instanceof Response) {
      try {
        const detalle = await error.context.json();
        mensaje = detalle.error || mensaje;
      } catch {
        // Conservamos el mensaje general.
      }
    }

    throw new Error(mensaje);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

export function enviarOtp(telefono: string) {
  return invocarOtp<ResultadoEnvio>({
    accion: "enviar",
    telefono: `51${telefono}`,
  });
}

export function verificarOtp(
  telefono: string,
  codigo: string,
  solicitudId: string
) {
  return invocarOtp<ResultadoVerificacion>({
    accion: "verificar",
    telefono: `51${telefono}`,
    codigo,
    solicitudId,
  });
}
