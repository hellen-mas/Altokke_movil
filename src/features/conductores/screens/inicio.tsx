import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { paletaColores } from "@/shared/theme/paletaColores";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useEffect, useState } from "react";
import { conductorService } from "@/features/conductores/services/conductorService";

export default function InicioConductorScreen() {
  const { perfil } = usePerfilConductor();
  const [resumen, setResumen] = useState({
    viajesCompletadosHoy: 0,
    totalHoy: 0,
  });

  useEffect(() => {
    if (!perfil.id || perfil.id === "conductor-local") return;
    conductorService.obtenerResumenGanancias(perfil.id).then((r) => {
      setResumen({
        viajesCompletadosHoy: r.viajesCompletadosHoy,
        totalHoy: r.totalHoy,
      });
    }).catch(() => {});
  }, [perfil.id]);

  const primerNombre = perfil.nombre.split(" ")[0];

  return (
    <View style={styles.safeArea}>

    <CabeceraConductor
      titulo={`Hola, ${primerNombre}`}
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
            value={String(resumen.viajesCompletadosHoy)}
            etiqueta="Viajes hoy"
          />

          <ResumenCard
            icono="wallet-outline"
            value={`S/ ${resumen.totalHoy.toFixed(2)}`}
            etiqueta="Ganancias hoy"
          />

          <ResumenCard
            icono="star-outline"
            value={perfil.calificacion.toFixed(1)}
            etiqueta="Calificación"
          />

          <ResumenCard
            icono="time-outline"
            value="En línea"
            etiqueta="Estado"
          />
        </View>

        {/* ACCESOS RÁPIDOS */}
        <Text style={styles.seccionTitulo}>Accesos rápidos</Text>

        <View style={styles.accionesRapidas}>

          <AccesoRapido
            icono="wallet-outline"
            texto="Ganancias"
            onPress={() => router.push("/ganancias")}
          />

          <AccesoRapido
            icono="receipt-outline"
            texto="Solicitudes"
            onPress={() => router.push("/solicitudes")}
          />

          <AccesoRapido
            icono="car-sport-outline"
            texto="Vehículo"
            onPress={() => router.push("/cuenta/vehiculo")}
          />

          <AccesoRapido
            icono="person-outline"
            texto="Cuenta"
            onPress={() => router.push("/cuenta")}
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
          onPress={() => router.push("/solicitudes")}
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
  value,
  etiqueta,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  value: string;
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

      <Text style={styles.resumenValor}>{value}</Text>
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
