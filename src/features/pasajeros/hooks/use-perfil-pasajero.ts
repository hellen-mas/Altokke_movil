import { useAuth } from "@/features/autenticacion/context/AuthContext";
import {
  pasajeroService,
  PerfilPasajero,
  PreferenciasPasajero,
} from "@/features/pasajeros/services/pasajeroService";
import { useCallback, useEffect, useState } from "react";

function crearPerfilInicial(userId: string | null, user: any): PerfilPasajero | null {
  if (!userId) return null;

  const cache = pasajeroService.obtenerPerfilEnCache(userId);
  if (cache) return cache;

  const metadata = user?.user_metadata;
  const nombre = (metadata?.nombre || metadata?.full_name?.split(" ")[0] || "Pasajero").trim();
  const apellidos = (metadata?.apellidos || "").trim();
  const nombreCompleto = apellidos ? `${nombre} ${apellidos}` : nombre;
  const primerNombre = nombre.split(" ")[0];

  return {
    id: userId,
    nombre,
    apellidos,
    nombreCompleto,
    primerNombre,
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
  const [perfil, setPerfil] = useState<PerfilPasajero | null>(() =>
    crearPerfilInicial(userId, user)
  );
  const [cargando, setCargando] = useState(!pasajeroService.obtenerPerfilEnCache(userId || ""));

  const recargar = useCallback(async () => {
    if (!userId) return;
    try {
      setCargando(true);
      const datos = await pasajeroService.obtenerPerfil(userId, user?.user_metadata);
      setPerfil(datos);
    } catch (err) {
      console.warn("Aviso al recargar perfil de pasajero:", err);
    } finally {
      setCargando(false);
    }
  }, [userId, user]);

  useEffect(() => {
    if (!userId) {
      setPerfil(null);
      return;
    }

    // Si no está en caché o cambió de usuario, inicializar con metadata inmediata
    if (!perfil || perfil.id !== userId) {
      const inicial = crearPerfilInicial(userId, user);
      if (inicial) setPerfil(inicial);
    }

    // Refrescar en segundo plano desde Supabase
    let montado = true;
    pasajeroService
      .obtenerPerfil(userId, user?.user_metadata)
      .then((datos) => {
        if (montado) {
          setPerfil(datos);
          setCargando(false);
        }
      })
      .catch(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, [userId, user]);

  const actualizarPerfil = useCallback(
    async (datos: Parameters<typeof pasajeroService.actualizarDatosPersonales>[1]) => {
      if (!userId) throw new Error("No hay sesión activa");
      const nuevo = await pasajeroService.actualizarDatosPersonales(userId, datos);
      setPerfil(nuevo);
      return nuevo;
    },
    [userId]
  );

  const guardarPreferencias = useCallback(
    async (nuevas: Partial<PreferenciasPasajero>) => {
      if (!userId) throw new Error("No hay sesión activa");
      const prefs = await pasajeroService.guardarPreferencias(userId, nuevas);
      setPerfil((actual) => (actual ? { ...actual, preferencias: prefs } : actual));
      return prefs;
    },
    [userId]
  );

  return {
    perfil,
    cargando,
    recargar,
    actualizarPerfil,
    guardarPreferencias,
  };
}
