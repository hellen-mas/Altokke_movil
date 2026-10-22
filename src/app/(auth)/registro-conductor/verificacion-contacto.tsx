import { CampoTexto } from "@/shared/components/ui/CampoTexto";
import { EncabezadoPagina } from "@/shared/components/ui/EncabezadoPagina";
import { IndicadorPasos } from "@/shared/components/ui";
import { SelectorFotoPerfil } from "@/shared/components/ui";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { paletaColores } from "@/shared/theme/paletaColores";
import { useRegistroConductor } from "@/features/conductores/context/RegistroConductorContext";
import { 
  esTelefonoValido, 
  sanitizarTelefono 
} from "@/shared/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerificacionContactoConductor() {
  const {
    telefono,
    setTelefono,
    correoRespaldo,
    setCorreoRespaldo,
    direccion,
    setDireccion,
    foto,
    setFoto,
  } = useRegistroConductor();

  const [telefonoEnFoco, setTelefonoEnFoco] =
    useState(false);

  const [intentoContinuar, setIntentoContinuar] =
    useState(false);

  const telefonoCorrecto = esTelefonoValido(
    telefono.trim()
  );

  const mostrarErrorTelefono = intentoContinuar && !telefonoCorrecto;

  const cambiarTelefono = (texto: string) => {
    setTelefono(sanitizarTelefono(texto));
  };

  const continuar = () => {
    Keyboard.dismiss();
    setIntentoContinuar(true);

    if (!telefonoCorrecto) {
      return;
    }

    if (!direccion.trim()) {
      Alert.alert(
        "Dirección requerida",
        "Ingresa tu dirección actual."
      );
      return;
    }

    if (!foto) {
      Alert.alert(
        "Foto requerida",
        "Selecciona una fotografía de perfil."
      );
      return;
    }

    if (
      correoRespaldo.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correoRespaldo.trim()
      )
    ) {
      Alert.alert(
        "Correo inválido",
        "Revisa tu correo alternativo."
      );
      return;
    }

    router.push("/registro-conductor/identidad-oficial");
  };

  return (
    <SafeAreaView
      style={styles.areaSegura}
      edges={["top", "bottom"]}
    >
      <StatusBar style="dark"/>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.encabezado}>
            <EncabezadoPagina
              titulo={"Verificación y "}
              tituloDestacado="contacto"
              descripcion="¿Cómo podemos contactarte?"
              variante="claro"
            />
          </View>

          <IndicadorPasos
            pasoActual={2}
            totalPasos={5}
            variante="claro"
            etiquetas={[
              "Datos personales",
              "Contacto",
              "Identidad",
              "Documentos",
              "Vehículo",
            ]}
          />

          {/* Formulario */}
          <View style={styles.formulario}>
            <View>
              <View 
                style={[
                  styles.telefonoContainer,
                  telefonoEnFoco &&
                    styles.telefonoEnFoco,
                  mostrarErrorTelefono && 
                    styles.telefonoError
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={22}
                  color={
                    telefonoEnFoco
                      ? paletaColores.primary
                      : paletaColores.textoSecundarioClaro
                  }
                />

                <Text style={styles.prefijo}>
                  +51
                </Text>

                <View style={styles.separador} />

                <TextInput
                  style={styles.telefonoInput}
                  placeholder="Número de celular"
                  placeholderTextColor={
                    paletaColores.textoSecundarioClaro
                  }
                  value={telefono}
                  onChangeText={cambiarTelefono}
                  onFocus={() => setTelefonoEnFoco(true)}
                  onBlur={() => setTelefonoEnFoco(false)}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  maxLength={15}
                  accessibilityLabel="Número de celular"

                />
              </View>

              {mostrarErrorTelefono && (
                <View style={styles.mensajeError}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={paletaColores.error}
                  />
                  <Text style={styles.textoError}>
                    Ingresa un celular peruano válido
                    de 9 dígitos.
                  </Text>
                </View>
              )}
            </View>
            

            <CampoTexto
              placeholder="Correo de respaldo (opcional)"
              nombreIcono="mail-outline"
              value={correoRespaldo}
              onChangeText={setCorreoRespaldo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              variante="claro"
            />
            <CampoTexto
              placeholder="Dirección actual"
              nombreIcono="location-outline"
              value={direccion}
              onChangeText={setDireccion}
              autoCapitalize="sentences"
              variante="claro"
            />
          </View>

          {/* Foto de perfil */}
          <View style={styles.seccionFoto}>
            <SelectorFotoPerfil
              fotoUri={foto}
              descripcion="Para que puedan reconocerte."
              alCambiarFoto={(uri) => setFoto(uri)}
              variante="claro"
            />
          </View>
            
          {/* Navegación */}
          <View style={styles.navegacion}>
            <BotonPrincipal
              titulo="Continuar"
              mostrarIcono
              icono="arrow-forward"
              onPress={continuar}
            />

            <Pressable
              style={styles.botonVolver}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Volver al paso anterior"
            >
              <Ionicons
                name="arrow-back-outline"
                size={18}
                color={
                  paletaColores.textoSecundarioClaro
                }
              />

              <Text style={styles.textoVolver}>
                Volver
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView> 
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    backgroundColor: paletaColores.fondoClaro,
  },

  encabezado: {
    marginTop: 6,
    marginBottom: 8,
  },

  formulario: {
    width: "100%",
    gap: 14,
    marginTop: 16,
  },

  telefonoContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 56,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: paletaColores.inputClaro,
    borderColor: paletaColores.bordeClaro,
    borderWidth: 1,
    borderRadius: 12,
  },

  telefonoEnFoco: {
    borderColor: paletaColores.primary,
    borderWidth: 1.5,
    backgroundColor: paletaColores.inputClaro,
  },

  telefonoError: {
    borderColor: paletaColores.error,
    backgroundColor: "#FFF8F8",
  },

  prefijo: {
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  separador: {
    height: 22,
    width: 1,
    backgroundColor: paletaColores.bordeClaro,
  },

  telefonoInput: {
    flex: 1,
    fontSize: 16,
    color: paletaColores.textoClaro,
    paddingVertical: 12,
  },

  mensajeError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 4,
  },

  textoError: {
    flex: 1,
    color: paletaColores.error,
    fontSize: 12,
    lineHeight: 18,
  },

  seccionFoto: {
    marginTop: 20,
  },

  navegacion: {
    marginTop: "auto",
    paddingTop: 28,
    gap: 12,
  },

  botonVolver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
  },

  textoVolver: {
    fontSize: 14,
    fontWeight: "600",
    color: paletaColores.textoSecundarioClaro,
  },
});
