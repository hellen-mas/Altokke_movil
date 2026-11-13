import type { User } from "@supabase/supabase-js";

export interface DatosUsuarioExtraidos {
  id: string;
  correo: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  primerNombre: string;
  telefono: string;
  dni: string;
  fechaNacimiento: string;
  fotoUrl: string | null;
  rol: string;
}

/**
 * Normaliza y extrae de forma unificada los metadatos de sesión (Supabase Auth)
 * para usuarios con rol pasajero o conductor en Altokke.
 */
export function extraerDatosUsuario(
  user: User | null,
  fallbackRol: "Conductor" | "Pasajero" = "Pasajero"
): DatosUsuarioExtraidos {
  const meta = user?.user_metadata || {};

  const nombreRaw = (
    meta.nombre ||
    meta.full_name?.split(" ")[0] ||
    fallbackRol
  ).trim();

  const apellidosRaw = (meta.apellidos || "").trim();

  const nombreCompleto =
    apellidosRaw.length > 0
      ? `${nombreRaw} ${apellidosRaw}`.trim()
      : nombreRaw || user?.email?.split("@")[0] || fallbackRol;

  const primerNombre = nombreRaw.split(" ")[0] || fallbackRol;

  const telefono = user?.phone || meta.telefono || "";

  const fotoUrl =
    meta.avatar_url ||
    meta.foto_url ||
    meta.picture ||
    null;

  const dni = meta.dni || "";
  const fechaNacimiento =
    meta.fechaNacimiento ||
    meta.fecha_nacimiento ||
    "";

  const rol = (meta.rol as string) || fallbackRol.toLowerCase();

  return {
    id: user?.id || "",
    correo: user?.email || "",
    nombre: nombreRaw,
    apellidos: apellidosRaw,
    nombreCompleto,
    primerNombre,
    telefono,
    dni,
    fechaNacimiento,
    fotoUrl,
    rol,
  };
}
