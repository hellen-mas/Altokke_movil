import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import {
  useTemaConductor,
  type ColoresConductor,
} from "@/features/conductores/theme/temaConductor";
import { TarjetaSolicitudViaje } from "@/features/viajes/components/TarjetaSolicitudViaje";
import { useSolicitudesConductor } from "@/features/viajes/hooks/use-solicitudes-conductor";

/** Lista en vivo de solicitudes cercanas para el conductor */
export default function SolicitudesConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  // Navegador de las pestañas del conductor (evita el choque con /viaje-activo del pasajero)
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const {
    solicitudes,
    cargando,
    error,
    aceptandoId,
    recargar,
    aceptarSolicitud,
    rechazarSolicitud,
  } = useSolicitudesConductor();

  // Estado propio del "jalar para refrescar" (no confundir con la carga inicial)
  const [refrescando, setRefrescando] = useState(false);

  const alRefrescar = async () => {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  };

  const alAceptar = async (viajeId: string) => {
    const ok = await aceptarSolicitud(viajeId);
    // Si otro conductor la ganó, el hook ya dejó el mensaje en "error"
    if (ok) {
      navigation.navigate("viaje-activo", { viajeId });
    }
  };

  return (
    <View style={styles.pantalla}>
      <CabeceraConductor
        titulo="Solicitudes"
        subtitulo="Cerca de ti"
        mostrarMarca
        mostrarAtras={false}
        compacta
      />

      {/* Aviso de error: carga fallida o carrera tomada por otro conductor */}
      {error && (
        <View style={styles.aviso}>
          <Ionicons name="alert-circle" size={18} color={c.error} />
          <Text style={styles.avisoTexto}>{error}</Text>
        </View>
      )}

      {cargando ? (
        // ESTADO 1: cargando por primera vez
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={c.primario} />
          <Text style={styles.centroTexto}>Buscando solicitudes cercanas...</Text>
        </View>
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaSolicitudViaje
              solicitud={item}
              onAceptar={alAceptar}
              onRechazar={rechazarSolicitud}
              aceptando={aceptandoId === item.id}
            />
          )}
          contentContainerStyle={[
            styles.lista,
            solicitudes.length === 0 && styles.listaVacia,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={alRefrescar}
              colors={[c.primario]}
              tintColor={c.primario}
            />
          }
          // ESTADO 2: no hay solicitudes
          ListEmptyComponent={
            <View style={styles.centro}>
              <View style={styles.iconoVacio}>
                <Ionicons name="time-outline" size={40} color={c.primario} />
              </View>
              <Text style={styles.vacioTitulo}>Sin solicitudes por ahora</Text>
              <Text style={styles.centroTexto}>
                Te avisaremos cuando un pasajero cercano pida un viaje.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    lista: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30 },
    listaVacia: { flexGrow: 1, justifyContent: "center" },
    aviso: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 18,
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.errorSuave,
    },
    avisoTexto: { flex: 1, fontSize: 12, fontWeight: "600", color: c.error },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    centroTexto: {
      marginTop: 10,
      maxWidth: 280,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      color: c.textoSec,
    },
    
    iconoVacio: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarioSuave,
      marginBottom: 14,
    },
    vacioTitulo: { fontSize: 18, fontWeight: "800", color: c.texto },
  });

