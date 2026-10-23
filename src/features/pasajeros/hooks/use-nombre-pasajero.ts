import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { pasajeroService } from "@/features/pasajeros/services/pasajeroService";
import { useEffect, useState } from "react";

function formatearPrimerNombre(nombreCompleto: string) {
  if (!nombreCompleto) return "";
  const primero = nombreCompleto.trim().split(" ")[0];
  if (!primero) return "";
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
}

/**
 * Primer nombre del pasajero que inició sesión.
 * Carga de forma instantánea y síncrona desde el contexto de sesión o caché,
 * garantizando cero parpadeos ni demoras perceptibles.
 */
export function useNombrePasajero() {
  const { user, userId } = useAuth();

  const [nombre, setNombre] = useState(() => {
    if (userId) {
      const perfilCache = pasajeroService.obtenerPerfilEnCache(userId);
      if (perfilCache?.primerNombre) return perfilCache.primerNombre;
    }
    const datos = user?.user_metadata;
    const nombreCompleto = datos?.nombre || datos?.full_name || "";
    return formatearPrimerNombre(nombreCompleto);
  });

  useEffect(() => {
    if (!user) {
      setNombre("");
      return;
    }

    if (userId) {
      const perfilCache = pasajeroService.obtenerPerfilEnCache(userId);
      if (perfilCache?.primerNombre) {
        setNombre(perfilCache.primerNombre);
        return;
      }
    }

    const datos = user.user_metadata;
    const nombreCompleto = datos?.nombre || datos?.full_name || "";
    if (nombreCompleto) {
      setNombre(formatearPrimerNombre(nombreCompleto));
    }
  }, [user, userId]);

  return nombre;
}
