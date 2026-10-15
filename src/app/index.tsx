
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";

export default function Index() {
  const {
    isAuthenticated,
    userRole,
    isLoading,
  } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/bienvenida" />;
  }

  if (userRole === "conductor") {
    return (
      <Redirect href="/(auth)/estado-solicitud" />
    );
  }

  if (userRole === "pasajero") {
    return <Redirect href="/mapa" />;
  }

  return <Redirect href="/(auth)/bienvenida" />;
}
