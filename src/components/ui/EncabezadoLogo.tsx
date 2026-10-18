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
    marginTop: 8,
    marginBottom: 14,
    gap: 10,
  },

  conMargenSuperior: {
    marginTop: 40,
  },

  imagenLogo: {
    width: 32,
    height: 32,
  },

  logo: {
    fontSize: 21,
    fontWeight: "700",
    color: paletaColores.texto,
    letterSpacing: -0.4,
  },

  logoClaro: {
    color: paletaColores.textoClaro,
  },
});

