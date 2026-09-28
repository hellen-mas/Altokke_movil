import { Stack, Redirect } from "expo-router";
import { ViajeProvider } from "@/context/ViajeContext";
import { useAuth } from "@/context/AuthContext";

export default function PasajeroLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

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
