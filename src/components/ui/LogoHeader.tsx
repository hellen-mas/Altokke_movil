import { Image, StyleSheet, Text, View } from "react-native";
import { paletaColores } from "../../paletaColores";

export const LogoHeader = () => {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require("../../../assets/images/logo-altokke-v2.png")}
        style={styles.logoImagen}
        resizeMode="contain"
      />

      <Text style={styles.logo}>Altokke</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  /* LOGO */
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
});
