import { paletaColores } from "@/paletaColores";
import { StyleSheet, Text } from "react-native";

interface Props {
  title: string;
  highlightedTitle: string;
  description: string;
  variant?: "dark" | "light";
}

export const PageHeader = ({ title, highlightedTitle, description, variant = "dark" }: Props) => {
  const isLight = variant === "light";

  return (
    <>
      <Text style={[
        styles.encabezado,
        isLight && styles.encabezadoLight,
      ]}>
        {title}
        <Text style={styles.resaltado}>{highlightedTitle}</Text>
      </Text>

      <Text style={[
        styles.descripcion,
        isLight && styles.descripcionLight,
      ]}>{description}</Text>
    </>
  );
};

const styles = StyleSheet.create({
  encabezado: {
    width: "100%",
    fontSize: 42,
    lineHeight: 39,
    fontWeight: "800",
    color: paletaColores.texto,
    marginBottom: 8,
    marginTop: 30,
  },

  encabezadoLight: {
    color: paletaColores.textoClaro,
  },

  resaltado: {
    color: paletaColores.verde,
  },

  descripcion: {
    width: "100%",
    fontSize: 20,
    lineHeight: 22,
    color: paletaColores.textoSecundario,
    marginBottom: 0,
  },

  descripcionLight: {
    color: paletaColores.textoSecundarioClaro,
  },
});
