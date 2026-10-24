import { Stack, Redirect } from "expo-router";
import { ViajeProvider } from "@/features/viajes/context/ViajeContext";
import { NotificacionesProvider } from "@/features/notificaciones/context/NotificacionesContext";
import { useAuth } from "@/features/autenticacion/context/AuthContext";

export default function PasajeroLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ViajeProvider>
      <NotificacionesProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </NotificacionesProvider>
    </ViajeProvider>
  );
}
