import { Stack, Redirect } from "expo-router";
import { ViajeProvider } from "@/features/viajes/context/ViajeContext";
import { useSincronizarNotificaciones } from "@/features/notificaciones/hooks/useNotificaciones";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";

export default function PasajeroLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useSincronizarNotificaciones();

  if (isLoading) {
    return null;
  }
  
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
