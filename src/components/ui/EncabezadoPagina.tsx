import { paletaColores } from "@/paletaColores";
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

export interface PropsEncabezadoPagina {
  titulo: string;
  tituloDestacado?: string;
  descripcion?: string;
  variante?: "oscuro" | "claro" | string;
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
    <View style={estilos.contenedor}>
      <Text
        style={[
          estilos.encabezado,
          !sinMargenSuperior && { marginTop: 18 },
          esClaro && estilos.encabezadoClaro,
          estiloTitulo,
        ]}
        accessibilityRole="header"
      >
        {titulo}
        {tituloDestacado && (
          <Text style={[estilos.resaltado, estiloResaltado]}>{tituloDestacado}</Text>
        )}
      </Text>

      {!!descripcion && (
        <Text style={[estilos.descripcion, esClaro && estilos.descripcionClara, estiloDescripcion]}>
          {descripcion}
        </Text>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    width: "100%",
  },
  encabezado: {
    width: "100%",
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    color: paletaColores.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  encabezadoClaro: {
    color: paletaColores.textoClaro,
  },
  resaltado: {
    color: paletaColores.primary,
    fontWeight: "800",
  },
  descripcion: {
    width: "100%",
    fontSize: 18,
    lineHeight: 26,
    color: paletaColores.textSecondary,
    fontWeight: "500",
    marginTop: 6,
    letterSpacing: -0.2,
  },
  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
});

export default EncabezadoPagina;
