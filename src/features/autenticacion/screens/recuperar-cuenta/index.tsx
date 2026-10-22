import {
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoPagina,
} from "@/shared/components/ui";
import { PiePaginaAutenticacion } from "@/features/autenticacion/components";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { authService } from "@/features/autenticacion/services/authService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

const ultimoEnvioPorCorreo = new Map<string, number>();
const ESPERA_MS = 60000;

export default function RecuperarPasswordScreen() {
  const { colores } = useAltokkeTheme();
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinuar = async () => {
    if (loading) return;
    const normalizado = correo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)) {
      Alert.alert("Correo inválido", "Por favor ingresa un correo electrónico válido para continuar.");
      return;
    }

    const ultimo = ultimoEnvioPorCorreo.get(normalizado);
    if (ultimo && Date.now() - ultimo < ESPERA_MS) {
      const seg = Math.ceil((ESPERA_MS - (Date.now() - ultimo)) / 1000);
      Alert.alert("Espera un momento", `Podrás solicitar otro código en ${seg} segundos.`);
      return;
    }

    setLoading(true);
    try {
      await authService.solicitarRecuperacionPassword(normalizado);
      ultimoEnvioPorCorreo.set(normalizado, Date.now());
      router.push(`/recuperar-cuenta/verificar-codigo?email=${encodeURIComponent(normalizado)}`);
    } catch (error: any) {
      Alert.alert(
        "Error al enviar código",
        traducirErrorAuth(error, "No se pudo enviar el código. Revisa que el correo esté registrado.")
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <View
          style={[
            styles.iconoHero,
            { backgroundColor: colores.exitoFondo, borderColor: colores.linea },
          ]}
        >
          <Ionicons name="mail-unread-outline" size={36} color={colores.exitoTexto} />
        </View>

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Recuperar "}
            tituloDestacado="cuenta"
            descripcion="Ingresa tu correo para recibir un código de recuperación."
          />
        </View>

        <View style={styles.formContainer}>
          <CampoTexto
            nombreIcono="mail-outline"
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={correo}
            onChangeText={setCorreo}
            conBotonLimpiar
          />

          <BotonPrincipal
            titulo="Continuar"
            mostrarIcono
            icono="arrow-forward"
            cargando={loading}
            onPress={handleContinuar}
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PiePaginaAutenticacion
          textoPregunta="¿Recordaste tu contraseña?"
          textoEnlace="Iniciar sesión"
          ruta="/login"
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
    gap: 4,
  },
  iconoHero: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 26,
  },
  formContainer: {
    gap: 24,
    marginBottom: 24,
  },
  bottomContainer: {
    marginTop: 10,
    alignItems: "center",
  },
});

