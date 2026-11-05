import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import {
  pasajeroService,
  type PerfilPasajero,
  type PreferenciasPasajero,
} from "@/features/pasajeros/services/pasajeroService";
import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

type DatosPersonales = Parameters<typeof pasajeroService.actualizarDatosPersonales>[1];

// La clave incluye el userId: cada cuenta tiene su propia entrada en la caché.
export const clavePerfilPasajero = (userId: string | null) =>
  ["perfil-pasajero", userId] as const;

// Perfil provisional con los datos de la sesión, mientras llega el de Supabase.
function crearPerfilInicial(userId: string, user: User | null): PerfilPasajero {
  const metadata = user?.user_metadata;

  const nombre = (metadata?.nombre || metadata?.full_name?.split(" ")[0] || "Pasajero").trim();
  const apellidos = (metadata?.apellidos || "").trim();

  return {
    id: userId,
    nombre,
    apellidos,
    nombreCompleto: apellidos ? `${nombre} ${apellidos}` : nombre,
    primerNombre: nombre.split(" ")[0],
    correo: user?.email || "",
    telefono: metadata?.telefono || "",
    fotoUrl: metadata?.avatar_url || metadata?.picture || null,
    calificacion: 5.0,
    viajesCount: 0,
    dni: metadata?.dni || "Sin registrar",
    fechaNacimiento: metadata?.fecha_nacimiento || "Sin registrar",
    genero: "Sin registrar",
    preferencias: {},
  };
}

export function usePerfilPasajero() {
  const { userId, user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = clavePerfilPasajero(userId);

  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => pasajeroService.obtenerPerfil(userId!, user?.user_metadata),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const perfil: PerfilPasajero | null = userId
    ? data ?? crearPerfilInicial(userId, user)
    : null;

  const cargando = !!userId && isPending && isFetching;

  const recargar = useCallback(async () => {
    if (!userId) return;

    const resultado = await refetch();

    if (resultado.error) {
      console.warn("Aviso al recargar perfil de pasajero:", resultado.error);
    }
  }, [userId, refetch]);

  const mutacionDatos = useMutation({
    mutationFn: (datos: DatosPersonales) => {
      if (!userId) throw new Error("No hay sesión activa");
      return pasajeroService.actualizarDatosPersonales(userId, datos);
    },
    // Tras guardar, el perfil queda "viejo" y TanStack lo vuelve a pedir a Supabase.
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const mutacionPreferencias = useMutation({
    mutationFn: (nuevas: Partial<PreferenciasPasajero>) => {
      if (!userId) throw new Error("No hay sesión activa");
      return pasajeroService.guardarPreferencias(userId, nuevas);
    },
    // Actualización controlada: ya sabemos cómo quedaron las preferencias,
    // así que se escriben en la caché sin volver a consultar.
    onSuccess: (prefs) => {
      queryClient.setQueryData<PerfilPasajero>(queryKey, (actual) =>
        actual ? { ...actual, preferencias: prefs } : actual
      );
    },
  });

  return {
    perfil,
    cargando,
    error,
    guardando: mutacionDatos.isPending || mutacionPreferencias.isPending,
    recargar,
    actualizarPerfil: mutacionDatos.mutateAsync,
    guardarPreferencias: mutacionPreferencias.mutateAsync,
  };
}