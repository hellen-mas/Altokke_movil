import {
  BotonPrincipal,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
  TarjetaRol,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { authService } from "@/services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function CrearCuentaScreen() {
  const [selectedRole, setSelectedRole] = useState<"pasajero" | "conductor">("pasajero");
  const router = useRouter();

  const handleContinue = async () => {
    const sesionActiva = await authService.tieneSesionActiva();
    const ruta = selectedRole === "pasajero"
      ? (sesionActiva ? "/registro-pasajero/verificacion" : "/registro-pasajero")
      : (sesionActiva ? "/registro-conductor/identidad-oficial" : "/registro-conductor");
    router.push(ruta);
  };


  return (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <ContenedorPantalla
        estilo={{ backgroundColor: "transparent" }}
        estiloContenedorContenido={styles.scrollContent}
      >
        <View style={styles.topSection}>
          <EncabezadoPagina
            titulo="Elige tu tipo de "
            tituloDestacado="cuenta"
            descripcion="Selecciona si deseas viajar como pasajero o generar ingresos conduciendo."
          />

          <View style={styles.cardsContainer}>
            <TarjetaRol
              titulo="Cuenta de pasajero"
              subtitulo="Pide viajes rápidos y seguros para ti y tu familia."
              nombreIcono="people-outline"
              seleccionado={selectedRole === "pasajero"}
              onPress={() => setSelectedRole("pasajero")}
            />
            <TarjetaRol
              titulo="Cuenta de conductor"
              subtitulo="Ofrece viajes en tu mototaxi y genera ingresos diarios."
              nombreIcono="speedometer-outline"
              seleccionado={selectedRole === "conductor"}
              onPress={() => setSelectedRole("conductor")}
            />
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <BotonPrincipal titulo="Continuar" onPress={handleContinue} />
          <PiePaginaAutenticacion
            textoPregunta="¿Ya tienes cuenta?"
            ruta="/login"
            textoEnlace="Iniciar sesión"
          />
        </View>
      </ContenedorPantalla>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  topSection: {
    gap: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  bottomContainer: {
    marginTop: "auto",
    paddingTop: 16,
    gap: 16,
  },
});
