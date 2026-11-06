import { COLORES_CUENTA } from "@/constants/cuenta";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type NombreIcono = keyof typeof Ionicons.glyphMap;

interface Props {
  icono: NombreIcono;
  titulo: string;
  subtitulo?: string;
  onPress?: () => void;
  variante?: "fila" | "tarjeta";
  peligro?: boolean;
  derecha?: ReactNode;
  sinFlecha?: boolean;
}

export function ItemMenu({
  icono,
  titulo,
  subtitulo,
  onPress,
  variante = "fila",
  peligro = false,
  derecha,
  sinFlecha = false,
}: Props) {
  const colorIcono = peligro ? paletaColores.error : paletaColores.boton;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variante === "tarjeta" ? styles.tarjeta : styles.fila,
        pressed && onPress ? styles.presionado : null,
      ]}
    >
      <View
        style={[
          styles.iconoCaja,
          peligro && { backgroundColor: COLORES_CUENTA.iconoFondoPeligro },
        ]}
      >
        <Ionicons name={icono} size={20} color={colorIcono} />
      </View>

      <View style={styles.textos}>
        <Text style={[styles.titulo, peligro && { color: paletaColores.error }]}>
          {titulo}
        </Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>

      {derecha}

      {!sinFlecha && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={paletaColores.textoSecundarioClaro}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  tarjeta: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },

  fila: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paletaColores.bordeClaro,
  },

  presionado: {
    opacity: 0.6,
  },

  iconoCaja: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORES_CUENTA.iconoFondo,
  },

  textos: {
    flex: 1,
  },

  titulo: {
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  subtitulo: {
    marginTop: 2,
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },
});
