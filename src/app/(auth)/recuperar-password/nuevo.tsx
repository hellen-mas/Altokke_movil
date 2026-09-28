import {
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoLogo,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { esquemaNuevaContrasena } from "@/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, router } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function NuevoPasswordScreen() {
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(esquemaNuevaContrasena),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: any) => {
    Alert.alert("Éxito", "La contraseña se actualizó correctamente.");
    router.push("/login");
  };

  const onError = () => {
    Alert.alert(
      "Error",
      "Las contraseñas no coinciden o no cumplen con los requisitos mínimos.",
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContainer}>
      <EncabezadoLogo />

      <Text style={styles.title}>Crear nueva contraseña</Text>
      <Text style={styles.subtitle}>
        Crea una contraseña fuerte y segura para proteger tu cuenta.
      </Text>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="lock-closed-outline"
              textoReferencia="Nueva contraseña"
              esPassword
              valor={value}
              alCambiarTexto={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="lock-closed-outline"
              textoReferencia="Confirmar nueva contraseña"
              esPassword
              valor={value}
              alCambiarTexto={onChange}
            />
          )}
        />

        <View style={styles.requirementsContainer}>
          <RequirementItem text="Al menos 8 caracteres" checked={true} />
          <RequirementItem text="Un número" checked={true} />
          <RequirementItem
            text="Un carácter especial (ej: @ # $ % & *)"
            checked={true}
          />
          <RequirementItem text="Una mayúscula" checked={true} />
        </View>

        <BotonPrincipal
          titulo="Guardar contraseña"
          alPresionar={handleSubmit(onSubmit, onError)}
          estilo={styles.submitButton}
        />
      </View>

      <View style={styles.footerContainer}>
        <Link href={"/login"} style={styles.backLink}>
          Volver al inicio
        </Link>
      </View>
    </ContenedorPantalla>
  );
}

function RequirementItem({
  text,
  checked,
}: {
  text: string;
  checked: boolean;
}) {
  return (
    <View style={styles.requirementItem}>
      <Ionicons
        name="checkmark"
        size={18}
        color={checked ? paletaColores.verde : paletaColores.textoSecundario}
      />
      <Text
        style={[
          styles.requirementText,
          checked && styles.requirementTextChecked,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: paletaColores.texto,
    marginTop: 10,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: paletaColores.textoSecundario,
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  requirementsContainer: {
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: paletaColores.textoSecundario,
  },
  requirementTextChecked: {
    color: paletaColores.texto,
  },
  submitButton: {
    marginTop: 8,
  },
  footerContainer: {
    marginTop: "auto",
    paddingTop: 32,
    alignItems: "center",
  },
  backLink: {
    color: paletaColores.verde,
    fontSize: 16,
    fontWeight: "600",
  },
});
