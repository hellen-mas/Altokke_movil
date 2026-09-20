import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarraInferior } from "@/components/pasajero/BarraInferior";
import { MapaBase } from "@/components/pasajero/MapaBase";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  CENTRO_BAGUA,
  COLOR_CABECERA,
  CONDUCTORES_CERCANOS,
  USUARIO_EJEMPLO,
} from "@/constants/pasajero";
import { TipoServicio, useViaje } from "@/context/ViajeContext";
import { paletaColores } from "@/paletaColores";

const SERVICIOS: {
  id: TipoServicio;
  titulo: string;
  descripcion: string;
  icono: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "normal", titulo: "Normal", descripcion: "Económico y confiable", icono: "car-sport" },
  { id: "express", titulo: "Express", descripcion: "Llegas más rápido", icono: "flash" },
  { id: "reserva", titulo: "Reserva", descripcion: "Programa tu viaje", icono: "calendar-outline" },
];

const DESTINOS_FRECUENTES: {
  nombre: string;
  icono: keyof typeof Ionicons.glyphMap;
}[] = [
  { nombre: "Casa", icono: "home" },
  { nombre: "Trabajo", icono: "briefcase" },
  { nombre: "Universidad", icono: "school" },
];

export default function PantallaMapa() {
  const insets = useSafeAreaInsets();
  const { tipoServicio, setTipoServicio } = useViaje();

  const irADestino = () => {
    // router.push("/destino");
  };

  return (
    <View style={styles.pantalla}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {/* Cabecera */}
        <View style={[styles.cabecera, { paddingTop: insets.top + 12 }]}>
          <View style={styles.filaLogo}>
            <Image
              source={require("../../../assets/images/logo-altokke-v2.png")}
              style={styles.logoImagen}
              resizeMode="contain"
            />
            <Text style={styles.logoTexto}>Altokke</Text>

            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={paletaColores.textoSecundario} />
              <View style={styles.avatarEnLinea} />
            </View>
          </View>

          <Text style={styles.saludo}>Hola, {USUARIO_EJEMPLO.nombre} 👋</Text>
          <Text style={styles.subtitulo}>¿A dónde te llevamos hoy?</Text>
        </View>

        {/* Origen y destino */}
        <View style={styles.tarjetaRuta}>
          <View style={styles.filaOrigen}>
            <View style={styles.iconoOrigen}>
              <Ionicons name="radio-button-on" size={20} color={paletaColores.boton} />
            </View>

            <View style={styles.textoOrigen}>
              <Text style={styles.origenTitulo}>Tu ubicación actual</Text>
              <Text style={styles.origenDetalle}>Bagua, Amazonas</Text>
            </View>

            <View style={styles.botonIntercambio}>
              <Ionicons
                name="swap-vertical"
                size={18}
                color={paletaColores.textoSecundarioClaro}
              />
            </View>
          </View>

          <Pressable
            onPress={irADestino}
            style={({ pressed }) => [
              styles.campoDestino,
              pressed && styles.campoDestinoPresionado,
            ]}
          >
            <Ionicons
              name="location-sharp"
              size={20}
              color={paletaColores.textoSecundarioClaro}
            />
            <Text style={styles.campoDestinoTexto}>¿A dónde vamos?</Text>
          </Pressable>
        </View>

        {/* Mapa */}
        <MapaBase
          centro={CENTRO_BAGUA}
          conductores={CONDUCTORES_CERCANOS}
          interactivo={false}
          style={styles.mapa}
        />

        {/* Tipo de servicio */}
        <View style={styles.servicios}>
          {SERVICIOS.map((servicio) => {
            const seleccionado = servicio.id === tipoServicio;

            return (
              <Pressable
                key={servicio.id}
                onPress={() => setTipoServicio(servicio.id)}
                style={[
                  styles.servicio,
                  seleccionado && styles.servicioSeleccionado,
                ]}
              >
                <Ionicons
                  name={servicio.icono}
                  size={26}
                  color={paletaColores.boton}
                />
                <Text style={styles.servicioTitulo}>{servicio.titulo}</Text>
                <Text style={styles.servicioDescripcion}>
                  {servicio.descripcion}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Destinos frecuentes */}
        <View style={styles.encabezadoSeccion}>
          <Text style={styles.seccionTitulo}>Destinos frecuentes</Text>
          <Pressable onPress={irADestino} hitSlop={8}>
            <Text style={styles.verTodos}>Ver todos ›</Text>
          </Pressable>
        </View>

        <View style={styles.frecuentes}>
          {DESTINOS_FRECUENTES.map((destino) => (
            <Pressable
              key={destino.nombre}
              onPress={irADestino}
              style={styles.frecuente}
            >
              <Ionicons name={destino.icono} size={22} color={paletaColores.boton} />
              <View>
                <Text style={styles.frecuenteNombre}>{destino.nombre}</Text>
                <Text style={styles.frecuenteDetalle}>Agregar dirección</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Mensaje de seguridad */}
        <View style={styles.seguridad}>
          <Ionicons name="shield-checkmark" size={38} color={paletaColores.verde} />
          <View style={styles.seguridadTextos}>
            <Text style={styles.seguridadTitulo}>Viaja más seguro en Bagua</Text>
            <Text style={styles.seguridadDetalle}>
              Conductores verificados y de confianza
            </Text>
          </View>
        </View>

        <PrimaryButton
          title="Solicitar mototaxi"
          onPress={irADestino}
          style={styles.botonSolicitar}
        />
      </ScrollView>

      <BarraInferior activa="inicio" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    paddingBottom: 20,
  },

  cabecera: {
    paddingHorizontal: 20,
    paddingBottom: 72,
    backgroundColor: COLOR_CABECERA,
  },

  filaLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  logoImagen: {
    width: 30,
    height: 30,
  },

  logoTexto: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: paletaColores.texto,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficie,
    borderWidth: 2,
    borderColor: paletaColores.borde,
  },

  avatarEnLinea: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: paletaColores.verde,
    borderWidth: 2,
    borderColor: COLOR_CABECERA,
  },

  saludo: {
    fontSize: 24,
    fontWeight: "800",
    color: paletaColores.texto,
  },

  subtitulo: {
    fontSize: 14,
    marginTop: 2,
    color: paletaColores.textoSecundario,
  },

  tarjetaRuta: {
    marginTop: -52,
    marginHorizontal: 16,
    padding: 12,
    gap: 8,
    borderRadius: 18,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  filaOrigen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },

  iconoOrigen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5F8EF",
  },

  textoOrigen: {
    flex: 1,
  },

  origenTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  origenDetalle: {
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  botonIntercambio: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F3",
  },

  campoDestino: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F3",
  },

  campoDestinoPresionado: {
    backgroundColor: "#E4EBE7",
  },

  campoDestinoTexto: {
    fontSize: 16,
    color: paletaColores.textoSecundarioClaro,
  },

  mapa: {
    height: 190,
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
  },

  servicios: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginHorizontal: 16,
  },

  servicio: {
    flex: 1,
    gap: 2,
    padding: 12,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeClaro,
  },

  servicioSeleccionado: {
    backgroundColor: "#EAF8F1",
    borderColor: paletaColores.boton,
  },

  servicioTitulo: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  servicioDescripcion: {
    fontSize: 11,
    lineHeight: 14,
    color: paletaColores.textoSecundarioClaro,
  },

  encabezadoSeccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginHorizontal: 16,
  },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  verTodos: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.boton,
  },

  frecuentes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginHorizontal: 16,
  },

  frecuente: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  frecuenteNombre: {
    fontSize: 13,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  frecuenteDetalle: {
    fontSize: 10,
    color: paletaColores.textoSecundarioClaro,
  },

  seguridad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLOR_CABECERA,
  },

  seguridadTextos: {
    flex: 1,
  },

  seguridadTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: paletaColores.texto,
  },

  seguridadDetalle: {
    marginTop: 2,
    fontSize: 12,
    color: paletaColores.textoSecundario,
  },

  botonSolicitar: {
    width: "auto",
    marginTop: 14,
    marginHorizontal: 16,
  },
});
