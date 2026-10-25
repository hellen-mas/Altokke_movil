import { supabase } from "@/shared/api/supabase";

export interface DireccionGuardada {
  id: string;
  nombre: string;
  direccion: string;
  icono: string;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
}

export interface PreferenciasPasajero {
  direcciones?: DireccionGuardada[];
  notificaciones?: {
    promociones?: boolean;
    viaje?: boolean;
    recordatorios?: boolean;
    correo?: boolean;
    push?: boolean;
    sms?: boolean;
    [key: string]: boolean | undefined;
  };
  tema?: "automatico" | "claro" | "oscuro";
  idioma?: string;
  unidades?: "km" | "mi";
  mapaEstilo?: "estandar" | "satelite";
  metodo_pago?: "efectivo" | "yape" | "plin";
  dni?: string;
  fechaNacimiento?: string;
  genero?: string;
  contactoEmergencia?: {
    nombre: string;
    telefono: string;
  };
  [key: string]: any;
}

export interface PerfilPasajero {
  id: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  primerNombre: string;
  correo: string;
  telefono: string;
  fotoUrl: string | null;
  calificacion: number;
  viajesCount: number;
  dni: string;
  fechaNacimiento: string;
  genero: string;
  contactoEmergencia?: {
    nombre: string;
    telefono: string;
  };
  preferencias: PreferenciasPasajero;
}

const cachePerfilPasajero = new Map<string, PerfilPasajero>();

function formatearPrimerNombre(nombre: string): string {
  if (!nombre) return "";
  const primer = nombre.trim().split(" ")[0];
  return primer ? primer.charAt(0).toUpperCase() + primer.slice(1).toLowerCase() : "";
}

