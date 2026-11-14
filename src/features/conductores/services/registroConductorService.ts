import { supabase } from "@/shared/api/supabase";
import { subirFotoAvatar } from "@/shared/utils/avatar";
import * as FileSystem from "expo-file-system/legacy";
import {
  TipoDocumento,
  ArchivoSubida,
  DocumentoParaSubir,
  storageService,
} from "@/shared/utils/storageService";

export interface DatosVehiculo {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  capacidad: number;
}

export type DocumentoAdjunto = ArchivoSubida;

export interface DatosRegistroConductor {
  correo: string;
  contrasena: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  dni: string;
  foto?: string | null;
  dniFrente?: string | null;
  dniReverso?: string | null;
  selfie?: string | null;
  licenciaConducir?: DocumentoAdjunto | null;
  soat?: DocumentoAdjunto | null;
  antecedentesPenales?: DocumentoAdjunto | null;
  vehiculo: DatosVehiculo;
}

export const registroConductorService = {
  async asegurarSesionConductor(
    correo: string,
    contrasena: string,
    datosPersonales: { nombre: string; apellidos: string; telefono: string; dni: string }
  ): Promise<string> {
    const emailNorm = correo.trim().toLowerCase();

    const validarUsuarioConductor = (usuario: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    }): string => {
      if (
        usuario.email?.toLowerCase() !== emailNorm ||
        usuario.user_metadata?.rol !== "conductor"
      ) {
        throw new Error("Esta cuenta no corresponde a un conductor. Verifica tus datos.");
      }
      return usuario.id;
    };

    const { data: sesionData, error: errorSesion } = await supabase.auth.getSession();
    if (errorSesion) throw errorSesion;
    const usuarioActual = sesionData.session?.user;

    if (usuarioActual?.email?.toLowerCase() === emailNorm) {
      return validarUsuarioConductor(usuarioActual);
    }

    if (usuarioActual) {
      const { error: errorSalida } = await supabase.auth.signOut({ scope: "local" });
      if (errorSalida) throw errorSalida;
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password: contrasena,
      options: { data: { ...datosPersonales, rol: "conductor" } },
    });

    if (!error && data.session?.user) {
      return validarUsuarioConductor(data.session.user);
    }

    const { data: acceso, error: errorAcceso } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password: contrasena,
    });

    if (!errorAcceso && acceso.user && acceso.session) {
      return validarUsuarioConductor(acceso.user);
    }

    if (errorAcceso?.message?.toLowerCase().includes("email not confirmed")) {
      throw new Error("CONFIRMAR_CORREO");
    }

    if (error?.message?.toLowerCase().includes("already registered")) {
      throw new Error(
        "La cuenta ya existe. Ingresa la contraseña correcta para recuperar tu registro."
      );
    }

    if (error) throw error;
    throw new Error("No se pudo iniciar la sesión. Verifica tu correo y contraseña.");
  },

  async subirArchivosConductor(
    usuarioId: string,
    archivos: {
      foto?: string | null;
      dniFrente?: string | null;
      dniReverso?: string | null;
      selfie?: string | null;
      licenciaConducir?: DocumentoAdjunto | null;
      soat?: DocumentoAdjunto | null;
      antecedentesPenales?: DocumentoAdjunto | null;
    }
  ): Promise<void> {
    if (archivos.foto) {
      const base64 = await FileSystem.readAsStringAsync(archivos.foto, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const resultado = await subirFotoAvatar(archivos.foto, usuarioId, base64);
      if (!resultado.ok || !resultado.url) {
        throw new Error(resultado.error || "No se pudo validar y guardar la foto del conductor.");
      }
    }

    const itemsBrutos: { tipo: TipoDocumento; adjunto?: DocumentoAdjunto | string | null }[] = [
      { tipo: "DNI_FRONTAL", adjunto: archivos.dniFrente },
      { tipo: "DNI_POSTERIOR", adjunto: archivos.dniReverso },
      { tipo: "SELFIE", adjunto: archivos.selfie },
      { tipo: "LICENCIA", adjunto: archivos.licenciaConducir },
      { tipo: "SOAT", adjunto: archivos.soat },
      { tipo: "ANTECEDENTES", adjunto: archivos.antecedentesPenales },
    ];

    const loteParaSubir: DocumentoParaSubir[] = [];
    for (const item of itemsBrutos) {
      if (item.adjunto) {
        loteParaSubir.push({
          tipo: item.tipo,
          adjunto: item.adjunto,
        });
      }
    }

    if (loteParaSubir.length > 0) {
      await storageService.subirLoteDocumentos(usuarioId, loteParaSubir);
    }
  },

  async registrarVehiculo(usuarioId: string, vehiculo: DatosVehiculo): Promise<void> {
    const { data: existente, error: errorConsulta } = await supabase
      .from("vehiculos")
      .select("id")
      .eq("conductor_id", usuarioId)
      .eq("placa", vehiculo.placa.trim().toUpperCase())
      .maybeSingle();

    if (errorConsulta) {
      throw new Error(`No se pudo verificar el vehículo: ${errorConsulta.message}`);
    }

    if (existente) return;

    const { error } = await supabase.from("vehiculos").insert({
      conductor_id: usuarioId,
      placa: vehiculo.placa.trim().toUpperCase(),
      marca: vehiculo.marca.trim(),
      modelo: vehiculo.modelo.trim(),
      anio: Number(vehiculo.anio),
      color: vehiculo.color.trim(),
      capacidad: Number(vehiculo.capacidad),
      activo: false,
    });

    if (error) {
      throw new Error(`No se pudo registrar el vehículo ${error.message}`);
    }
  },

  async completarRegistroConductor(datos: DatosRegistroConductor): Promise<string> {
    const usuarioId = await this.asegurarSesionConductor(datos.correo, datos.contrasena, {
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      telefono: datos.telefono.trim(),
      dni: datos.dni.trim(),
    });

    await this.subirArchivosConductor(usuarioId, {
      foto: datos.foto,
      dniFrente: datos.dniFrente,
      dniReverso: datos.dniReverso,
      selfie: datos.selfie,
      licenciaConducir: datos.licenciaConducir,
      soat: datos.soat,
      antecedentesPenales: datos.antecedentesPenales,
    });

    await this.registrarVehiculo(usuarioId, datos.vehiculo);
    return usuarioId;
  },
};
