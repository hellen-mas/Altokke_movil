import { Redirect } from "expo-router";

export default function Index() {
  const isAuthenticated = false; // Simulación de autenticación

  if (isAuthenticated) {
    return <Redirect href={"/mapa" as any} />;
  }

  return <Redirect href={"/(auth)/bienvenida" as any} />;
}
