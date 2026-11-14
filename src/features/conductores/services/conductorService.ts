import { supabase } from "@/shared/api/supabase";
import {
  registroConductorService,
  DatosVehiculo,
  DocumentoAdjunto,
  DatosRegistroConductor,
} from "./registroConductorService";

export {
  type DatosVehiculo,
  type DocumentoAdjunto,
  type DatosRegistroConductor,
} from "./registroConductorService";

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
  async obtenerHistorialConductor(conductorId: string) {
    if (!conductorId) throw new Error("Se requiere el ID del conductor.");

    const { data, error } = await supabase
      .from("viajes")
      .select("id, creado_en, origen_texto, destino_texto, tarifa_final, tarifa_estimada, estado")
      .eq("conductor_id", conductorId)
      .order("creado_en", { ascending: false })
      .limit(50);

    if (error) throw new Error(`No se pudo consultar el historial: ${error.message}`);

    return (data ?? []).map((viaje) => {
      const fecha = new Date(viaje.creado_en);
      return {
        id: viaje.id,
        fecha: fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
        hora: fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        origen: viaje.origen_texto,
        destino: viaje.destino_texto,
        monto: Number(viaje.tarifa_final ?? viaje.tarifa_estimada ?? 0),
        estado: viaje.estado === "finalizado" ? ("Completado" as const) : ("Cancelado" as const),
      };
    });
  },

  async asegurarSesionConductor(
    correo: string,
    contrasena: string,
    datosPersonales: { nombre: string; apellidos: string; telefono: string; dni: string }
  ): Promise<string> {
    return registroConductorService.asegurarSesionConductor(correo, contrasena, datosPersonales);
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
    return registroConductorService.subirArchivosConductor(usuarioId, archivos);
  },

  async registrarVehiculo(usuarioId: string, vehiculo: DatosVehiculo): Promise<void> {
    return registroConductorService.registrarVehiculo(usuarioId, vehiculo);
  },

  async completarRegistroConductor(datos: DatosRegistroConductor): Promise<string> {
    return registroConductorService.completarRegistroConductor(datos);
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
        else if (t.includes("LICENCIA")) docsMap.licencia = { estado: est };
        else if (t.includes("SOAT")) docsMap.soat = { estado: est };
        else if (t.includes("PROPIEDAD")) docsMap.tarjetaPropiedad = { estado: est };
        else if (t.includes("ANTECEDENTES")) docsMap.antecedentesPenales = { estado: est };
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
        vehiculo: vData ? {
          placa: vData.placa, marca: vData.marca, modelo: vData.modelo,
          anio: vData.anio ?? 2026, color: vData.color, capacidad: vData.capacidad ?? 3,
        } : { placa: "M1-ALTO", marca: "Honda", modelo: "150", anio: 2026, color: "Negro", capacidad: 3 },
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
      const { error } = await supabase.from("usuarios").update(camposUsuario).eq("id", usuarioId);
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
      .select("id, pasajero_id, origen_texto, destino_texto, origen_lat, origen_lng, destino_lat, destino_lng, distancia_km, tarifa_estimada, metodo_pago, creado_en")
      .eq("estado", "buscando")
      .order("creado_en", { ascending: false })
      .limit(10);
    return data || [];
  },

  async aceptarSolicitud(viajeId: string, _conductorId?: string): Promise<void> {
    const { error } = await supabase.rpc("aceptar_viaje", { p_viaje_id: viajeId });
    if (error) throw error;
  },

  async cambiarEstadoViaje(
    viajeId: string,
    nuevoEstado: "en_camino_origen" | "esperando_pasajero" | "en_viaje"
  ): Promise<{ ok: boolean; viaje_id: string; estado_anterior: string; estado_nuevo: string }> {
    const { data, error } = await supabase.rpc("cambiar_estado_viaje", {
      p_viaje_id: viajeId,
      p_nuevo_estado: nuevoEstado,
    });
    if (error) throw error;
    return data;
  },

  async cancelarViajeConductor(
    viajeId: string,
    motivo: string
  ): Promise<{ ok: boolean; viaje_id: string; reabierto: boolean; motivo: string }> {
    const { data, error } = await supabase.rpc("cancelar_viaje_conductor", {
      p_viaje_id: viajeId,
      p_motivo: motivo,
    });
    if (error) throw error;
    return data;
  },

  async obtenerViajeActivoConductor(conductorId: string) {
    if (!conductorId) return null;
    const estadosActivos = ["aceptado", "en_camino_origen", "esperando_pasajero", "en_viaje"] as const;

    const { data, error } = await supabase
      .from("viajes")
      .select("*")
      .eq("conductor_id", conductorId)
      .in("estado", estadosActivos)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Aviso al consultar viaje activo de conductor:", error.message);
      return null;
    }
    return data;
  },

  async finalizarViaje(viajeId: string, _tarifaFinal?: number, _conductorId?: string): Promise<void> {
    const { error } = await supabase.rpc("finalizar_viaje", { p_viaje_id: viajeId });
    if (error) throw error;
  },

  async obtenerEstadoConductor(usuarioId: string): Promise<EstadoConductor> {
    return obtenerEstadoConductor(usuarioId);
  },
};
