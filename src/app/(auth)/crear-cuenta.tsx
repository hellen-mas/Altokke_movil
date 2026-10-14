import {
  BotonPrincipal,
  EncabezadoLogo,
  PiePaginaAutenticacion,
  TarjetaRol,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type RolSeleccionado = "pasajero" | "conductor" | null;

export default function CrearCuentaScreen() {
  const [selectedRole, setSelectedRole] = useState<RolSeleccionado>("pasajero");
  const router = useRouter();

  const handleContinue = async () => {
    // Si ya inicio con Google salta correo y contraseña y va directo a verificar su identidad
    const { data } = await supabase.auth.getSession();
    const hasSession = !!data.session;

    if (selectedRole === "pasajero") {
      router.push("/registro-pasajero");
    } else if (selectedRole === "conductor") {
      router.push("/registro-conductor");
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
            onPress={() => setSelectedRole("pasajero")}
          />
          <TarjetaRol
            titulo="Cuenta de conductor"
            subtitulo="Regístrate para ofrecer viajes y generar ingresos."
            nombreIcono="car-outline"
            seleccionado={selectedRole === "conductor"}
            onPress={() => setSelectedRole("conductor")}
          />
        </View>

        <View style={styles.spacer} />

        <BotonPrincipal titulo="Continuar" onPress={handleContinue} />

        <View style={styles.footerContainer}>
          <PiePaginaAutenticacion
            textoPregunta="¿Ya tienes cuenta?"
            ruta={"/login"}
            textoEnlace="Iniciar sesión"
            mostrarBorde={false}
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
    fontSize: 18,
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
    marginTop: 16,
  },
});
