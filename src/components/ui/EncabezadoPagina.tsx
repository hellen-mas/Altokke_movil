import { paletaColores } from "@/paletaColores";
import { StyleSheet, Text } from "react-native";

interface PropsEncabezadoPagina {
  titulo: string;
  tituloDestacado: string;
  descripcion: string;
  variante?: "oscuro" | "claro";
}

export const EncabezadoPagina = ({ titulo, tituloDestacado, descripcion, variante = "oscuro" }: PropsEncabezadoPagina) => {
  const esClaro = variante === "claro";

  return (
    <>
      <Text style={[
        estilos.encabezado,
        esClaro && estilos.encabezadoClaro,
      ]}>
        {titulo}
        <Text style={estilos.resaltado}>{tituloDestacado}</Text>
      </Text>

      <Text style={[
        estilos.descripcion,
        esClaro && estilos.descripcionClara,
      ]}>{descripcion}</Text>
    </>
  );
};

const estilos = StyleSheet.create({
  encabezado: {
    width: "100%",
    fontSize: 42,
    lineHeight: 39,
    fontWeight: "800",
    color: paletaColores.texto,
    marginBottom: 8,
    marginTop: 30,
  },

  encabezadoClaro: {
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

  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
});
