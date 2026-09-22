import { router, Link } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { paletaColores } from "@/paletaColores";
import { LogoHeader } from "@/components/ui/LogoHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { AuthFooter } from "@/components/ui/AuthFooter";
import { Ionicons } from "@expo/vector-icons";

export default function PantallaBienvenida() {
  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
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

         <PrimaryButton
          title={"Probar pasajero"}
          onPress={() => {
            router.push("/mapa");
          }}
          style={{ marginBottom: 15 }}
        />

        <PrimaryButton
          title={"Probar registro conductor"}
          onPress={() => {
            router.push("/registro-conductor/datos-personales");
          }}
          style={{ marginBottom: 15 }}
        /> 

        <PrimaryButton
          title={"Probar conductor"}
          onPress={() => {
            router.push("/cuenta/");
          }}
          style={{ marginBottom: 15 }}
        /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 20,
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
    marginTop: 18,
    marginBottom: 8,
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
    lineHeight: 22,
    color: paletaColores.textoSecundario,
    textAlign: "center",
  },
});
