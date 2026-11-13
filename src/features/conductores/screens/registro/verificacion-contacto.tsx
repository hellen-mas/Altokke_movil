import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  BotonPrincipal,
  BotonVolverPaso,
  CampoTelefonoPeru,
  CampoTexto,
  EncabezadoPagina,
  IndicadorPasos,
  SelectorFotoPerfil,
} from "@/shared/components/ui";
import { paletaColores } from "@/shared/theme/paletaColores";
import { useRegistroConductor } from "@/features/conductores/store/registroConductorStore";
import { esTelefonoValido } from "@/shared/utils/validaciones";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerificacionContactoConductor() {
  const { colores, esOscuro } = useAltokkeTheme();
  // 3. zustand_uso - guardamos telefono y foto (paso 2)
  const {
    telefono,
    correoRespaldo,
    direccion,
    foto,
    actualizarFormulario,
  } = useRegistroConductor();

  const [intentoContinuar, setIntentoContinuar] = useState(false);

  const telefonoCorrecto = esTelefonoValido(telefono.trim());
  const mostrarErrorTelefono = intentoContinuar && !telefonoCorrecto;

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
      style={[styles.areaSegura, { backgroundColor: colores.fondo }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={esOscuro ? "light" : "dark"}/>

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colores.fondo }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { backgroundColor: colores.fondo }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.encabezado}>
            <EncabezadoPagina
              titulo={"Verificación y "}
              tituloDestacado="contacto"
              descripcion="¿Cómo podemos contactarte?"
              variante={esOscuro ? "oscuro" : "claro"}
            />
          </View>

          <IndicadorPasos
            pasoActual={2}
            totalPasos={5}
            variante={esOscuro ? "oscuro" : "claro"}
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
            <CampoTelefonoPeru
              valor={telefono}
              alCambiarTexto={(limpio) =>
                actualizarFormulario({ telefono: limpio })
              }
              error={mostrarErrorTelefono}
              mensajeError="Ingresa un celular peruano válido de 9 dígitos."
            />

            <CampoTexto
              placeholder="Correo de respaldo (opcional)"
              nombreIcono="mail-outline"
              value={correoRespaldo}
              onChangeText= {(texto) => actualizarFormulario({ correoRespaldo: texto })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              variante={esOscuro ? "oscuro" : "claro"}
            />
            <CampoTexto
              placeholder="Dirección actual"
              nombreIcono="location-outline"
              value={direccion}
              onChangeText={(texto) => actualizarFormulario({ direccion: texto })}
              autoCapitalize="sentences"
              variante={esOscuro ? "oscuro" : "claro"}
            />
          </View>

          {/* Foto de perfil */}
          <View style={styles.seccionFoto}>
            <SelectorFotoPerfil
              fotoUri={foto}
              descripcion="Para que puedan reconocerte."
              alCambiarFoto={(uri) => actualizarFormulario({ foto: uri })}
              variante={esOscuro ? "oscuro" : "claro"}
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

            <BotonVolverPaso />
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
    paddingBottom: 80,
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
