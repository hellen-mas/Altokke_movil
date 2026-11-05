import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  MedidorPasswordSeguro,
  PiePaginaAutenticacion,
} from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useCambiarPassword } from "@/features/autenticacion/hooks/useCambiarPassword";
import { esquemaNuevaContrasena } from "@/features/autenticacion/utils/validacionesAuth";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";

export default function NuevoPasswordScreen() {
  const { colores, esOscuro } = useAltokkeTheme();
  const { cargando, cambiarPassword } = useCambiarPassword({
    onExito: () => {
      Alert.alert(
        "Contraseña actualizada",
        "Tu contraseña se actualizó correctamente. Por favor inicia sesión con tu nueva clave.",
        [{ text: "Iniciar sesión", onPress: () => router.replace("/login") }]
      );
    },
  });

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(esquemaNuevaContrasena),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordActual = useWatch({ control, name: "password" }) || "";

  const onSubmit = async (data: { password?: string; confirmPassword?: string }) => {
    if (!data.password || !data.confirmPassword) return;
    await cambiarPassword(data.password, data.confirmPassword);
  };

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
            titulo="Nueva "
            tituloDestacado="contraseña"
            descripcion="Crea una contraseña segura para proteger tu cuenta."
          />

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
              cargando={cargando}
              onPress={handleSubmit(onSubmit, () =>
                Alert.alert(
                  "Datos incompletos",
                  "Las contraseñas no coinciden o no cumplen con los requisitos de seguridad."
                )
              )}
              disabled={cargando}
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
  pantalla: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  topSection: { gap: 20 },
  formContainer: { gap: 14 },
  bottomContainer: { marginTop: "auto", paddingTop: 16 },
});
