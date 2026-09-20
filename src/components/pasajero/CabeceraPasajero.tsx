import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLOR_CABECERA } from "@/constants/pasajero";
import { paletaColores } from "@/paletaColores";

interface Props {
  /** Texto grande bajo el logo (por ejemplo el saludo) */
  titulo?: string;
  subtitulo: string;
  /** Espacio extra abajo, para pantallas donde una tarjeta se monta sobre la cabecera */
  paddingInferior?: number;
}

export function CabeceraPasajero({
  titulo,
  subtitulo,
  paddingInferior = 14,
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

        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={paletaColores.textoSecundario} />
          <View style={styles.avatarEnLinea} />
        </View>
      </View>

      {titulo && <Text style={styles.titulo}>{titulo}</Text>}
      <Text style={styles.subtitulo}>{subtitulo}</Text>
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
