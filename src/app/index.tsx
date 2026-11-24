import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { obtenerDestinoInicialConductor } from "@/features/conductores/services/estadoSolicitudService";

type DestinoConductor = 
  | "/(auth)/estado-solicitud"
  | "/conductor/inicio";

export default function Index() {
  const {
    isAuthenticated,
    userRole,
    isLoading,
    userId,
  } = useAuth();

  const [destinoConductor, setDestinoConductor] = useState<DestinoConductor | null>(null);
  
  useEffect(() => {
    if (isLoading || !isAuthenticated || userRole !== "conductor") {
      return;
    }

    let activo = true;

    const resolverDestino = async () => {
      if (!userId) {
        if (activo) setDestinoConductor("/(auth)/estado-solicitud");
        return;
      }

      try {
        const destino =
          await obtenerDestinoInicialConductor(userId);

        if (activo) {
          setDestinoConductor(destino);
        }
      } catch (error) {
        console.error(
          "Error al consultar el estado del conductor:",
          error
        );

        if (activo) {
          setDestinoConductor("/(auth)/estado-solicitud");
        }
      }
    };

    void resolverDestino();

    return () => {
      activo = false;
    };
  }, [isLoading, isAuthenticated, userRole, userId]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/bienvenida" />;
  }

  if (userRole === "conductor") {
    if (!destinoConductor) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#1A8A56" />
        </View>
      );
    }

    return <Redirect href={destinoConductor} />;
  }

  if (userRole === "pasajero") {
    return <Redirect href="/mapa" />;
  }

  return <Redirect href="/(auth)/bienvenida" />;
}
