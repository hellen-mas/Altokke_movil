import { supabase } from "@/lib/supabase";
import { TipoDocumento } from "@/services/documentosStorage";
import { storageService } from "@/services/storageService";

export interface DatosVehiculo {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  capacidad: number;
}

export interface DocumentoAdjunto {
  uri: string;
  nombre?: string;
  tipo?: string;
}

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

export const conductorService = {
  /**
   * Obtiene o autentica la cuenta del conductor para el registro
   */
  async asegurarSesionConductor(
    correo: string,
    contrasena: string,
    datosPersonales: {
      nombre: string;
      apellidos: string;
      telefono: string;
      dni: string;
    }
  ): Promise<string> {
    const emailNorm = correo.trim().toLowerCase();
    const { data: sesionData } = await supabase.auth.getSession();

    if (
      sesionData?.session?.user &&
      sesionData.session.user.email?.toLowerCase() === emailNorm &&
      sesionData.session.user.user_metadata?.rol === "conductor"
    ) {
      return sesionData.session.user.id;
    }

    // Limpiar sesión anterior antes de crear la nueva
    await supabase.auth.signOut({ scope: "local" });

    const { data, error: registroError } = await supabase.auth.signUp({
      email: emailNorm,
      password: contrasena,
      options: {
        data: {
          ...datosPersonales,
          rol: "conductor",
        },
      },
    });

    if (registroError) throw registroError;
    if (!data.user) throw new Error("No se pudo crear la cuenta de conductor.");
    if (!data.session) {
      throw new Error("CONFIRMAR_CORREO");
    }

    return data.user.id;
  },

  /**
   * Sube los documentos y fotos en paralelo y los registra en BD en 1 sola consulta batch
   */
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
    // 1. Subir avatar si existe
    if (archivos.foto) {
      const rutaAvatar = `${usuarioId}/perfil-${Date.now()}.jpg`;
      await storageService.subirArchivo("avatars", rutaAvatar, archivos.foto, {
        anchoMaximo: 800,
        calidad: 0.8,
      });
      const avatarUrl = storageService.obtenerUrlPublica("avatars", rutaAvatar);
      const { error } = await supabase
        .from("usuarios")
        .update({ avatar_url: avatarUrl })
        .eq("id", usuarioId);
      if (error) throw error;
    }

    // 2. Mapear documentos válidos
    const mapeoDocs: [TipoDocumento, DocumentoAdjunto | string | null | undefined][] = [
      ["DNI_FRONTAL", archivos.dniFrente],
      ["DNI_POSTERIOR", archivos.dniReverso],
      ["SELFIE", archivos.selfie],
      ["LICENCIA", archivos.licenciaConducir],
      ["SOAT", archivos.soat],
      ["ANTECEDENTES", archivos.antecedentesPenales],
    ];

    const docsValidos = mapeoDocs.filter(([, doc]) => Boolean(doc));

    // 3. Subir en paralelo a Supabase Storage con Promise.all
    const registrosDocumentos = await Promise.all(
      docsValidos.map(async ([tipo, doc]) => {
        const adjunto = typeof doc === "string" ? { uri: doc } : doc!;
        const esPdf =
          adjunto.tipo === "application/pdf" ||
          adjunto.nombre?.toLowerCase().endsWith(".pdf") ||
          adjunto.uri.toLowerCase().split("?")[0].endsWith(".pdf");

        const ext = esPdf ? "pdf" : "jpg";
        const ruta = `${usuarioId}/${tipo.toLowerCase()}-${Date.now()}.${ext}`;

        await storageService.subirArchivo("documentos-conductores", ruta, adjunto.uri, {
          esPdf,
          anchoMaximo: 1400,
          calidad: 0.85,
        });

        return {
          usuario_id: usuarioId,
          tipo,
          url_archivo: ruta,
          estado: "pendiente" as const,
        };
      })
    );

    // 4. Batch Insert en base de datos: 1 sola consulta
    if (registrosDocumentos.length > 0) {
      const { error: dbError } = await supabase.from("documentos").insert(registrosDocumentos);
      if (dbError) throw new Error(`Error al registrar documentos: ${dbError.message}`);
    }
  },

  /**
   * Registra el vehículo asociado al conductor
   */
  async registrarVehiculo(usuarioId: string, vehiculo: DatosVehiculo): Promise<void> {
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
    if (error) throw error;
  },

  /**
   * Automatización integral de registro de conductor
   */
  async completarRegistroConductor(datos: DatosRegistroConductor): Promise<string> {
    const usuarioId = await this.asegurarSesionConductor(
      datos.correo,
      datos.contrasena,
      {
        nombre: datos.nombre.trim(),
        apellidos: datos.apellidos.trim(),
        telefono: datos.telefono.trim(),
        dni: datos.dni.trim(),
      }
    );

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
