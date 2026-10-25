import { supabase } from "@/shared/api/supabase";
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
  contactoEmergencia: { nombre: string; parentesco: string; telefono: string };
  documentos: Record<string, { estado: string }>;
  seguridad: {
    identidadVerificada: boolean;
    contactoEmergenciaConfigurado: boolean;
    compartirViaje: boolean;
  };
}

export type EstadoConductor = "pendiente" | "aprobado" | "rechazado" | "suspendido";

export const cachePerfilConductor = new Map<string, PerfilConductor>();

export async function obtenerEstadoConductor(usuarioId: string): Promise<EstadoConductor> {
  const { data, error } = await supabase
    .from("conductores_perfil")
    .select("estado")
    .eq("usuario_id", usuarioId)
    .single();

  if (error || !data?.estado) throw new Error("No se encontró la solicitud del conductor.");
  return data.estado as EstadoConductor;
}

export const conductorService = {
  async asegurarSesionConductor(
    correo: string,
    contrasena: string,
    datosPersonales: { nombre: string; apellidos: string; telefono: string; dni: string }
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

    await supabase.auth.signOut({ scope: "local" });

    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password: contrasena,
      options: { data: { ...datosPersonales, rol: "conductor" } },
    });

    if (error) throw error;
    if (!data.user) throw new Error("No se pudo crear la cuenta de conductor.");
    if (!data.session) throw new Error("CONFIRMAR_CORREO");

    return data.user.id;
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
      const rutaAvatar = `${usuarioId}/perfil-${Date.now()}.jpg`;
      await storageService.subirArchivo("avatars", rutaAvatar, archivos.foto, {
        anchoMaximo: 800,
        calidad: 0.8,
      });
      const avatarUrl = storageService.obtenerUrlPublica("avatars", rutaAvatar);
      await supabase
        .from("usuarios")
        .update({ avatar_url: avatarUrl })
        .eq("id", usuarioId);
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

  async obtenerPerfilConductor(usuarioId: string): Promise<PerfilConductor | null> {
    if (!usuarioId) return null;

    try {
      const [uRes, pRes, vRes, dRes] = await Promise.all([
        supabase
          .from("usuarios")
          .select("id, nombre, apellidos, telefono, avatar_url, foto_url")
          .eq("id", usuarioId)
          .maybeSingle(),
        supabase
          .from("conductores_perfil")
          .select("estado, en_linea, saldo_billetera, calificacion_promedio, viajes_completados")
          .eq("usuario_id", usuarioId)
          .maybeSingle(),
        supabase
          .from("vehiculos")
          .select("placa, marca, modelo, anio, color, capacidad")
          .eq("conductor_id", usuarioId)
          .order("creado_en", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("documentos")
          .select("tipo, estado")
          .eq("usuario_id", usuarioId),
      ]);

      const usuario = uRes.data;
      if (!usuario) return null;

      const pData = pRes.data;
      const vData = vRes.data;
      const docsMap: Record<string, { estado: string }> = {
        dni: { estado: "PENDIENTE" },
        licencia: { estado: "PENDIENTE" },
        soat: { estado: "PENDIENTE" },
        tarjetaPropiedad: { estado: "PENDIENTE" },
        antecedentesPenales: { estado: "PENDIENTE" },
      };

      for (const doc of dRes.data || []) {
        const t = (doc.tipo || "").toUpperCase();
        const est = (doc.estado || "pendiente").toUpperCase();
        if (t.includes("DNI")) docsMap.dni = { estado: est };
        if (t.includes("LICENCIA")) docsMap.licencia = { estado: est };
        if (t.includes("SOAT")) docsMap.soat = { estado: est };
        if (t.includes("PROPIEDAD")) docsMap.tarjetaPropiedad = { estado: est };
        if (t.includes("ANTECEDENTES")) docsMap.antecedentesPenales = { estado: est };
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
        calificacion: Number(pData?.calificacion_promedio ?? 5.0),
        viajes: Number(pData?.viajes_completados ?? 0),
        estado: pData?.estado === "aprobado" ? "Conductor activo" : "En verificación",
        enLinea: Boolean(pData?.en_linea),
        saldoBilletera: Number(pData?.saldo_billetera ?? 0),
        vehiculo: vData
          ? {
              placa: vData.placa,
              marca: vData.marca,
              modelo: vData.modelo,
              anio: vData.anio ?? 2026,
              color: vData.color,
              capacidad: vData.capacidad ?? 3,
            }
          : { placa: "M1-ALTO", marca: "Honda", modelo: "150", anio: 2026, color: "Negro", capacidad: 3 },
        contactoEmergencia: { nombre: "Central Altokke", parentesco: "Soporte", telefono: "+51 987 654 321" },
        documentos: docsMap,
        seguridad: {
          identidadVerificada: pData?.estado === "aprobado",
          contactoEmergenciaConfigurado: true,
          compartirViaje: true,
        },
      };

      cachePerfilConductor.set(usuarioId, resultado);
      return resultado;
    } catch {
      return cachePerfilConductor.get(usuarioId) ?? null;
    }
  },

  async actualizarPerfilConductor(
    usuarioId: string,
    datos: { nombre?: string; apellidos?: string; telefono?: string; fotoUrl?: string | null; enLinea?: boolean }
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
      const { error } = await supabase
        .from("usuarios")
        .update(camposUsuario)
        .eq("id", usuarioId);
      if (error) throw error;
    }

    if (datos.enLinea !== undefined) {
      const { error } = await supabase
        .from("conductores_perfil")
        .update({ en_linea: datos.enLinea })
        .eq("usuario_id", usuarioId);
      if (error) throw error;
    }

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

  async obtenerVehiculo(conductorId: string): Promise<DatosVehiculo | null> {
    const { data, error } = await supabase
      .from("vehiculos")
      .select("placa, marca, modelo, anio, color, capacidad")
      .eq("conductor_id", conductorId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      placa: data.placa,
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio ?? 2026,
      color: data.color,
      capacidad: data.capacidad ?? 3,
    };
  },

  async obtenerResumenGanancias(conductorId: string) {
    const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
    const nombresDia = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    try {
      const { data: viajes, error } = await supabase
        .from("viajes")
        .select("tarifa_final, tarifa_estimada, finalizado_en, creado_en")
        .eq("conductor_id", conductorId)
        .eq("estado", "finalizado")
        .order("creado_en", { ascending: false });

      if (error) throw error;

      const hoyStr = new Date().toDateString();
      let totalSemana = 0;
      let totalHoy = 0;
      let viajesHoy = 0;
      const mapaDias: Record<string, number> = Object.fromEntries(DIAS.map((d) => [d, 0]));

      for (const v of viajes || []) {
        const monto = Number(v.tarifa_final ?? v.tarifa_estimada ?? 0);
        totalSemana += monto;
        const f = new Date(v.finalizado_en || v.creado_en);
        if (f.toDateString() === hoyStr) {
          totalHoy += monto;
          viajesHoy += 1;
        }
        const diaSemana = nombresDia[f.getDay()];
        if (diaSemana in mapaDias) mapaDias[diaSemana] += monto;
      }

      return {
        totalSemana,
        variacionSemana: totalSemana > 0 ? 10 : 0,
        totalHoy,
        viajesCompletadosHoy: viajesHoy,
        promedioPorViaje: viajesHoy > 0 ? totalHoy / viajesHoy : 0,
        saldoDisponible: totalSemana,
        porDia: DIAS.map((dia) => ({ dia, monto: mapaDias[dia] || 0 })),
      };
    } catch {
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

  async obtenerSolicitudesPendientes() {
    const { data } = await supabase
      .from("viajes")
      .select(`
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
      `)
      .eq("estado", "buscando")
      .order("creado_en", { ascending: false })
      .limit(10);
    return data || [];
  },

  async aceptarSolicitud(viajeId: string, _conductorId?: string): Promise<void> {
    const { error } = await supabase.rpc("aceptar_viaje", { p_viaje_id: viajeId });
    if (error) throw error;
  },

  async finalizarViaje(viajeId: string, _tarifaFinal?: number, _conductorId?: string): Promise<void> {
    const { error } = await supabase.rpc("finalizar_viaje", { p_viaje_id: viajeId });
    if (error) throw error;
  },

  async obtenerEstadoConductor(usuarioId: string): Promise<EstadoConductor> {
    return obtenerEstadoConductor(usuarioId);
  },
};
