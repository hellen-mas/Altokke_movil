import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { pasajeroService } from "@/features/pasajeros/services/pasajeroService";

function formatearPrimerNombre(nombreCompleto: string) {
  const primero = nombreCompleto.trim().split(" ")[0];

  if (!primero) return "";

  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
}

export function useNombrePasajero(): string {
  const { user, userId } = useAuth();

  if (!userId || !user) return "";

  const perfilCache = pasajeroService.obtenerPerfilEnCache(userId);

  const nombreCompleto = 
    perfilCache?.primerNombre ||
    user.user_metadata?.nombre ||
    user.user_metadata?.full_name ||
    "";

  return formatearPrimerNombre(nombreCompleto);
}
