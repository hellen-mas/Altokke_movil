import { Stack } from "expo-router";
import { RegistroPasajeroProvider } from "@/context/RegistroPasajeroContext";

export default function RegistroPasajeroLayout() {
  return (
    <RegistroPasajeroProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistroPasajeroProvider>
  );
}
