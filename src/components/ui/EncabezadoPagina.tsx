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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: paletaColores.texto,
    marginBottom: 6,
    marginTop: 0,
    letterSpacing: -0.5,
  },

  conMargen: {
    marginTop: 16,
  },

  encabezadoClaro: {
    color: paletaColores.textoClaro,
  },

  resaltado: {
    color: paletaColores.texto,
    fontWeight: "700",
  },

  descripcion: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: paletaColores.textoSecundario,
    fontWeight: "400",
    marginTop: 2,
    letterSpacing: -0.1,
  },

  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
});

