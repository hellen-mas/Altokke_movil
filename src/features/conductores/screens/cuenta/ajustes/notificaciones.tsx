import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { DatoPersonal } from "@/features/conductores/components/DatoPersonal";
import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { AvisoInformativo, BotonPrincipal, ContenedorGrupoAjustes } from "@/shared/components/ui";
import { useAsyncLock } from "@/shared/hooks/useAsyncLock";
import { useQuery } from "@tanstack/react-query";
import {
  getPermissionsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  type NotificationPermissionsStatus,
} from "expo-notifications";
import { ActivityIndicator, Alert, Linking, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function describirPermiso(permiso: NotificationPermissionsStatus) {
  if (permiso.ios?.status === IosAuthorizationStatus.PROVISIONAL) return "Permitido de forma provisional";
  if (permiso.ios?.status === IosAuthorizationStatus.EPHEMERAL) return "Permitido temporalmente";
  if (permiso.status === "granted") return "Permitido";
  if (permiso.status === "denied") return "Denegado";
  return "Aún sin decidir";
}

function admiteSolicitud(permiso: NotificationPermissionsStatus) {
  if (!permiso.canAskAgain || permiso.status === "granted") return false;
  if (Platform.OS === "android") {
    // Android puede bloquear los avisos de la app aun con el permiso de ejecución concedido.
    return Platform.Version >= 33 && !permiso.granted;
  }
  return Platform.OS === "ios" && (
    permiso.ios?.status === IosAuthorizationStatus.NOT_DETERMINED ||
    permiso.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

async function abrirAjustes() {
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert("No se pudieron abrir los ajustes", "Abre los ajustes del dispositivo y busca Altokke.");
  }
}

export default function NotificacionesConductor() {
  const { c } = useColoresConductor();
  const { bloqueado: solicitando, ejecutarSeguro } = useAsyncLock();
  const esMovil = Platform.OS === "android" || Platform.OS === "ios";
  const permiso = useQuery({
    queryKey: ["permiso-notificaciones-dispositivo"],
    queryFn: getPermissionsAsync,
    enabled: esMovil,
    networkMode: "always",
    refetchOnMount: "always",
    // El layout raíz avisa a React Query cuando la app vuelve de los ajustes del sistema.
    refetchOnWindowFocus: "always",
    retry: false,
  });

  function solicitarPermiso() {
    if (!permiso.isSuccess || !admiteSolicitud(permiso.data)) return;
    void ejecutarSeguro(async () => {
      try {
        await requestPermissionsAsync();
      } catch {
        Alert.alert("No se pudo solicitar el permiso", "Inténtalo nuevamente o abre los ajustes del dispositivo.");
      } finally {
        await permiso.refetch();
      }
    });
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.fondo }}>
      <CabeceraConductor titulo="Notificaciones" mostrarAtras compacta />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {!esMovil && <AvisoInformativo icono="phone-portrait-outline" texto="Consulta este permiso desde Altokke en tu teléfono." />}
        {esMovil && permiso.isFetching && (
          <ActivityIndicator color={c.primario} accessibilityLabel="Consultando permiso de notificaciones" />
        )}
        {esMovil && !permiso.isFetching && permiso.isSuccess && (
          <ContenedorGrupoAjustes>
            <DatoPersonal
              icono="notifications-outline"
              titulo="Permiso de notificaciones"
              valor={describirPermiso(permiso.data)}
              ultimo
            />
          </ContenedorGrupoAjustes>
        )}
        {esMovil && !permiso.isFetching && permiso.isError && (
          <>
            <AvisoInformativo icono="alert-circle-outline" texto="No se pudo consultar el permiso de notificaciones." />
            <BotonPrincipal titulo="Reintentar consulta" onPress={() => void permiso.refetch()} />
          </>
        )}
        {permiso.isSuccess && !permiso.isFetching && admiteSolicitud(permiso.data) && (
          <BotonPrincipal titulo="Solicitar permiso" onPress={solicitarPermiso} cargando={solicitando} />
        )}
        {esMovil && <BotonPrincipal titulo="Abrir ajustes del dispositivo" onPress={abrirAjustes} disabled={solicitando} />}
      </ScrollView>
    </SafeAreaView>
  );
}
