import {
  BotonPrincipal,
  CampoCodigoVerificacion,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useVerificarOtp } from "@/features/autenticacion/hooks/useVerificarOtp";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function VerificacionCodigoScreen() {
  const { colores, esOscuro } = useAltokkeTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  const {
    codigo,
    setCodigo,
    loading,
    reenviando,
    bloqueado,
    segundos,
    activo,
    verificarCodigo,
    reenviarCodigo,
  } = useVerificarOtp({ email });

  const gradienteFondo = esOscuro
    ? (["#0f281e", colores.fondo] as const)
    : (["#1d5538ff", colores.fondo] as const);

  return (
    <LinearGradient
      colors={gradienteFondo}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={[styles.pantalla, { backgroundColor: colores.fondo }]}
    >
      <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
        <View style={styles.topSection}>
          <EncabezadoPagina
            titulo="Verificar "
            tituloDestacado="código"
            descripcion={`Hemos enviado un código de 6 dígitos a:\n${
              email || "tu correo"
            }`}
          />

          <View style={styles.codeContainer}>
            <CampoCodigoVerificacion
              numeroDigitos={6}
              onChangeText={setCodigo}
            />

            <View style={styles.timerContainer}>
              <Ionicons
                name="time-outline"
                size={18}
                color={colores.primario}
              />
              <Text
                style={[
                  styles.timerText,
                  { color: colores.secundario },
                ]}
              >
                {bloqueado
                  ? "Acceso bloqueado por intentos"
                  : activo
                  ? `Reenviar código en 00:${segundos
                      .toString()
                      .padStart(2, "0")}`
                  : "Ya puedes solicitar otro código"}
              </Text>
            </View>

            <BotonPrincipal
              titulo="Verificar código"
              cargando={loading}
              onPress={verificarCodigo}
              disabled={loading || codigo.length < 6 || bloqueado}
            />

            <View style={styles.resendContainer}>
              <Text
                style={[
                  styles.resendText,
                  { color: colores.secundario },
                ]}
              >
                ¿No recibiste el código?{" "}
              </Text>
              <Pressable
                onPress={reenviarCodigo}
                disabled={activo || reenviando || bloqueado}
                hitSlop={12}
              >
                <Text
                  style={[
                    styles.resendLink,
                    { color: colores.exitoTexto },
                    (activo || reenviando || bloqueado) && { opacity: 0.5 },
                  ]}
                >
                  {reenviando ? "Reenviando..." : "Reenviar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <PiePaginaAutenticacion
            textoPregunta="¿No es tu correo?"
            textoEnlace="Cambiar"
            ruta="/recuperar-cuenta"
          />
        </View>
      </ContenedorPantalla>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  topSection: { gap: 20 },
  codeContainer: { gap: 16, alignItems: "center" },
  timerContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  timerText: { fontSize: 13, fontWeight: "500" },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendText: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: "600" },
  bottomContainer: { marginTop: "auto", paddingTop: 16 },
});
