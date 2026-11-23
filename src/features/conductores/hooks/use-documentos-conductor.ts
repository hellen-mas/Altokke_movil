import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import {
  documentosConductorService,
  type DocumentoConductor,
} from "@/features/conductores/services/documentosConductorService";
import { useMutation, useQuery } from "@tanstack/react-query";

export const claveDocumentosConductor = (userId: string | null) =>
  ["documentos-conductor", userId] as const;

export function useDocumentosConductor() {
    const { userId } = useAuth();

    // Consulta los documentos registrados del conductor.
    const {
        data,
        error,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: claveDocumentosConductor(userId),
        queryFn: () => {
        if (!userId) {
            throw new Error("No hay una sesión de conductor activa.");
        }

        return documentosConductorService.obtenerDocumentos(userId);
        },
        enabled: !!userId,
    });

    // Genera una URL firmada únicamente cuando se solicita abrir un documento.
    const mutacionUrl = useMutation({
        mutationFn: (ruta: string) => {
        if (!userId) {
            throw new Error("No hay una sesión de conductor activa.");
        }

        return documentosConductorService.obtenerUrlFirmada(
            userId,
            ruta
        );
        },
    });

    const documentos: DocumentoConductor[] = data ?? [];

    return {
        documentos,
        cargando: isLoading,
        error,
        recargar: refetch,
        obtenerUrlDocumento: mutacionUrl.mutateAsync,
        abriendoDocumento: mutacionUrl.isPending,
    };
}