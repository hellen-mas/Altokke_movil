import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { billeteraService } from "../services/billeteraService";

export const claveBilletera = (conductorId: string | null) => 
    ["billetera-conductor", conductorId] as const;

export function useBilletera() {
    const { userId, userRole } = useAuth();

    const consulta = useQuery({
        queryKey: claveBilletera(userId),
        queryFn: () => {
            if (!userId) {
                throw new Error("No hay un conductor autenticado.");
            }

            return billeteraService.obtenerResumen(userId);
        },

        enabled: Boolean(userId) && userRole === "conductor",
        staleTime: 30_000,
    });

    return {
        saldo: consulta.data?.saldo ?? 0,
        movimientos: consulta.data?.movimientos ?? [],
        cargando: consulta.isLoading,
        actualizando: consulta.isFetching,
        error: consulta.error,
        refrescar: consulta.refetch,
    };
}