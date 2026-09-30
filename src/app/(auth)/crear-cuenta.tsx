import { BotonPrincipal, EncabezadoLogo, TarjetaRol, PiePaginaAutenticacion } from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CrearCuentaScreen() {
  // Guardamos qué rol elige el usuario. Los signos < > le dicen a TypeScript que solo puede elegir esas 3 opciones exactas.
  const [selectedRole, setSelectedRole] = useState<
    "pasajero" | "conductor" | null
  >("pasajero");
  const router = useRouter();

  const handleContinue = () => {
    // Dependiendo del botón que tocó el usuario, lo mandamos a una ruta u otra
    if (selectedRole === "pasajero") {
      router.push("/registro-pasajero");
    } else if (selectedRole === "conductor") {
      router.push("/registro-conductor/datos-personales");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <EncabezadoLogo />

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            Crear <Text style={styles.titleHighlight}>cuenta</Text>
          </Text>
          <Text style={styles.subtitle}>
            Primero elige cómo deseas{"\n"}registrarte en Altokke.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <TarjetaRol
            titulo="Cuenta de pasajero"
            subtitulo="Pide mototaxis para ti y tu familia."
            nombreIcono="people-outline"
            seleccionado={selectedRole === "pasajero"}
            alPresionar={() => setSelectedRole("pasajero")}
          />
          <TarjetaRol
            titulo="Cuenta de conductor"
            subtitulo="Regístrate para ofrecer viajes y generar ingresos."
            nombreIcono="car-outline"
            seleccionado={selectedRole === "conductor"}
            alPresionar={() => setSelectedRole("conductor")}
          />
        </View>

        <View style={styles.spacer} />

        <BotonPrincipal
          titulo="Continuar"
          alPresionar={handleContinue}
        />

        <View style={styles.footerContainer}>
          <PiePaginaAutenticacion
            textoPregunta="¿Ya tienes cuenta?"
            ruta={"/login"}
            textoEnlace="Iniciar sesión"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: paletaColores.texto,
    marginBottom: 8,
  },
  titleHighlight: {
    color: paletaColores.verde,
  },
  subtitle: {
    fontSize: 16,
    color: paletaColores.textoSecundario,
    lineHeight: 24,
  },
  cardsContainer: {
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 12,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: paletaColores.borde,
    maxWidth: 60,
  },
  footerText: {
    fontSize: 14,
    color: paletaColores.textoSecundario,
  },
  footerLink: {
    color: paletaColores.verde,
    fontWeight: "bold",
  },
});
