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

// Cache en memoria para navegación instantánea (0ms de retraso entre tabs)
const cachePerfilPasajero = new Map<string, PerfilPasajero>();

function formatearPrimerNombre(nombre: string): string {
  if (!nombre) return "";
  const primer = nombre.trim().split(" ")[0];
  if (!primer) return "";
  return primer.charAt(0).toUpperCase() + primer.slice(1).toLowerCase();
}

export const pasajeroService = {
  /**
   * Obtiene el perfil del pasajero desde la caché en memoria si existe
   */
  obtenerPerfilEnCache(userId: string): PerfilPasajero | null {
    return cachePerfilPasajero.get(userId) || null;
  },

  /**
   * Consulta el perfil completo desde Supabase (usuarios, pasajeros_perfil, viajes)
   * y refresca la caché en memoria.
   */
  async obtenerPerfil(userId: string, metadataUsuario?: any): Promise<PerfilPasajero> {
    if (!userId) {
      throw new Error("Se requiere el ID de usuario para obtener su perfil");
    }

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

      const apellidos = (
        dataUsuario?.apellidos ||
        metadataUsuario?.apellidos ||
        ""
      ).trim();

      const nombreCompleto = apellidos ? `${nombre} ${apellidos}` : nombre;
      const primerNombre = formatearPrimerNombre(nombre);
      const telefono = dataUsuario?.telefono || metadataUsuario?.telefono || "";
      const correo = metadataUsuario?.email || "";
      const fotoUrl =
        dataUsuario?.avatar_url ||
        dataUsuario?.foto_url ||
        metadataUsuario?.avatar_url ||
        metadataUsuario?.picture ||
        null;

      const calificacion = dataPerfil?.calificacion_promedio
        ? Number(dataPerfil.calificacion_promedio)
        : 5.0;

      const viajesCount = viajesCountRes.count ?? 0;
      const preferencias: PreferenciasPasajero = (dataPerfil?.preferencias as PreferenciasPasajero) || {};

      const perfil: PerfilPasajero = {
        id: userId,
        nombre,
        apellidos,
        nombreCompleto,
        primerNombre,
        correo,
        telefono,
        fotoUrl,
        calificacion,
        viajesCount,
        dni: metadataUsuario?.dni || preferencias.dni || "Sin registrar",
        fechaNacimiento:
          metadataUsuario?.fecha_nacimiento ||
          preferencias.fechaNacimiento ||
          "Sin registrar",
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

  /**
   * Actualiza datos personales del usuario en public.usuarios y en auth.metadata
   */
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

    // Actualizar preferencias si hay campos extendidos
    const nuevasPreferencias: PreferenciasPasajero = {
      ...(perfilActual?.preferencias || {}),
    };

    if (datos.dni !== undefined) nuevasPreferencias.dni = datos.dni.trim();
    if (datos.fechaNacimiento !== undefined) nuevasPreferencias.fechaNacimiento = datos.fechaNacimiento;
    if (datos.genero !== undefined) nuevasPreferencias.genero = datos.genero;
    if (datos.contactoEmergencia !== undefined) nuevasPreferencias.contactoEmergencia = datos.contactoEmergencia;

    await this.guardarPreferencias(userId, nuevasPreferencias);

    // Sincronizar metadata en auth de Supabase
    try {
      await supabase.auth.updateUser({
        data: {
          nombre: datos.nombre ?? perfilActual?.nombre,
          apellidos: datos.apellidos ?? perfilActual?.apellidos,
          telefono: datos.telefono ?? perfilActual?.telefono,
          dni: datos.dni ?? perfilActual?.dni,
        },
      });
    } catch (err) {
      console.warn("Aviso al actualizar auth metadata:", err);
    }

    return await this.obtenerPerfil(userId);
  },

  /**
   * Guarda o combina preferencias del pasajero en la tabla pasajeros_perfil
   */
  async guardarPreferencias(
    userId: string,
    nuevasPreferencias: Partial<PreferenciasPasajero>
  ): Promise<PreferenciasPasajero> {
    const perfilActual = cachePerfilPasajero.get(userId);
    const preferenciasCombinadas: PreferenciasPasajero = {
      ...(perfilActual?.preferencias || {}),
      ...nuevasPreferencias,
    };

    const { error } = await supabase
      .from("pasajeros_perfil")
      .upsert({
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

  /**
   * Guarda una nueva dirección frecuente o edita una existente
   */
  async guardarDireccion(userId: string, direccion: DireccionGuardada): Promise<DireccionGuardada[]> {
    const perfilActual = cachePerfilPasajero.get(userId);
    const direccionesActuales = perfilActual?.preferencias.direcciones || [];

    const index = direccionesActuales.findIndex((d) => d.id === direccion.id);
    let listaActualizada: DireccionGuardada[];

    if (index >= 0) {
      listaActualizada = [...direccionesActuales];
      listaActualizada[index] = direccion;
    } else {
      listaActualizada = [...direccionesActuales, direccion];
    }

    await this.guardarPreferencias(userId, { direcciones: listaActualizada });
    return listaActualizada;
  },

  /**
   * Elimina una dirección guardada
   */
  async eliminarDireccion(userId: string, direccionId: string): Promise<DireccionGuardada[]> {
    const perfilActual = cachePerfilPasajero.get(userId);
    const direccionesActuales = perfilActual?.preferencias.direcciones || [];
    const listaActualizada = direccionesActuales.filter((d) => d.id !== direccionId);

    await this.guardarPreferencias(userId, { direcciones: listaActualizada });
    return listaActualizada;
  },
};
