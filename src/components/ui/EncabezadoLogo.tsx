import { Image, StyleSheet, Text, View } from "react-native";
import { paletaColores } from "@/paletaColores";

interface PropsEncabezadoLogo {
  variante?: "oscuro" | "claro";
}

export const EncabezadoLogo = ({ variante = "oscuro" }: PropsEncabezadoLogo) => {
  const esClaro = variante === "claro";

  return (
    <View style={estilos.contenedorLogo}>
      <Image
        source={require("@/assets/images/logo-altokke-v2.png")}
        style={estilos.imagenLogo}
        resizeMode="contain"
      />

      <Text style={[
        estilos.logo,
        esClaro && estilos.logoClaro,
      ]}>Altokke</Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedorLogo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 50,
    marginBottom: 22,
    gap: 8,
  },

  imagenLogo: {
    width: 32,
    height: 32,
  },

  logo: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: paletaColores.texto,
  },

  logoClaro: {
    color: paletaColores.textoClaro,
  }
});
