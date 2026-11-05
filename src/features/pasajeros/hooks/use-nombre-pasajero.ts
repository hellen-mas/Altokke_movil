import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { clavePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import type { PerfilPasajero } from "@/features/pasajeros/services/pasajeroService";
import { useQueryClient } from "@tanstack/react-query";

function formatearPrimerNombre(nombreCompleto: string) {
  const primero = nombreCompleto.trim().split(" ")[0];

  if (!primero) return "";

  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
}

export function useNombrePasajero(): string {
  const { user, userId } = useAuth();
  const queryClient = useQueryClient();

  if (!userId || !user) return "";

  const perfilCache = queryClient.getQueryData<PerfilPasajero>(clavePerfilPasajero(userId));
  const nombreCompleto = 
    perfilCache?.primerNombre ||
    user.user_metadata?.nombre ||
    user.user_metadata?.full_name ||
    "";

  return formatearPrimerNombre(nombreCompleto);
}
