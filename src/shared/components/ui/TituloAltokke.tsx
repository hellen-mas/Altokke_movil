
import { StyleSheet, Text, type TextStyle } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

interface TituloAltokkeProps {
  texto: string;
  style?: TextStyle;
}

export function TituloAltokke({
  texto,
  style,
}: TituloAltokkeProps) {
  const { colores, esOscuro } = useAltokkeTheme();

  const palabras = texto.trim().split(/\s+/);
  const ultimaPalabra = palabras.pop() ?? "";
  const textoInicial = palabras.join(" ");

  return (
    <Text
      style={[
        styles.titulo,
        { color: colores.texto },
        style,
      ]}
    >
      {textoInicial ? `${textoInicial} ` : ""}
      <Text
        style={{
          color: esOscuro
            ? colores.primario
            : colores.exitoTexto,
        }}
      >
        {ultimaPalabra}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 35,
  },
});
