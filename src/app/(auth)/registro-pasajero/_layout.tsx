import { RegistroPasajeroProvider } from "@/features/pasajeros/context/RegistroPasajeroContext";
import { Stack } from "expo-router";

export default function RegistroPasajeroLayout() {
  return (
    // Uso el provider para compartir los datos de registro entre pantallas
    <RegistroPasajeroProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistroPasajeroProvider>
  );
}
