import { Image, StyleSheet, Text, View } from "react-native";
import { paletaColores } from "../../paletaColores";

interface Props {
  variant?: "dark" | "light";
}

export const LogoHeader = ({variant = "dark"}: Props) => {
  const isLight = variant === "light";

  return (
    <View style={styles.logoContainer}>
      <Image
        source={require("../../../assets/images/logo-altokke-v2.png")}
        style={styles.logoImagen}
        resizeMode="contain"
      />

      <Text style={[
        styles.logo,
        isLight && styles.logoLight,
      ]}>Altokke</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 50,
    marginBottom: 22,
    gap: 8,
  },

  logoImagen: {
    width: 32,
    height: 32,
  },

  logo: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: paletaColores.texto,
  },

  logoLight: {
    color: paletaColores.textoClaro,
  }
});
