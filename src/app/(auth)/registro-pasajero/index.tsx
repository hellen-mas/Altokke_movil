import {
  BarraNavegacionSuperior,
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
  MedidorPasswordSeguro,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { esquemaPaso1 } from "@/utils/validaciones";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, Keyboard, StyleSheet, View } from "react-native";

export default function PasajeroDatosPersonalesScreen() {
  const { datosPersonales, setDatosPersonales } = useRegistroPasajero();

  const {
    control,
    handleSubmit,
  } = useForm({
    resolver: yupResolver(esquemaPaso1),
    defaultValues: {
      correo: datosPersonales.correo || "",
      contrasena: datosPersonales.contrasena || "",
    },
  });

  const contrasenaActual = useWatch({ control, name: "contrasena" }) || "";

  const onSubmit = (data: any) => {
    Keyboard.dismiss();
    // Guardo correo y contrasena en memoria y paso a la validacion de identidad
    setDatosPersonales({ ...datosPersonales, ...data });
    router.push("/registro-pasajero/verificacion");
  };

  const onError = () => {
    Alert.alert(
      "Campos incompletos",
      "Por favor completa correctamente tu correo y una contraseña segura para continuar."
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <BarraNavegacionSuperior
        titulo="Registro"
        alRegresar={() => router.replace("/crear-cuenta")}
      />

      <View style={styles.headerContainer}>
        <EncabezadoPagina
          titulo={"Crea tu cuenta\nde "}
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
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    gap: 8,
  },
  bottomContainer: {
    marginTop: 16,
    gap: 20,
  },
});

