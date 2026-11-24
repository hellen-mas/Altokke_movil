
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { obtenerEstadoConductor } from "@/features/conductores/services/conductorService";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const {
    isAuthenticated,
    userRole,
    userId,
    isLoading,
  } = useAuth();

  const [estadoConductor, setEstadoConductor] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && userRole === "conductor" && userId) {
      let activo = true;
      obtenerEstadoConductor(userId)
        .then((estado) => {
          if (activo) setEstadoConductor(estado);
        })
        .catch(() => {
          if (activo) setEstadoConductor("pendiente");
        });
      return () => {
        activo = false;
      };
    }
  }, [isAuthenticated, userRole, userId]);

  const esperandoEstadoConductor =
    isAuthenticated && userRole === "conductor" && Boolean(userId) && estadoConductor === null;

  if (isLoading || esperandoEstadoConductor) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1A8A56" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/bienvenida" />;
  }

  if (userRole === "conductor") {
    if (estadoConductor === "aprobado") {
      return <Redirect href="/conductor/inicio" />;
    }
    return (
      <Redirect href="/(auth)/estado-solicitud" />
    );
  }

  if (userRole === "pasajero") {
    return <Redirect href="/mapa" />;
  }

  return <Redirect href="/(auth)/bienvenida" />;
}
