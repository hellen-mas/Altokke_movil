import { paletaColores } from "@/shared/theme/paletaColores";
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface PropsEncabezadoLogo {
  variante?: "oscuro" | "claro" | string;
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
    <View style={[estilos.contenedor, !sinMargenSuperior && { marginTop: 36 }, estilo]}>
      <Image
        source={require("@/assets/images/logo-altokke-v2.png")}
        style={estilos.imagen}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Logotipo de Altokke"
      />
      <Text style={[estilos.logo, esClaro && estilos.logoClaro]}>Altokke</Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 16,
    gap: 12,
  },
  imagen: {
    width: 42,
    height: 42,
  },
  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: paletaColores.textPrimary,
    letterSpacing: -0.5,
  },
  logoClaro: {
    color: paletaColores.textoClaro,
  },
});

export default EncabezadoLogo;
