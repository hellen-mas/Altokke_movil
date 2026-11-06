import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useRecuperarPassword } from "@/features/autenticacion/hooks/useRecuperarPassword";
import {
  esquemaRecuperar,
  TipoDatosRecuperar,
} from "@/features/autenticacion/utils/validacionesAuth";
import { yupResolver } from "@hookform/resolvers/yup";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

export default function RecuperarPasswordScreen() {
  const { colores } = useAltokkeTheme();
  const { loading, solicitarCodigo } = useRecuperarPassword();
  const { control, handleSubmit } = useForm<TipoDatosRecuperar>({
    resolver: yupResolver(esquemaRecuperar),
    defaultValues: { correo: "" },
  });

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <View
          style={[
            styles.iconoHero,
            {
              backgroundColor: colores.exitoFondo,
              borderColor: colores.linea,
            },
          ]}
        >
          <Ionicons
            name="mail-unread-outline"
            size={36}
            color={colores.exitoTexto}
          />
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
            onPress={handleSubmit(solicitarCodigo)}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PiePaginaAutenticacion
          textoPregunta="¿Recordaste tu contraseña?"
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
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  topSection: { gap: 24 },
  iconoHero: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 8,
  },
  formContainer: { gap: 16 },
  bottomContainer: { marginTop: "auto", paddingTop: 16 },
});
