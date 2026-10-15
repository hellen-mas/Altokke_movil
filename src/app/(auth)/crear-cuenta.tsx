import {
  BotonPrincipal,
  ContenedorPantalla,
  EncabezadoLogo,
  EncabezadoPagina,
  PiePaginaAutenticacion,
  TarjetaRol,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type RolSeleccionado = "pasajero" | "conductor";

export default function CrearCuentaScreen() {
  const [selectedRole, setSelectedRole] = useState<RolSeleccionado>("pasajero");
  const router = useRouter();

  const handleContinue = async () => {
    // Si ya inició con Google salta correo/contraseña y va directo a verificar su identidad
    const { data } = await supabase.auth.getSession();
    const hasSession = !!data.session;

    if (selectedRole === "pasajero") {
      router.push(
        hasSession ? "/registro-pasajero/verificacion" : "/registro-pasajero"
      );
    } else {
      router.push(
        hasSession
          ? "/registro-conductor/identidad-oficial"
          : "/registro-conductor"
      );
    }
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <EncabezadoLogo sinMargenSuperior />

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Crear "}
            tituloDestacado="cuenta"
            descripcion="Elige cómo deseas comenzar."
          />
        </View>

        <View style={styles.cardsContainer}>
          <TarjetaRol
            titulo="Cuenta de pasajero"
            subtitulo="Pide mototaxis para ti y tu familia de forma rápida."
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
      </View>

      <View style={styles.bottomContainer}>
        <BotonPrincipal
          titulo="Continuar"
          onPress={handleContinue}
        />

        <PiePaginaAutenticacion
          textoPregunta="¿Ya tienes una cuenta?"
          ruta="/login"
          textoEnlace="Iniciar sesión"
        />
      </View>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topSection: {
    gap: 4,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 22,
  },
  cardsContainer: {
    marginTop: 6,
    marginBottom: 6,
  },
  bottomContainer: {
    marginTop: 24,
    gap: 32,
  },
});
