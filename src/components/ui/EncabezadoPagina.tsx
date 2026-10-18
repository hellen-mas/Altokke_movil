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
    lineHeight: 40,
    fontWeight: "800",
    color: paletaColores.texto,
    marginBottom: 8,
    marginTop: 0,
    letterSpacing: -0.5,
  },

  conMargen: {
    marginTop: 20,
  },

  encabezadoClaro: {
    color: paletaColores.textoClaro,
  },

  resaltado: {
    color: paletaColores.boton,
    fontWeight: "800",
  },

  descripcion: {
    width: "100%",
    fontSize: 18,
    lineHeight: 28, // 18px * 1.55-1.6 para lectura descansada y sin sobrecarga cognitiva
    color: paletaColores.textoSecundario,
    fontWeight: "500", // Peso medio sólido para evitar que se desvanezca en pantalla o bajo luz solar
    marginTop: 8,
    letterSpacing: -0.2,
  },

  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
});


