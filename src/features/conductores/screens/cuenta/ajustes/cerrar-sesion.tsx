import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { AvisoInformativo, BotonPrincipal } from "@/shared/components/ui";
import { useAsyncLock } from "@/shared/hooks/useAsyncLock";
import { router } from "expo-router";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CerrarSesionConductor() {
  const { c } = useColoresConductor();
  const { logout } = useAuth();
  const { bloqueado, ejecutarSeguro } = useAsyncLock();

  function confirmarSalida() {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => void ejecutarSeguro(async () => {
          try {
            await logout();
            router.replace("/(auth)/login");
          } catch {
            Alert.alert("No se pudo cerrar sesión", "Inténtalo nuevamente.");
          }
        }),
      },
    ], { cancelable: true });
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.fondo }}>
      <CabeceraConductor titulo="Cerrar sesión" mostrarAtras compacta />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <AvisoInformativo
          icono="log-out-outline"
          titulo="Salir de este dispositivo"
          texto="Podrás volver a iniciar sesión con tu cuenta de conductor."
        />
        <BotonPrincipal titulo="Cerrar sesión" onPress={confirmarSalida} cargando={bloqueado} />
      </ScrollView>
    </SafeAreaView>
  );
}
