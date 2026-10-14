import { COLOR_CABECERA } from "@/constants/pasajero";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  /** Texto grande bajo el logo (por ejemplo el saludo) */
  titulo?: string;
  subtitulo?: string;
  /** Espacio extra abajo, para pantallas donde una tarjeta se monta sobre la cabecera */
  paddingInferior?: number;
  /** Contenido extra bajo el subtítulo (por ejemplo la barra de progreso del viaje) */
  children?: ReactNode;

  /** Muestra el punto de aviso en la campana cuando hay notificaciones por leer */
  hayNotificaciones?: boolean;
}

export function CabeceraPasajero({
  titulo,
  subtitulo,
  paddingInferior = 14,
  children,
  hayNotificaciones = false,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.cabecera,
        { paddingTop: insets.top + 12, paddingBottom: paddingInferior },
      ]}
    >
      <View style={styles.filaLogo}>
        <Image
          source={require("../../../assets/images/logo-altokke-v2.png")}
          style={styles.logoImagen}
          resizeMode="contain"
        />
        <Text style={styles.logoTexto}>Altokke</Text>

        <Pressable
          onPress={() => router.push("/notificaciones")}
          style={styles.botonNotificaciones}
        >
          <Ionicons
            name="notifications"
            size={22}
            color={paletaColores.textoSecundario}
          />
          {hayNotificaciones && <View style={styles.puntoNuevo} />}
        </Pressable>
      </View>

      {titulo && <Text style={styles.titulo}>{titulo}</Text>}
      {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    paddingHorizontal: 20,
    backgroundColor: COLOR_CABECERA,
  },

  filaLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
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

  botonNotificaciones: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficie,
    borderWidth: 2,
    borderColor: paletaColores.borde,
  },

  puntoNuevo: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: paletaColores.error,
    borderWidth: 2,
    borderColor: COLOR_CABECERA,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: paletaColores.texto,
  },

  subtitulo: {
    fontSize: 14,
    marginTop: 2,
    color: paletaColores.textoSecundario,
  },
});
