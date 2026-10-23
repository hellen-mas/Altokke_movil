import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
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
  const { colores } = useAltokkeTheme();
  const colorIcono = peligro ? colores.error : colores.exitoTexto;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variante === "tarjeta"
          ? [
              styles.tarjeta,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]
          : [
              styles.fila,
              {
                borderBottomColor: colores.linea,
              },
            ],
        pressed && onPress ? styles.presionado : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <View
        style={[
          styles.iconoCaja,
          {
            backgroundColor: peligro ? colores.errorFondo : colores.exitoFondo,
          },
        ]}
      >
        <Ionicons name={icono} size={20} color={colorIcono} />
      </View>

      <View style={styles.textos}>
        <Text
          style={[
            styles.titulo,
            { color: peligro ? colores.error : colores.texto },
          ]}
        >
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[styles.subtitulo, { color: colores.secundario }]}>
            {subtitulo}
          </Text>
        ) : null}
      </View>

      {derecha}

      {!sinFlecha && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colores.secundario}
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
    minHeight: 48,
  },

  tarjeta: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  fila: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  presionado: {
    opacity: 0.7,
  },

  iconoCaja: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  textos: {
    flex: 1,
  },

  titulo: {
    fontSize: 15,
    fontWeight: "600",
  },

  subtitulo: {
    marginTop: 2,
    fontSize: 12,
  },
});
