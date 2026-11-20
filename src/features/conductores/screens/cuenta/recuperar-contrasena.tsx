
import React, { useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { useRecuperarPassword } from "@/features/autenticacion/hooks/useRecuperarPassword";

import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";

import {
  AvisoInformativo,
  BotonPrincipal,
} from "@/shared/components/ui";

import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

function ocultarCorreo(correo: string): string {
  const [usuario, dominio] = correo.split("@");

  if (!usuario || !dominio) {
    return "Correo no disponible";
  }

  const caracteresVisibles = usuario.slice(0, 2);
  const caracteresOcultos = "*".repeat(
    Math.max(3, usuario.length - caracteresVisibles.length)
  );

  return `${caracteresVisibles}${caracteresOcultos}@${dominio}`;
}

export default function RecuperarContrasenaConductor() {
  const { colores } = useAltokkeTheme();
  const { user } = useAuth();

  // Utilizamos el correo de la sesión autenticada.
  const correo = user?.email?.trim().toLowerCase() ?? "";

  const irAVerificarCodigo = useCallback((email: string) => {
    router.push(
      `/recuperar-cuenta/verificar-codigo?email=${encodeURIComponent(email)}&origen=conductor`
    );
  }, []);

  const { loading, solicitarCodigo } = useRecuperarPassword({
    email: correo,
    onCodigoEnviado: irAVerificarCodigo,
  });

  const enviarCodigo = () => {
    if (!correo) {
      Alert.alert(
        "Correo no disponible",
        "No pudimos obtener el correo asociado a tu cuenta. Contacta con soporte."
      );
      return;
    }

    void solicitarCodigo();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colores.fondo },
      ]}
    >
      <CabeceraConductor
        titulo="Recuperar contraseña"
        mostrarAtras
        compacta
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.cardPrincipal,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <View
            style={[
              styles.iconoContainer,
              { backgroundColor: colores.exitoFondo },
            ]}
          >
            <Ionicons
              name="lock-open-outline"
              size={34}
              color={colores.exitoTexto}
            />
          </View>

          <Text
            style={[
              styles.titulo,
              { color: colores.texto },
            ]}
          >
            Recupera tu contraseña
          </Text>

          <Text
            style={[
              styles.descripcion,
              { color: colores.secundario },
            ]}
          >
            No te preocupes. Te ayudaremos a recuperar el acceso
            a tu cuenta de conductor mediante un código de seguridad
            enviado a tu correo electrónico.
          </Text>

          <View
            style={[
              styles.correoCard,
              {
                backgroundColor: colores.exitoFondo,
                borderColor: colores.linea,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={24}
              color={colores.exitoTexto}
            />

            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={[
                  styles.correoEtiqueta,
                  { color: colores.secundario },
                ]}
              >
                Enviaremos el código a:
              </Text>

              <Text
                style={[
                  styles.correoValor,
                  { color: colores.texto },
                ]}
              >
                {correo
                  ? ocultarCorreo(correo)
                  : "Correo no disponible"}
              </Text>
            </View>
          </View>

          {!correo && (
            <Text
              style={[
                styles.errorTexto,
                { color: colores.error },
              ]}
            >
              No encontramos el correo de tu sesión actual.
            </Text>
          )}

          <BotonPrincipal
            titulo="Enviar código de recuperación"
            mostrarIcono
            icono="mail-outline"
            cargando={loading}
            disabled={!correo || loading}
            onPress={enviarCodigo}
            estilo={styles.boton}
          />
        </View>

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Por seguridad, el código se enviará únicamente al correo electrónico asociado a tu cuenta de conductor."
          variante="claro"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
    gap: 18,
  },
  cardPrincipal: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 18,
  },
  iconoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  titulo: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  correoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  correoEtiqueta: {
    fontSize: 12,
  },
  correoValor: {
    fontSize: 14,
    fontWeight: "700",
  },
  errorTexto: {
    fontSize: 12,
    textAlign: "center",
  },
  boton: {
    marginTop: 4,
  },
});
