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
  modoSimple?: boolean;
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

function formatearPrimerNombre(nombre: string): string {
  if (!nombre) return "";
  const primer = nombre.trim().split(" ")[0];
  return primer ? primer.charAt(0).toUpperCase() + primer.slice(1).toLowerCase() : "";
}

// Lee las preferencias guardadas en Supabase. Se usa antes de combinarlas
// para no pisar datos con una copia vieja en memoria.
async function obtenerPreferenciasActuales(userId: string): Promise<PreferenciasPasajero> {
  const { data, error } = await supabase
    .from("pasajeros_perfil")
    .select("preferencias")
    .eq("usuario_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.preferencias as PreferenciasPasajero) || {};
}

export const pasajeroService = {
  async obtenerPerfil(userId: string, metadataUsuario?: any): Promise<PerfilPasajero> {
    if (!userId) throw new Error("Se requiere el ID de usuario para obtener su perfil");

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

    return {
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
  ): Promise<void> {
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

    const nuevasPreferencias: Partial<PreferenciasPasajero> = {};
    if (datos.dni !== undefined) nuevasPreferencias.dni = datos.dni.trim();
    if (datos.fechaNacimiento !== undefined) nuevasPreferencias.fechaNacimiento = datos.fechaNacimiento;
    if (datos.genero !== undefined) nuevasPreferencias.genero = datos.genero;
    if (datos.contactoEmergencia !== undefined) nuevasPreferencias.contactoEmergencia = datos.contactoEmergencia;

    if (Object.keys(nuevasPreferencias).length > 0) {
      await this.guardarPreferencias(userId, nuevasPreferencias);
    }

    // Solo viajan los campos que cambiaron; los que quedan en undefined no se tocan.
    supabase.auth.updateUser({
      data: {
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        telefono: datos.telefono,
        dni: datos.dni,
      },
    }).catch((err) => console.warn("Aviso al sincronizar auth metadata:", err));
  },

  /**
   * Actualiza las preferencias del pasajero en pasajeros_perfil.
   * Requiere que el registro del perfil ya exista.
   * La operación está restringida al usuario autenticado mediante RLS.
   */
  async guardarPreferencias(
    userId: string,
    nuevasPreferencias: Partial<PreferenciasPasajero>
  ): Promise<PreferenciasPasajero> {
    const actuales = await obtenerPreferenciasActuales(userId);
    const preferenciasCombinadas: PreferenciasPasajero = {
      ...actuales,
      ...nuevasPreferencias,
    };

    const { data, error } = await supabase
      .from("pasajeros_perfil")
      .update({
        preferencias: preferenciasCombinadas,
      })
      .eq("usuario_id", userId)
      .select("usuario_id")
      .maybeSingle();

    if (error) {
      console.error("Error al actualizar preferencias:", error);
      throw error;
    }

    if (!data) {
      throw new Error(
        "No se encontró un perfil de pasajero que puedas actualizar."
      );
    }

    return preferenciasCombinadas;
  },

  async guardarDireccion(userId: string, direccion: DireccionGuardada): Promise<DireccionGuardada[]> {
    const actuales = await obtenerPreferenciasActuales(userId);
    const direcciones = [...(actuales.direcciones || [])];
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
    const actuales = await obtenerPreferenciasActuales(userId);
    const direcciones = (actuales.direcciones || []).filter((d) => d.id !== direccionId);
    await this.guardarPreferencias(userId, { direcciones });
    return direcciones;
  },
};