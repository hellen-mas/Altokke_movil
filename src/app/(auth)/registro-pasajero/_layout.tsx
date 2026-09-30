import { RegistroPasajeroProvider } from "@/context/RegistroPasajeroContext";
import { Stack } from "expo-router";

export default function RegistroPasajeroLayout() {
  return (
    // Provider permite compartir la información del registro sin tener que pasar datos una por una
    <RegistroPasajeroProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistroPasajeroProvider>
  );
}