export const pasajeroService = {
  obtenerPerfilEnCache(userId: string): PerfilPasajero | null {
    return cachePerfilPasajero.get(userId) || null;
  },

  async obtenerPerfil(userId: string, metadataUsuario?: any): Promise<PerfilPasajero> {
    if (!userId) throw new Error("Se requiere el ID de usuario para obtener su perfil");

    try {
      const [usuarioRes, perfilRes, viajesCountRes] = await Promise.all([
        supabase
          .from("usuarios")
          .select("id, nombre, apellidos, telefono, avatar_url, foto_url")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("pasajeros_perfil")
          .select("preferencias, calificacion_promedio")
          .eq("usuario_id", userId)
          .maybeSingle(),
        supabase
          .from("viajes")
          .select("id", { count: "exact", head: true })
          .eq("pasajero_id", userId)
          .eq("estado", "finalizado"),
      ]);

      const dataUsuario = usuarioRes.data;
      const dataPerfil = perfilRes.data;

      const nombre = (
        dataUsuario?.nombre ||
        metadataUsuario?.nombre ||
        metadataUsuario?.full_name?.split(" ")[0] ||
        "Pasajero"
      ).trim();

      const apellidos = (dataUsuario?.apellidos || metadataUsuario?.apellidos || "").trim();
      const preferencias: PreferenciasPasajero = (dataPerfil?.preferencias as PreferenciasPasajero) || {};

      const perfil: PerfilPasajero = {
        id: userId,
        nombre,
        apellidos,
        nombreCompleto: apellidos ? `${nombre} ${apellidos}` : nombre,
        primerNombre: formatearPrimerNombre(nombre),
        correo: metadataUsuario?.email || "",
        telefono: dataUsuario?.telefono || metadataUsuario?.telefono || "",
        fotoUrl: dataUsuario?.avatar_url || dataUsuario?.foto_url || metadataUsuario?.avatar_url || null,
        calificacion: Number(dataPerfil?.calificacion_promedio ?? 5.0),
        viajesCount: viajesCountRes.count ?? 0,
        dni: metadataUsuario?.dni || preferencias.dni || "Sin registrar",
        fechaNacimiento: metadataUsuario?.fecha_nacimiento || preferencias.fechaNacimiento || "Sin registrar",
        genero: preferencias.genero || "Sin registrar",
        contactoEmergencia: preferencias.contactoEmergencia,
        preferencias,
      };

      cachePerfilPasajero.set(userId, perfil);
      return perfil;
    } catch (error) {
      console.warn("Aviso al consultar perfil de pasajero:", error);
      const cacheado = cachePerfilPasajero.get(userId);
      if (cacheado) return cacheado;
      throw error;
    }
  },

  async actualizarDatosPersonales(
    userId: string,
    datos: {
      nombre?: string;
      apellidos?: string;
      telefono?: string;
      dni?: string;
      fechaNacimiento?: string;
      genero?: string;
      contactoEmergencia?: { nombre: string; telefono: string };
    }
  ): Promise<PerfilPasajero> {
    const perfilActual = cachePerfilPasajero.get(userId);

    const camposUsuario: { nombre?: string; apellidos?: string; telefono?: string } = {};
    if (datos.nombre !== undefined) camposUsuario.nombre = datos.nombre.trim();
    if (datos.apellidos !== undefined) camposUsuario.apellidos = datos.apellidos.trim();
    if (datos.telefono !== undefined) camposUsuario.telefono = datos.telefono.trim();

    if (Object.keys(camposUsuario).length > 0) {
      const { error } = await supabase
        .from("usuarios")
        .update(camposUsuario)
        .eq("id", userId);
      if (error) throw error;
    }

    const nuevasPreferencias: PreferenciasPasajero = {
      ...(perfilActual?.preferencias || {}),
    };
    if (datos.dni !== undefined) nuevasPreferencias.dni = datos.dni.trim();
    if (datos.fechaNacimiento !== undefined) nuevasPreferencias.fechaNacimiento = datos.fechaNacimiento;
    if (datos.genero !== undefined) nuevasPreferencias.genero = datos.genero;
    if (datos.contactoEmergencia !== undefined) nuevasPreferencias.contactoEmergencia = datos.contactoEmergencia;

    await this.guardarPreferencias(userId, nuevasPreferencias);

    supabase.auth.updateUser({
      data: {
        nombre: datos.nombre ?? perfilActual?.nombre,
        apellidos: datos.apellidos ?? perfilActual?.apellidos,
        telefono: datos.telefono ?? perfilActual?.telefono,
        dni: datos.dni ?? perfilActual?.dni,
      },
    }).catch((err) => console.warn("Aviso al sincronizar auth metadata:", err));

    return await this.obtenerPerfil(userId);
  },

  async guardarPreferencias(
    userId: string,
    nuevasPreferencias: Partial<PreferenciasPasajero>
  ): Promise<PreferenciasPasajero> {
    const perfilActual = cachePerfilPasajero.get(userId);
    const preferenciasCombinadas: PreferenciasPasajero = {
      ...(perfilActual?.preferencias || {}),
      ...nuevasPreferencias,
    };

    const { error } = await supabase.from("pasajeros_perfil").upsert({
      usuario_id: userId,
      preferencias: preferenciasCombinadas,
    });
    if (error) throw error;

    if (perfilActual) {
      perfilActual.preferencias = preferenciasCombinadas;
      cachePerfilPasajero.set(userId, perfilActual);
    }

    return preferenciasCombinadas;
  },

  async guardarDireccion(userId: string, direccion: DireccionGuardada): Promise<DireccionGuardada[]> {
    const perfilActual = cachePerfilPasajero.get(userId);
    const direcciones = [...(perfilActual?.preferencias.direcciones || [])];
    const index = direcciones.findIndex((d) => d.id === direccion.id);

    if (index >= 0) {
      direcciones[index] = direccion;
    } else {
      direcciones.push(direccion);
    }

    await this.guardarPreferencias(userId, { direcciones });
    return direcciones;
  },

  async eliminarDireccion(userId: string, direccionId: string): Promise<DireccionGuardada[]> {
    const perfilActual = cachePerfilPasajero.get(userId);
    const direcciones = (perfilActual?.preferencias.direcciones || []).filter((d) => d.id !== direccionId);
    await this.guardarPreferencias(userId, { direcciones });
    return direcciones;
  },
};
