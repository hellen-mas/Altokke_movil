import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  MedidorPasswordSeguro,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { authService } from "@/services/authService";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { esquemaNuevaContrasena } from "@/utils/validaciones";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";

export default function NuevoPasswordScreen() {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(esquemaNuevaContrasena),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordActual = useWatch({ control, name: "password" }) || "";

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authService.actualizarPassword(data.password);
      Alert.alert(
        "Contraseña actualizada",
        "Tu contraseña se actualizó correctamente. Por favor inicia sesión con tu nueva clave.",
        [{ text: "Iniciar sesión", onPress: () => router.replace("/login") }]
      );
    } catch (error: any) {
      Alert.alert("Error al actualizar", traducirErrorAuth(error, "No se pudo actualizar la contraseña."));
    } finally {
      setLoading(false);
    }
  };


  const onError = () => {
    Alert.alert("Datos incompletos", "Las contraseñas no coinciden o no cumplen con los requisitos mínimos.");
  };

  return (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
        <View style={styles.topSection}>
          <View style={styles.headerContainer}>
            <EncabezadoPagina
              titulo={"Nueva "}
              tituloDestacado="contraseña"
              descripcion="Crea una contraseña segura para proteger tu cuenta."
            />
          </View>

          <View style={styles.formContainer}>
            <CampoTextoHookForm
              control={control}
              name="password"
              nombreIcono="lock-closed-outline"
              placeholder="Nueva contraseña"
              esPassword
            />

            <MedidorPasswordSeguro contrasena={passwordActual} />

            <CampoTextoHookForm
              control={control}
              name="confirmPassword"
              nombreIcono="lock-closed-outline"
              placeholder="Confirmar nueva contraseña"
              esPassword
            />

            <BotonPrincipal
              titulo="Guardar contraseña"
              cargando={loading}
              onPress={handleSubmit(onSubmit, onError)}
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <PiePaginaAutenticacion
            textoPregunta="¿Deseas cancelar?"
            textoEnlace="Iniciar sesión"
            ruta="/login"
          />
        </View>
      </ContenedorPantalla>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topSection: {
    gap: 4,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 26,
  },
  formContainer: {
    gap: 18,
    marginBottom: 20,
  },
  bottomContainer: {
    marginTop: 14,
    alignItems: "center",
  },
});

