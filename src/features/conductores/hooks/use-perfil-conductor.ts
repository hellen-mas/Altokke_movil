import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import {
  conductorService,
  type DatosVehiculo,
  type PerfilConductor,
} from "@/features/conductores/services/conductorService";
import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type DatosPerfil = Parameters<typeof conductorService.actualizarPerfilConductor>[1];

const SIN_DATO = "—";

// La clave incluye el userId: cada cuenta tiene su propia entrada en la caché.
export const clavePerfilConductor = (userId: string | null) =>
  ["perfil-conductor", userId] as const;

// Perfil provisional mientras llega el de Supabase: solo datos reales de la sesión.
// Lo que todavía no se conoce queda como "—" o pendiente, nunca inventado.
function crearPerfilInicial(userId: string | null, user: User | null): PerfilConductor {
  const meta = user?.user_metadata || {};
  const nombre = (meta.nombre || "").trim();
  const apellidos = (meta.apellidos || "").trim();
  const nombreCompleto =
    `${nombre} ${apellidos}`.trim() || user?.email?.split("@")[0] || "Conductor";

  return {
    id: userId || "",
    nombre: nombreCompleto,
    apellidos,
    nombreCompleto,
    correo: user?.email || "",
    telefono: user?.phone || meta.telefono || "",
    dni: meta.dni || "",
    fechaNacimiento: meta.fechaNacimiento || "No especificada",
    ciudad: "Bagua, Amazonas",
    foto: meta.avatar_url || meta.foto_url || null,
    calificacion: 5.0,
    viajes: 0,
    estado: "En verificación",
    enLinea: false,
    saldoBilletera: 0,
    vehiculo: {
      placa: SIN_DATO,
      marca: SIN_DATO,
      modelo: "",
      anio: 0,
      color: SIN_DATO,
      capacidad: 0,
    },
    contactoEmergencia: { nombre: SIN_DATO, parentesco: SIN_DATO, telefono: "" },
    documentos: {
      dni: { estado: "PENDIENTE" },
      licencia: { estado: "PENDIENTE" },
      soat: { estado: "PENDIENTE" },
      tarjetaPropiedad: { estado: "PENDIENTE" },
      antecedentesPenales: { estado: "PENDIENTE" },
    },
    seguridad: {
      identidadVerificada: false,
      contactoEmergenciaConfigurado: false,
      compartirViaje: false,
    },
  };
}

export function usePerfilConductor() {
  const { user, userId } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = clavePerfilConductor(userId);

  const { data, error, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => conductorService.obtenerPerfilConductor(userId!),
    enabled: !!userId,
  });

  const perfil: PerfilConductor = data ?? crearPerfilInicial(userId, user);

  // Tras guardar, el perfil queda "viejo" y TanStack lo vuelve a pedir.
  const invalidarPerfil = () => queryClient.invalidateQueries({ queryKey });

  const mutacionPerfil = useMutation({
    mutationFn: (datos: DatosPerfil) => {
      if (!userId) throw new Error("No hay sesión activa");
      return conductorService.actualizarPerfilConductor(userId, datos);
    },
    onSuccess: invalidarPerfil,
  });

  const mutacionVehiculo = useMutation({
    mutationFn: (datos: DatosVehiculo) => {
      if (!userId) throw new Error("No hay sesión activa");
      return conductorService.registrarVehiculo(userId, datos);
    },
    onSuccess: invalidarPerfil,
  });

  return {
    perfil,
    cargando: isFetching,
    error,
    recargar: refetch,
    actualizarPerfil: mutacionPerfil.mutateAsync,
    actualizarVehiculo: mutacionVehiculo.mutateAsync,
  };
}