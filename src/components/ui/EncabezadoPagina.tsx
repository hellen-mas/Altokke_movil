import { paletaColores } from "@/paletaColores";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

interface PropsEncabezadoPagina {
  titulo: string;
  tituloDestacado: string;
  descripcion: string;
  variante?: "oscuro" | "claro";
  estiloTitulo?: StyleProp<TextStyle>;
  estiloResaltado?: StyleProp<TextStyle>;
  estiloDescripcion?: StyleProp<TextStyle>;
  sinMargenSuperior?: boolean;
}

export const EncabezadoPagina = ({
  titulo,
  tituloDestacado,
  descripcion,
  variante = "oscuro",
  estiloTitulo,
  estiloResaltado,
  estiloDescripcion,
  sinMargenSuperior = true,
}: PropsEncabezadoPagina) => {
  const esClaro = variante === "claro";

  return (
    <>
      <Text
        style={[
          estilos.encabezado,
          !sinMargenSuperior && estilos.conMargen,
          esClaro && estilos.encabezadoClaro,
          estiloTitulo,
        ]}
        accessibilityRole="header"
      >
        {titulo}
        <Text style={[estilos.resaltado, estiloResaltado]}>{tituloDestacado}</Text>
      </Text>

      <Text
        style={[
          estilos.descripcion,
          esClaro && estilos.descripcionClara,
          estiloDescripcion,
        ]}
      >
        {descripcion}
      </Text>
    </>
  );
};

const estilos = StyleSheet.create({
  encabezado: {
    width: "100%",
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 0,
    letterSpacing: -0.9,
  },

  conMargen: {
    marginTop: 20,
  },

  encabezadoClaro: {
    color: paletaColores.textoClaro,
  },

  resaltado: {
    color: "#2ECE79",
    fontWeight: "900",
  },

  descripcion: {
    width: "100%",
    fontSize: 20,
    color: "#EDF5F0",
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 28,
  },

  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
});
