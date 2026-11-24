import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useTemaConductor } from "@/features/conductores/theme/temaConductor";
import { crearEstilos } from "./solicitudes.styles";
import {
  useSolicitudesConductor,
} from "@/features/viajes/hooks/use-solicitudes-conductor";
import { TarjetaSolicitudViaje } from "@/features/viajes/components/TarjetaSolicitudViaje";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SolicitudesConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const {
    solicitudes,
    cargando,
    error,
    aceptarSolicitud,
    rechazarSolicitud,
    aceptandoId,
    recargar,
  } = useSolicitudesConductor();

  const handleAceptar = async (viajeId: string) => {
    try {
      const ok = await aceptarSolicitud(viajeId);
      if (ok) {
        router.push("/conductor/viaje-activo");
      }
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "No se pudo aceptar la solicitud.";
      Alert.alert("Aviso", mensaje);
    }
  };

  // Conexión con componente oficial TarjetaSolicitudViaje (soporte para contraofertas y aceptación real)
  const tarjetasSolicitud = solicitudes.map((solicitud) => (
    <TarjetaSolicitudViaje
      key={solicitud.id}
      solicitud={solicitud}
      onAceptar={handleAceptar}
      onRechazar={rechazarSolicitud}
      aceptando={aceptandoId === solicitud.id}
    />
  ));

  return (
    <View style={styles.safeArea}>
      <CabeceraConductor
        titulo="Solicitudes"
        subtitulo="En tiempo real"
        mostrarMarca
        mostrarAtras={false}
        compacta
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cargando ? (
          <View style={styles.centroVacio}>
            <ActivityIndicator size="large" color={c.primario} />
            <Text style={styles.textoCargando}>
              Buscando solicitudes cercanas...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centroVacio}>
            <Ionicons name="alert-circle-outline" size={48} color={c.error} />
            <Text style={styles.errorTitulo}>Problema de conexión</Text>
            <Text style={styles.errorDescripcion}>{error}</Text>
            <Pressable
              style={styles.botonReintentar}
              onPress={() => void recargar()}
            >
              <Text style={styles.botonReintentarTexto}>Actualizar</Text>
            </Pressable>
          </View>
        ) : solicitudes.length === 0 ? (
          <View style={styles.centroVacio}>
            <View style={styles.radarCirculo}>
              <Ionicons name="radio" size={42} color={c.primario} />
            </View>
            <Text style={styles.vacioTitulo}>Sin solicitudes pendientes</Text>
            <Text style={styles.vacioDescripcion}>
              Te avisaremos en cuanto un pasajero solicite un mototaxi cerca de
              tu ubicación.
            </Text>
            <Pressable
              style={styles.botonActualizar}
              onPress={() => void recargar()}
            >
              <Ionicons name="refresh-outline" size={18} color={c.primario} />
              <Text style={styles.botonActualizarTexto}>Comprobar ahora</Text>
            </Pressable>
          </View>
        ) : (
          tarjetasSolicitud
        )}
      </ScrollView>
    </View>
  );
}
