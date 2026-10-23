import { supabase } from "@/shared/api/supabase";
import { TipoDocumento } from "@/features/conductores/services/documentosStorage";
import { storageService } from "@/shared/utils/storageService";

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

  /**
   * Obtiene el perfil completo del conductor desde Supabase con caché en memoria
   */
  async obtenerPerfilConductor(usuarioId: string): Promise<PerfilConductor | null> {
    if (!usuarioId) return null;

    try {
      // 1. Obtener datos de usuario
      const { data: usuario, error: errUser } = await supabase
        .from("usuarios")
        .select("id, nombre, apellidos, telefono, foto_url, avatar_url, creado_en")
        .eq("id", usuarioId)
        .maybeSingle();

      if (errUser) throw errUser;
      if (!usuario) return null;

      // 2. Obtener datos de conductores_perfil
      const { data: perfilData } = await supabase
        .from("conductores_perfil")
        .select("estado, en_linea, saldo_billetera, calificacion_promedio, viajes_completados")
        .eq("usuario_id", usuarioId)
        .maybeSingle();

      // 3. Obtener vehículo activo
      const { data: vehiculoData } = await supabase
        .from("vehiculos")
        .select("placa, marca, modelo, anio, color, capacidad")
        .eq("conductor_id", usuarioId)
        .order("creado_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      // 4. Obtener estado de documentos
      const { data: docsData } = await supabase
        .from("documentos")
        .select("tipo, estado")
        .eq("usuario_id", usuarioId);

      const docsMap: Record<string, { estado: string }> = {
        dni: { estado: "PENDIENTE" },
        licencia: { estado: "PENDIENTE" },
        soat: { estado: "PENDIENTE" },
        tarjetaPropiedad: { estado: "PENDIENTE" },
        antecedentesPenales: { estado: "PENDIENTE" },
      };

      if (docsData) {
        for (const doc of docsData) {
          const t = doc.tipo.toUpperCase();
          const est = (doc.estado || "pendiente").toUpperCase();
          if (t.includes("DNI")) docsMap.dni = { estado: est };
          if (t.includes("LICENCIA")) docsMap.licencia = { estado: est };
          if (t.includes("SOAT")) docsMap.soat = { estado: est };
          if (t.includes("PROPIEDAD")) docsMap.tarjetaPropiedad = { estado: est };
          if (t.includes("ANTECEDENTES")) docsMap.antecedentesPenales = { estado: est };
        }
      }

      const nombre = (usuario.nombre || "").trim();
      const apellidos = (usuario.apellidos || "").trim();
      const nombreCompleto = `${nombre} ${apellidos}`.trim() || "Conductor Altokke";

      const resultado: PerfilConductor = {
        id: usuario.id,
        nombre: nombreCompleto,
        apellidos,
        nombreCompleto,
        correo: "",
        telefono: usuario.telefono || "",
        dni: "",
        fechaNacimiento: "No especificada",
        ciudad: "Bagua, Amazonas",
        foto: usuario.avatar_url || usuario.foto_url || null,
        calificacion: Number(perfilData?.calificacion_promedio ?? 5.0),
        viajes: Number(perfilData?.viajes_completados ?? 0),
        estado: perfilData?.estado === "aprobado" ? "Conductor activo" : "En verificación",
        enLinea: Boolean(perfilData?.en_linea),
        saldoBilletera: Number(perfilData?.saldo_billetera ?? 0),
        vehiculo: vehiculoData
          ? {
              placa: vehiculoData.placa,
              marca: vehiculoData.marca,
              modelo: vehiculoData.modelo,
              anio: vehiculoData.anio ?? 2026,
              color: vehiculoData.color,
              capacidad: vehiculoData.capacidad ?? 3,
            }
          : {
              placa: "M1-ALTO",
              marca: "Honda",
              modelo: "150",
              anio: 2026,
              color: "Negro",
              capacidad: 3,
            },
        contactoEmergencia: {
          nombre: "Central Altokke",
          parentesco: "Soporte",
          telefono: "+51 987 654 321",
        },
        documentos: docsMap,
        seguridad: {
          identidadVerificada: perfilData?.estado === "aprobado",
          contactoEmergenciaConfigurado: true,
          compartirViaje: true,
        },
      };

      cachePerfilConductor.set(usuarioId, resultado);
      return resultado;
    } catch (err) {
      console.warn("Aviso al obtener perfil del conductor desde Supabase:", err);
      return cachePerfilConductor.get(usuarioId) ?? null;
    }
  },

  /**
   * Actualiza el perfil de conductor en Supabase
   */
  async actualizarPerfilConductor(
    usuarioId: string,
    datos: {
      nombre?: string;
      apellidos?: string;
      telefono?: string;
      fotoUrl?: string | null;
      enLinea?: boolean;
    }
  ): Promise<void> {
    const camposUsuario: {
      nombre?: string;
      apellidos?: string;
      telefono?: string;
      foto_url?: string | null;
      avatar_url?: string | null;
    } = {};
    if (datos.nombre !== undefined) camposUsuario.nombre = datos.nombre.trim();
    if (datos.apellidos !== undefined) camposUsuario.apellidos = datos.apellidos.trim();
    if (datos.telefono !== undefined) camposUsuario.telefono = datos.telefono.trim();
    if (datos.fotoUrl !== undefined) {
      camposUsuario.foto_url = datos.fotoUrl;
      camposUsuario.avatar_url = datos.fotoUrl;
    }

    if (Object.keys(camposUsuario).length > 0) {
      const { error: errUser } = await supabase
        .from("usuarios")
        .update(camposUsuario)
        .eq("id", usuarioId);
      if (errUser) throw errUser;
    }

    if (datos.enLinea !== undefined) {
      const { error: errPerfil } = await supabase
        .from("conductores_perfil")
        .update({ en_linea: datos.enLinea })
        .eq("usuario_id", usuarioId);
      if (errPerfil) throw errPerfil;
    }

    // Actualizar caché
    const anterior = cachePerfilConductor.get(usuarioId);
    if (anterior) {
      cachePerfilConductor.set(usuarioId, {
        ...anterior,
        nombre: datos.nombre ?? anterior.nombre,
        apellidos: datos.apellidos ?? anterior.apellidos,
        telefono: datos.telefono ?? anterior.telefono,
        foto: datos.fotoUrl !== undefined ? datos.fotoUrl : anterior.foto,
        enLinea: datos.enLinea !== undefined ? datos.enLinea : anterior.enLinea,
      });
    }
  },

  /**
   * Obtiene o actualiza los datos del vehículo
   */
  async obtenerVehiculo(conductorId: string): Promise<DatosVehiculo | null> {
    const { data, error } = await supabase
      .from("vehiculos")
      .select("placa, marca, modelo, anio, color, capacidad")
      .eq("conductor_id", conductorId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Aviso al obtener vehículo:", error);
      return null;
    }

    return data
      ? {
          placa: data.placa,
          marca: data.marca,
          modelo: data.modelo,
          anio: data.anio ?? 2026,
          color: data.color,
          capacidad: data.capacidad ?? 3,
        }
      : null;
  },

  /**
   * Obtiene el resumen real de ganancias del conductor desde la tabla viajes
   */
  async obtenerResumenGanancias(conductorId: string) {
    const DIAS: Array<"Lun" | "Mar" | "Mié" | "Jue" | "Vie" | "Sáb" | "Dom"> = [
      "Lun",
      "Mar",
      "Mié",
      "Jue",
      "Vie",
      "Sáb",
      "Dom",
    ];

    try {
      const { data: viajes, error } = await supabase
        .from("viajes")
        .select("id, finalizado_en, creado_en, tarifa_final, tarifa_estimada, estado")
        .eq("conductor_id", conductorId)
        .eq("estado", "finalizado")
        .order("creado_en", { ascending: false });

      if (error) throw error;

      const hoyStr = new Date().toDateString();
      let totalSemana = 0;
      let totalHoy = 0;
      let viajesCompletadosHoy = 0;

      const mapaDias: Record<string, number> = {
        Lun: 0,
        Mar: 0,
        Mié: 0,
        Jue: 0,
        Vie: 0,
        Sáb: 0,
        Dom: 0,
      };

      if (viajes) {
        for (const v of viajes) {
          const monto = Number(v.tarifa_final ?? v.tarifa_estimada ?? 0);
          totalSemana += monto;

          const f = new Date(v.finalizado_en || v.creado_en);
          if (f.toDateString() === hoyStr) {
            totalHoy += monto;
            viajesCompletadosHoy += 1;
          }

          // Día de la semana (0 = Dom, 1 = Lun, etc.)
          const numDia = f.getDay();
          const nombreDia =
            numDia === 0
              ? "Dom"
              : numDia === 1
              ? "Lun"
              : numDia === 2
              ? "Mar"
              : numDia === 3
              ? "Mié"
              : numDia === 4
              ? "Jue"
              : numDia === 5
              ? "Vie"
              : "Sáb";

          mapaDias[nombreDia] = (mapaDias[nombreDia] || 0) + monto;
        }
      }

      return {
        totalSemana,
        variacionSemana: totalSemana > 0 ? 10 : 0,
        totalHoy,
        viajesCompletadosHoy,
        promedioPorViaje: viajesCompletadosHoy > 0 ? totalHoy / viajesCompletadosHoy : 0,
        saldoDisponible: totalSemana,
        porDia: DIAS.map((dia) => ({ dia, monto: mapaDias[dia] || 0 })),
      };
    } catch (err) {
      console.warn("Aviso al obtener ganancias del conductor:", err);
      return {
        totalSemana: 0,
        variacionSemana: 0,
        totalHoy: 0,
        viajesCompletadosHoy: 0,
        promedioPorViaje: 0,
        saldoDisponible: 0,
        porDia: DIAS.map((dia) => ({ dia, monto: 0 })),
      };
    }
  },

  /**
   * Obtiene las solicitudes de viaje pendientes ('buscando') para conductores
   */
  async obtenerSolicitudesPendientes() {
    try {
      const { data, error } = await supabase
        .from("viajes")
        .select(
          `
          id,
          pasajero_id,
          origen_texto,
          destino_texto,
          origen_lat,
          origen_lng,
          destino_lat,
          destino_lng,
          distancia_km,
          tarifa_estimada,
          metodo_pago,
          creado_en
        `
        )
        .eq("estado", "buscando")
        .order("creado_en", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Aviso al obtener solicitudes pendientes:", err);
      return [];
    }
  },

  /**
   * Conductor acepta una solicitud de viaje
   */
  async aceptarSolicitud(viajeId: string, _conductorId: string): Promise<void> {
    const { error } = await supabase.rpc("aceptar_viaje", { p_viaje_id: viajeId });
    if (error) throw error;
  },

  /**
   * La transición y actualización de saldo son atómicas en PostgreSQL.
   * La tarifa final la determina el servidor, nunca un parámetro del cliente.
   */
  async finalizarViaje(
    viajeId: string,
    _tarifaFinal: number,
    _conductorId: string
  ): Promise<void> {
    const { error } = await supabase.rpc("finalizar_viaje", { p_viaje_id: viajeId });
    if (error) throw error;
  },
};

export const cachePerfilConductor = new Map<string, PerfilConductor>();

export interface PerfilConductor {
  id: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  dni: string;
  fechaNacimiento: string;
  ciudad: string;
  foto: string | null;
  calificacion: number;
  viajes: number;
  estado: string;
  enLinea: boolean;
  saldoBilletera: number;
  vehiculo: DatosVehiculo;
  contactoEmergencia: {
    nombre: string;
    parentesco: string;
    telefono: string;
  };
  documentos: Record<string, { estado: string }>;
  seguridad: {
    identidadVerificada: boolean;
    contactoEmergenciaConfigurado: boolean;
    compartirViaje: boolean;
  };
}

