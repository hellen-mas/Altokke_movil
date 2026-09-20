import { Stack } from "expo-router";
import { ViajeProvider } from "@/context/ViajeContext";

export default function PasajeroLayout() {
  return (
    <ViajeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ViajeProvider>
  );
}
