import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useTemaConductor } from "@/features/conductores/theme/temaConductor";
import { crearEstilos } from "./solicitudes.styles";
import {
  useSolicitudesConductor,
  type SolicitudViajeItem,
} from "@/features/viajes/hooks/use-solicitudes-conductor";
import { formatearSoles } from "@/features/viajes/utils/viaje";
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
    aceptandoId,
    recargar,
  } = useSolicitudesConductor();

  const handleAceptar = async (solicitud: SolicitudViajeItem) => {
    try {
      const ok = await aceptarSolicitud(solicitud.id);
      if (ok) {
        router.push("/conductor/viaje-activo");
      }
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "No se pudo aceptar la solicitud.";
      Alert.alert("Aviso", mensaje);
    }
  };

  // Renderizado fuera del árbol ScrollView para cumplir regla RN anti-map directo
  const tarjetasSolicitud = solicitudes.map((solicitud) => {
    const esAceptando = aceptandoId === solicitud.id;

    return (
      <View key={solicitud.id} style={styles.solicitudCard}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeEnVivo}>
            <View style={styles.puntoVerde} />
            <Text style={styles.badgeEnVivoTexto}>SOLICITUD DISPONIBLE</Text>
          </View>
          <Text style={styles.tarifaMonto}>
            {formatearSoles(solicitud.tarifaEstimada)}
          </Text>
        </View>

        <View style={styles.rutasBloque}>
          <View style={styles.ubicacionFila}>
            <Ionicons name="radio-button-on" size={18} color={c.primario} />
            <View style={styles.ubicacionInfo}>
              <Text style={styles.ubicacionEtiqueta}>Punto de recojo</Text>
              <Text style={styles.ubicacionNombre} numberOfLines={2}>
                {solicitud.origenTexto}
              </Text>
            </View>
          </View>

          <View style={styles.lineaConexion} />

          <View style={styles.ubicacionFila}>
            <Ionicons name="location" size={18} color={c.error} />
            <View style={styles.ubicacionInfo}>
              <Text style={styles.ubicacionEtiqueta}>Destino</Text>
              <Text style={styles.ubicacionNombre} numberOfLines={2}>
                {solicitud.destinoTexto}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detallesFila}>
          <View style={styles.chipDetalle}>
            <Ionicons name="navigate-outline" size={15} color={c.textoSec} />
            <Text style={styles.chipTexto}>
              {solicitud.distanciaKm
                ? `${solicitud.distanciaKm.toFixed(1)} km`
                : "Urbano"}
            </Text>
          </View>

          <View style={styles.chipDetalle}>
            <Ionicons
              name={
                solicitud.metodoPago === "efectivo"
                  ? "cash-outline"
                  : "phone-portrait-outline"
              }
              size={15}
              color={c.textoSec}
            />
            <Text style={styles.chipTexto}>
              {solicitud.metodoPago === "efectivo"
                ? "Efectivo"
                : solicitud.metodoPago?.toUpperCase() || "Efectivo"}
            </Text>
          </View>

          {solicitud.pagaCon != null && solicitud.pagaCon > 0 && (
            <View style={[styles.chipDetalle, { backgroundColor: c.fondo }]}>
              <Text
                style={[
                  styles.chipTexto,
                  { color: c.primario, fontWeight: "700" },
                ]}
              >
                Paga con S/ {solicitud.pagaCon.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={[
            styles.botonAceptar,
            esAceptando && styles.botonDeshabilitado,
          ]}
          onPress={() => void handleAceptar(solicitud)}
          disabled={esAceptando}
          accessibilityRole="button"
        >
          {esAceptando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.botonAceptarTexto}>Aceptar este viaje</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>
    );
  });

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
