import {
  BotonPrincipal,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
  TarjetaRol,
} from "@/components/ui";
import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
import { authService } from "@/services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function CrearCuentaScreen() {
  const { colores } = useAltokkeTheme();
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
      <ContenedorPantalla
        estilo={{ backgroundColor: colores.fondo }}
        estiloContenedorContenido={[styles.scrollContent, { backgroundColor: colores.fondo },]}
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
          <BotonPrincipal 
            titulo="Continuar" 
            mostrarIcono
            icono="arrow-forward"
            onPress={handleContinue} 
          />
          <PiePaginaAutenticacion
            textoPregunta="¿Ya tienes cuenta?"
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
    paddingTop: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topSection: {
    gap: 24,
  },
  cardsContainer: {
    gap: 12,
  },
  bottomContainer: {
    marginTop: "auto",
    paddingTop: 16,
    gap: 12,
  },
});
