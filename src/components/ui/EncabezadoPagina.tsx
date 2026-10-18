import { paletaColores } from "@/paletaColores";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

interface PropsEncabezadoPagina {
  titulo: string;
  tituloDestacado?: string;
  descripcion?: string;
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
        {tituloDestacado ? (
          <Text style={[estilos.resaltado, estiloResaltado]}>{tituloDestacado}</Text>
        ) : null}
      </Text>

      {descripcion ? (
        <Text
          style={[
            estilos.descripcion,
            esClaro && estilos.descripcionClara,
            estiloDescripcion,
          ]}
        >
          {descripcion}
        </Text>
      ) : null}
    </>
  );
};

const estilos = StyleSheet.create({
  encabezado: {
    width: "100%",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    marginTop: 0,
    letterSpacing: -0.5,
  },

  conMargen: {
    marginTop: 18,
  },

  encabezadoClaro: {
    color: paletaColores.textoClaro,
  },

  resaltado: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  descripcion: {
    width: "100%",
    fontSize: 17,
    lineHeight: 24,
    color: "#D0DFD6",
    fontWeight: "400",
    marginTop: 6,
    letterSpacing: -0.2,
  },

  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
});


