import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
  MedidorPasswordSeguro,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { paletaColores } from "@/paletaColores";
import { esquemaPaso1 } from "@/utils/validaciones";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, Keyboard, StyleSheet, View } from "react-native";

export default function PasajeroDatosPersonalesScreen() {
  const { datosPersonales, setDatosPersonales } = useRegistroPasajero();

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(esquemaPaso1),
    defaultValues: {
      correo: datosPersonales.correo || "",
      contrasena: datosPersonales.contrasena || "",
      confirmarContrasena: datosPersonales.confirmarContrasena || "",
    },
  });

  const contrasenaActual = useWatch({ control, name: "contrasena" }) || "";

  const onSubmit = (data: any) => {
    Keyboard.dismiss();
    setDatosPersonales({ ...datosPersonales, ...data });
    router.push("/registro-pasajero/verificacion");
  };

  const onError = (errors: any) => {
    Alert.alert(
      errors?.confirmarContrasena ? "Las contraseñas no coinciden" : "Campos incompletos",
      errors?.confirmarContrasena
        ? "Por favor asegúrate de que ambas contraseñas sean idénticas."
        : "Por favor completa correctamente tu correo y una contraseña segura para continuar."
    );
  };

  return (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Crea tu cuenta de "}
            tituloDestacado="pasajero"
            descripcion="Ingresa tus credenciales de acceso para comenzar."
          />
        </View>

        <IndicadorPasos pasoActual={1} totalPasos={3} />

        <View style={styles.formContainer}>
          <CampoTextoHookForm
            control={control}
            name="correo"
            nombreIcono="mail-outline"
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <View style={styles.passwordContainer}>
            <CampoTextoHookForm
              control={control}
              name="contrasena"
              nombreIcono="lock-closed-outline"
              placeholder="Contraseña segura"
              esPassword
              autoCapitalize="none"
              textContentType="newPassword"
            />

            <CampoTextoHookForm
              control={control}
              name="confirmarContrasena"
              nombreIcono="shield-checkmark-outline"
              placeholder="Confirmar contraseña"
              esPassword
              autoCapitalize="none"
              textContentType="newPassword"
            />

            <MedidorPasswordSeguro contrasena={contrasenaActual} />
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <BotonPrincipal
            titulo="Continuar"
            onPress={handleSubmit(onSubmit, onError)}
          />

          <PiePaginaAutenticacion
            textoPregunta="¿Ya tienes una cuenta?"
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
    paddingBottom: 28,
    flexGrow: 1,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  formContainer: {
    gap: 16,
    marginTop: 18,
    marginBottom: 20,
  },
  passwordContainer: {
    gap: 14,
  },
  bottomContainer: {
    marginTop: 16,
    gap: 20,
  },
});


