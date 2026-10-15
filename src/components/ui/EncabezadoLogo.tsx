import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { paletaColores } from "@/paletaColores";

interface PropsEncabezadoLogo {
  variante?: "oscuro" | "claro";
  sinMargenSuperior?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

export const EncabezadoLogo = ({
  variante = "oscuro",
  sinMargenSuperior = true,
  estilo,
}: PropsEncabezadoLogo) => {
  const esClaro = variante === "claro";

  return (
    <View
      style={[
        estilos.contenedorLogo,
        !sinMargenSuperior && estilos.conMargenSuperior,
        estilo,
      ]}
    >
      <Image
        source={require("@/assets/images/logo-altokke-v2.png")}
        style={estilos.imagenLogo}
        resizeMode="contain"
      />

      <Text
        style={[
          estilos.logo,
          esClaro && estilos.logoClaro,
        ]}
      >
        Altokke
      </Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedorLogo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 12,
    marginBottom: 20,
    gap: 8,
  },

  conMargenSuperior: {
    marginTop: 50,
  },

  imagenLogo: {
    width: 36,
    height: 36,
  },

  logo: {
    fontSize: 26,
    fontWeight: "800",
    color: paletaColores.texto,
    letterSpacing: -0.5,
  },

  logoClaro: {
    color: paletaColores.textoClaro,
  },
});
