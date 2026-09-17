import { paletaColores } from "@/paletaColores";
import { StyleSheet, Text } from "react-native";

interface Props {
  title: string;
  highlightedTitle: string;
  description: string;
}

export const PageHeader = ({ title, highlightedTitle, description }: Props) => {
  return (
    <>
      <Text style={styles.encabezado}>
        {title}
        <Text style={styles.resaltado}>{highlightedTitle}</Text>
      </Text>

      <Text style={styles.descripcion}>{description}</Text>
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
});
