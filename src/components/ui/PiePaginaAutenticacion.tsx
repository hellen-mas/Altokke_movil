import { Href, Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { paletaColores } from "@/paletaColores";

interface PropsPiePaginaAutenticacion {
  textoPregunta: string;
  textoEnlace: string;
  ruta: Href;
  alineacion?: "left" | "center" | "right";
  mostrarBorde?: boolean;
  variante?: "oscuro" | "claro";
}

export const PiePaginaAutenticacion = ({
  textoPregunta,
  textoEnlace,
  ruta,
  alineacion = "center",
  mostrarBorde = true,
  variante = "oscuro",
}: PropsPiePaginaAutenticacion) => {
  const esClaro = variante === "claro";

  return (
    <Text
      style={[
        estilos.accesoCuenta,
        { textAlign: alineacion },
        esClaro && estilos.accesoCuentaClaro,
        !mostrarBorde && { borderWidth: 0 },
      ]}
    >
      {textoPregunta}{" "}

      <Link href={ruta} style={estilos.enlaceAcceso}>
        {textoEnlace}
      </Link>
    </Text>
  );
};

const estilos = StyleSheet.create({
  accesoCuenta: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 13,
    paddingHorizontal: 20,
    fontSize: 14,
    lineHeight: 20,
    color: paletaColores.texto,
  },

  enlaceAcceso: {
    color: paletaColores.verde,
    fontWeight: "600",
  },

  accesoCuentaClaro: {
    color: paletaColores.textoSecundarioClaro,
    borderColor: paletaColores.bordeClaro,
  }
});
