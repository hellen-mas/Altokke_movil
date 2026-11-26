import { authService } from "@/features/autenticacion/services/authService";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { AvisoInformativo, BotonPrincipal } from "@/shared/components/ui";
import { useAsyncLock } from "@/shared/hooks/useAsyncLock";
import { router, usePreventRemove } from "expo-router";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const consecuencias = "Perderás el acceso y no podrás seguir utilizando esta cuenta. Algunos registros históricos podrán conservarse por obligaciones legales y operativas.";

export default function EliminarCuentaConductor() {
  const { c } = useColoresConductor();
  const { bloqueado, ejecutarSeguro } = useAsyncLock();
  const permitirSalida = usePreventRemove(bloqueado);

  function confirmarEliminacion() {
    Alert.alert("Eliminar cuenta", `¿Deseas eliminar tu cuenta de Altokke? ${consecuencias}`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar cuenta",
        style: "destructive",
        onPress: () => void ejecutarSeguro(async () => {
          try {
            await authService.eliminarMiCuenta();
            // La redirección también queda bloqueada mientras ejecutarSeguro sigue en curso.
            permitirSalida();
            router.replace("/(auth)/bienvenida");
          } catch (error) {
            Alert.alert(
              "No se pudo eliminar la cuenta",
              error instanceof Error ? error.message : "Inténtalo nuevamente.",
            );
          }
        }),
      },
    ], { cancelable: true });
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.fondo }}>
      <CabeceraConductor titulo="Eliminar cuenta" mostrarAtras compacta />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <AvisoInformativo
          icono="alert-circle-outline"
          titulo="Antes de eliminar tu cuenta"
          texto={consecuencias}
        />
        <BotonPrincipal
          titulo={bloqueado ? "Eliminando cuenta" : "Eliminar cuenta"}
          onPress={confirmarEliminacion}
          cargando={bloqueado}
          estilo={bloqueado ? undefined : { backgroundColor: c.errorSuave }}
          estiloTexto={{ color: c.error }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
