import { AuthFooter } from "@/components/ui/AuthFooter";
import { PageHeader } from "@/components/ui/PageHeader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoHeader } from "../components/ui/LogoHeader";
import PrimaryButton from "../components/ui/PrimaryButton";
import { paletaColores } from "../paletaColores";

export default function PantallaBienvenida() {
  return (
    <SafeAreaView style={styles.pantalla}>
      <LogoHeader />

      <PageHeader
        title={"Tu mototaxi,\n"}
        highlightedTitle="cuando lo necesites."
        description={"Pide un viaje en Bagua de forma \nrapida y sencilla."}
      />

      <Image
        source={require("../../assets/images/img-central.png")}
        style={styles.ilustracion}
        resizeMode="contain"
      />

      <PrimaryButton
        title={"Continuar"}
        onPress={() => {
          router.push("/");
        }}
        style={{ marginBottom: 15 }}
      />

      <AuthFooter
        questionText="¿Tienes una cuenta?"
        href={"/login"}
        linkText="Iniciar Sesión"
      />

      <View style={styles.rolesContainer}>
        <View style={styles.linea} />

        <View style={styles.rolesContenido}>
          <Ionicons
            name="people-outline"
            size={21}
            color={paletaColores.textoSecundario}
          />

          <Text style={styles.indicadorRoles}>
            Puedes ser pasajero o conductor{"\n"}
            en el siguiente paso
          </Text>
        </View>

        <View style={styles.linea} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
    paddingHorizontal: 22,
    paddingTop: 8,
    alignItems: "center",
  },
  ilustracion: {
    width: "125%",
    height: 380,
    marginTop: -50,
    marginBottom: -30,
  },
  rolesContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: "#214337",
  },
  rolesContenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  indicadorRoles: {
    fontSize: 16,
    lineHeight: 16,
    color: paletaColores.textoSecundario,
    textAlign: "center",
  },
});
