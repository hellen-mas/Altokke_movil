import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { paletaColores } from "@/paletaColores";
import {
  CONDUCTOR_EJEMPLO,
  RESUMEN_GANANCIAS,
} from "@/constants/conductor";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";

export default function InicioConductorScreen() {
  return (
    <View style={styles.safeArea}>

    <CabeceraConductor
      titulo={`Hola, ${CONDUCTOR_EJEMPLO.nombre.split(" ")[0]}`}
      subtitulo="Conductor"
      mostrarMarca
      mostrarAtras={false}
      compacta
    />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* RESUMEN */}
        <View style={styles.resumenGrid}>
          <ResumenCard
            icono="car-outline"
            valor={String(RESUMEN_GANANCIAS.viajesCompletadosHoy)}
            etiqueta="Viajes hoy"
          />

          <ResumenCard
            icono="wallet-outline"
            valor={`S/ ${RESUMEN_GANANCIAS.totalHoy.toFixed(2)}`}
            etiqueta="Ganancias hoy"
          />

          <ResumenCard
            icono="star-outline"
            valor={String(CONDUCTOR_EJEMPLO.calificacion)}
            etiqueta="Calificación"
          />

          <ResumenCard
            icono="time-outline"
            valor="6 h 20 min"
            etiqueta="Tiempo en línea"
          />
        </View>

        {/* ACCESOS RÁPIDOS */}
        <Text style={styles.seccionTitulo}>Accesos rápidos</Text>

        <View style={styles.accionesRapidas}>
          <AccesoRapido
            icono="wallet-outline"
            texto="Ganancias"
            onPress={() => router.push("/ganancias" as any)}
          />

          <AccesoRapido
            icono="receipt-outline"
            texto="Solicitudes"
            onPress={() => router.push("/solicitudes" as any)}
          />

          <AccesoRapido
            icono="car-sport-outline"
            texto="Vehículo"
            onPress={() => router.push("/cuenta/vehiculo" as any)}
          />

          <AccesoRapido
            icono="person-outline"
            texto="Cuenta"
            onPress={() => router.push("/cuenta" as any)}
          />
        </View>

        {/* SEGURIDAD */}
        <Pressable style={styles.infoCard}>
          <View style={styles.infoIcono}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={paletaColores.verde}
            />
          </View>

          <View style={styles.infoTextos}>
            <Text style={styles.infoTitulo}>Conduce seguro</Text>

            <Text style={styles.infoDescripcion}>
              Sigue nuestras recomendaciones de seguridad antes de aceptar un
              viaje.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={paletaColores.textoSecundarioClaro}
          />
        </Pressable>

        {/* ESTADO */}
        <Text style={styles.seccionTitulo}>Estado actual</Text>

        <View style={styles.estadoCard}>
          <View style={styles.estadoIconoGrande}>
            <Ionicons
              name="car-sport-outline"
              size={28}
              color={paletaColores.verde}
            />
          </View>

          <View style={styles.estadoTextoContainer}>
            <Text style={styles.estadoTitulo}>Estás en línea</Text>

            <Text style={styles.estadoDescripcion}>
              Puedes recibir nuevas solicitudes de viaje cerca de tu ubicación.
            </Text>
          </View>
        </View>

        {/* SOLICITUD */}
        <Pressable
          style={styles.solicitudCard}
          onPress={() => router.push("/solicitudes" as any)}
        >
          <View style={styles.solicitudIcono}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={paletaColores.verde}
            />
          </View>

          <View style={styles.solicitudContenido}>
            <Text style={styles.solicitudTitulo}>
              Esperando solicitudes
            </Text>

            <Text style={styles.solicitudDescripcion}>
              Te avisaremos cuando haya un pasajero cerca.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={paletaColores.textoSecundarioClaro}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ResumenCard({
  icono,
  valor,
  etiqueta,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  valor: string;
  etiqueta: string;
}) {
  return (
    <View style={styles.resumenCard}>
      <View style={styles.resumenIcono}>
        <Ionicons
          name={icono}
          size={19}
          color={paletaColores.verde}
        />
      </View>

      <Text style={styles.resumenValor}>{valor}</Text>
      <Text style={styles.resumenLabel}>{etiqueta}</Text>
    </View>
  );
}

function AccesoRapido({
  icono,
  texto,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.accesoItem} onPress={onPress}>
      <View style={styles.accesoIcono}>
        <Ionicons
          name={icono}
          size={21}
          color={paletaColores.verde}
        />
      </View>

      <Text style={styles.accesoTexto}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
    borderWidth: 1,
    borderColor: "#CFECDD",
  },

  avatarTexto: {
    fontSize: 15,
    fontWeight: "800",
    color: paletaColores.verde,
  },

  saludo: {
    fontSize: 20,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  subtitulo: {
    marginTop: 2,
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
  },

  estadoOnline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E8F7F0",
  },

  puntoOnline: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: paletaColores.verde,
  },

  estadoOnlineTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.verde,
  },

  resumenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  resumenCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  resumenIcono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
    marginBottom: 12,
  },

  resumenValor: {
    fontSize: 20,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  resumenLabel: {
    marginTop: 4,
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: paletaColores.textoClaro,
    marginBottom: 12,
  },

  accionesRapidas: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  accesoItem: {
    width: "23%",
    alignItems: "center",
    gap: 8,
  },

  accesoIcono: {
    width: 54,
    height: 54,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  accesoTexto: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    marginBottom: 24,
  },

  infoIcono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
  },

  infoTextos: {
    flex: 1,
  },

  infoTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  infoDescripcion: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: paletaColores.textoSecundarioClaro,
  },

  estadoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    marginBottom: 14,
  },

  estadoIconoGrande: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
  },

  estadoTextoContainer: {
    flex: 1,
  },

  estadoTitulo: {
    fontSize: 15,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  estadoDescripcion: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: paletaColores.textoSecundarioClaro,
  },

  solicitudCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#EAF8F1",
    borderWidth: 1,
    borderColor: "#CFECDD",
  },

  solicitudIcono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
  },

  solicitudContenido: {
    flex: 1,
  },

  solicitudTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  solicitudDescripcion: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: paletaColores.textoSecundarioClaro,
  },
});