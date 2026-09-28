import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { isAuthenticated, userRole } = useAuth();

  if (isAuthenticated) {
    // Redirige dependiendo del rol
    if (userRole === "conductor") {
      return <Redirect href={"/inicio" as any} />;
    }
    return <Redirect href={"/mapa" as any} />;
  }

  return <Redirect href={"/(auth)/bienvenida" as any} />;
}
