import {
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoLogo,
  EncabezadoPagina,
  MedidorPasswordSeguro,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { esquemaNuevaContrasena } from "@/utils/validaciones";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";

export default function NuevoPasswordScreen() {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(esquemaNuevaContrasena),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordActual = useWatch({ control, name: "password" }) || "";

  const onSubmit = async (data: any) => {
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setLoading(false);
      Alert.alert(
        "Error al actualizar",
        traducirErrorAuth(
          error,
          "No se pudo actualizar la contraseña. Es posible que el enlace haya expirado."
        )
      );
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);

    Alert.alert(
      "Contraseña actualizada",
      "Tu contraseña se actualizó correctamente. Por favor inicia sesión con tu nueva clave.",
      [
        {
          text: "Iniciar sesión",
          onPress: () => router.replace("/login"),
        },
      ]
    );
  };

  const onError = () => {
    Alert.alert(
      "Datos incompletos",
      "Las contraseñas no coinciden o no cumplen con los requisitos mínimos de seguridad.",
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <EncabezadoLogo sinMargenSuperior />

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Nueva "}
            tituloDestacado="contraseña"
            descripcion="Crea una contraseña segura para proteger tu cuenta."
          />
        </View>

        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <CampoTexto
                nombreIcono="lock-closed-outline"
                placeholder="Nueva contraseña"
                esPassword
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          <MedidorPasswordSeguro contrasena={passwordActual} />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <CampoTexto
                nombreIcono="lock-closed-outline"
                placeholder="Confirmar nueva contraseña"
                esPassword
                value={value}
                onChangeText={onChange}
              />
            )}
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
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
