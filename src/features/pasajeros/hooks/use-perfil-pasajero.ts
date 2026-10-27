import { useAuth } from "@/features/autenticacion/context/AuthContext";
import {
  pasajeroService,
  type PerfilPasajero,
  type PreferenciasPasajero,
} from "@/features/pasajeros/services/pasajeroService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

function crearPerfilInicial(userId: string | null, user: any): PerfilPasajero | null {
  if (!userId) return null;

  const cache = pasajeroService.obtenerPerfilEnCache(userId);
  if (cache) return cache;

  const metadata = user?.user_metadata;

  const nombre = (metadata?.nombre || metadata?.full_name?.split(" ")[0] || "Pasajero").trim();
  const apellidos = (metadata?.apellidos || "").trim();
  const nombreCompleto = apellidos
    ? `${nombre} ${apellidos}`
    : nombre;

  return {
    id: userId,
    nombre,
    apellidos,
    nombreCompleto,
    primerNombre: nombre.split(" ")[0],
    correo: user?.email || "",
    telefono: metadata?.telefono || "",
    fotoUrl: metadata?.avatar_url || metadata?.picture || null,
    calificacion: 5.0,
    viajesCount: 0,
    dni: metadata?.dni || "Sin registrar",
    fechaNacimiento:
      metadata?.fecha_nacimiento || "Sin registrar",
    genero: "Sin registrar",
    preferencias: {},
  };
}

export function usePerfilPasajero() {
  const { userId, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["perfil-pasajero", userId] as const;

  const {
    data,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      pasajeroService.obtenerPerfil(
        userId!,
        user?.user_metadata
      ),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Evita mostrar datos de otro usuario.
  // Mientras carga, conserva el perfil inicial inmediato.
  const perfil: PerfilPasajero | null = userId
    ? data ?? crearPerfilInicial(userId, user)
    : null;

  const cargando = !!userId && isPending && isFetching;

  const recargar = useCallback(async () => {
    if (!userId) return;

    const resultado = await refetch();

    if (resultado.error) {
      console.warn(
        "Aviso al recargar perfil de pasajero:",
        resultado.error
      );
    }
  }, [userId, refetch]);

  const actualizarPerfil = useCallback(
    async (datos: Parameters<typeof pasajeroService.actualizarDatosPersonales>[1]) => {
      if (!userId) throw new Error("No hay sesión activa");
      const nuevo = await pasajeroService.actualizarDatosPersonales(userId, datos);
      queryClient.setQueryData(
        ["perfil-pasajero", userId],
        nuevo
      );

      return nuevo;
    },
    [userId, queryClient]
  );

  const guardarPreferencias = useCallback(
    async (nuevas: Partial<PreferenciasPasajero>) => {
      if (!userId) throw new Error("No hay sesión activa");
      const prefs = await pasajeroService.guardarPreferencias(userId, nuevas);
      queryClient.setQueryData<PerfilPasajero>(
        ["perfil-pasajero", userId],
        (actual) => {
          const base =
            actual ?? crearPerfilInicial(userId, user);

          if (!base) return undefined;

          return {
            ...base,
            preferencias: prefs,
          };
        }
      );

      return prefs;
    },
    [userId, user, queryClient]
  );

  return {
    perfil,
    cargando,
    recargar,
    actualizarPerfil,
    guardarPreferencias,
  };
}
