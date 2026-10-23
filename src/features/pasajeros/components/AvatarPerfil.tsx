import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Image, StyleSheet, Text, View } from "react-native";

interface Props {
  nombre: string;
  tamano?: number;
  enLinea?: boolean;
  conBorde?: boolean;
  uri?: string | null;
}

export function AvatarPerfil({
  nombre,
  tamano = 48,
  enLinea = false,
  conBorde = false,
  uri,
}: Props) {
  const { colores } = useAltokkeTheme();

  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();

  const circulo = {
    width: tamano,
    height: tamano,
    borderRadius: tamano / 2,
    borderWidth: conBorde ? 3 : 0,
    borderColor: colores.superficie,
  };
  const punto = Math.max(10, Math.round(tamano * 0.22));

  return (
    <View style={{ width: tamano, height: tamano }}>
      {uri ? (
        <Image source={{ uri }} style={circulo} />
      ) : (
        <View style={[styles.iniciales, circulo, { backgroundColor: colores.primario }]}>
          <Text style={[styles.texto, { fontSize: tamano * 0.36, color: colores.textoBoton }]}>
            {iniciales}
          </Text>
        </View>
      )}

      {enLinea && (
        <View
          style={[
            styles.punto,
            {
              width: punto,
              height: punto,
              borderRadius: punto / 2,
              backgroundColor: colores.exitoTexto,
              borderColor: colores.superficie,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iniciales: {
    alignItems: "center",
    justifyContent: "center",
  },

  texto: {
    fontWeight: "700",
  },

  punto: {
    position: "absolute",
    right: 1,
    bottom: 1,
    borderWidth: 2,
  },
});
