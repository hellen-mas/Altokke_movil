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
        accessibilityRole="image"
        accessibilityLabel="Logotipo de Altokke"
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
    marginBottom: 16,
    gap: 12,
  },

  conMargenSuperior: {
    marginTop: 40,
  },

  imagenLogo: {
    width: 36,
    height: 36,
  },

  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: paletaColores.texto,
    letterSpacing: -0.4,
  },

  logoClaro: {
    color: paletaColores.textoClaro,
  },
});

