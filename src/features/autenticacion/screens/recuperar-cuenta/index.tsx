import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
} from "@/shared/components/ui";
import { PiePaginaAutenticacion } from "@/features/autenticacion/components";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { authService } from "@/features/autenticacion/services/authService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import {
  esquemaRecuperar,
  TipoDatosRecuperar,
} from "@/features/autenticacion/utils/validacionesAuth";
import { yupResolver } from "@hookform/resolvers/yup";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";

const ultimoEnvioPorCorreo = new Map<string, number>();
const ESPERA_MS = 60000;

export default function RecuperarPasswordScreen() {
  const { colores } = useAltokkeTheme();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit } = useForm<TipoDatosRecuperar>({
    resolver: yupResolver(esquemaRecuperar),
    defaultValues: { correo: "" },
  });

  const onSubmit = async ({ correo }: TipoDatosRecuperar) => {
    if (loading) return;
    const normalizado = correo.trim().toLowerCase();
    const ultimo = ultimoEnvioPorCorreo.get(normalizado);

    if (ultimo && Date.now() - ultimo < ESPERA_MS) {
      const seg = Math.ceil((ESPERA_MS - (Date.now() - ultimo)) / 1000);
      return Alert.alert("Espera un momento", `Podrás solicitar otro código en ${seg} segundos.`);
    }

    setLoading(true);
    try {
      await authService.solicitarRecuperacionPassword(normalizado);
      ultimoEnvioPorCorreo.set(normalizado, Date.now());
      router.push(`/recuperar-cuenta/verificar-codigo?email=${encodeURIComponent(normalizado)}`);
    } catch (error: any) {
      Alert.alert("Error al enviar código", traducirErrorAuth(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <View style={[styles.iconoHero, { backgroundColor: colores.exitoFondo, borderColor: colores.linea }]}>
          <Ionicons name="mail-unread-outline" size={36} color={colores.exitoTexto} />
        </View>

        <EncabezadoPagina
          titulo="Recuperar "
          tituloDestacado="cuenta"
          descripcion="Ingresa tu correo para recibir un código de recuperación."
        />

        <View style={styles.formContainer}>
          <CampoTextoHookForm
            control={control}
            name="correo"
            nombreIcono="mail-outline"
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            conBotonLimpiar
          />

          <BotonPrincipal
            titulo="Continuar"
            mostrarIcono
            icono="arrow-forward"
            cargando={loading}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PiePaginaAutenticacion
          textoPregunta="¿Recordaste tu contraseña?"
          ruta="/login"
          textoEnlace="Iniciar sesión"
        />
      </View>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, flexGrow: 1, justifyContent: "space-between" },
  topSection: { gap: 20 },
  iconoHero: { width: 68, height: 68, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  formContainer: { gap: 14, marginTop: 4 },
  bottomContainer: { marginTop: "auto", paddingTop: 16 },
});
