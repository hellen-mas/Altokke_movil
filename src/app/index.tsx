import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { isAuthenticated, userRole } = useAuth();

  if (isAuthenticated) {
    if (userRole === "conductor") {
      return <Redirect href={"/inicio" as any} />;
    }
    return <Redirect href={"/mapa" as any} />;
  }

  // Si no hay sesión, lo mandamos a la pantalla de bienvenida
  return <Redirect href={"/(auth)/bienvenida" as any} />;
}
