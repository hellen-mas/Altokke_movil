import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
} from "@/shared/components/ui";
import { MedidorPasswordSeguro, PiePaginaAutenticacion } from "@/features/autenticacion/components";
import { useRegistroPasajero } from "@/features/pasajeros/context/RegistroPasajeroContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { esquemaPaso1 } from "@/features/pasajeros/utils/validacionesPasajero";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { 
  Keyboard, 
  StyleSheet, 
  Text,
  View 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PasajeroDatosPersonalesScreen() {
  const { colores } = useAltokkeTheme();
  const { datosPersonales, setDatosPersonales } = useRegistroPasajero();

  const { 
    control, 
    handleSubmit,
    formState: { errors, isSubmitting }, 
  } = useForm({
    resolver: yupResolver(esquemaPaso1),
    mode: "onChange",
    defaultValues: {
      correo: datosPersonales.correo || "",
      contrasena: datosPersonales.contrasena || "",
      confirmarContrasena: datosPersonales.confirmarContrasena || "",
    },
  });

  const contrasenaActual = useWatch({ control, name: "contrasena" }) || "";

  const confirmarActual =
    useWatch({
      control,
      name: "confirmarContrasena",
    }) || "";

  const coinciden =
    contrasenaActual.length > 0 &&
    confirmarActual.length > 0 &&
    contrasenaActual === confirmarActual;


  const onSubmit = (data: any) => {
    Keyboard.dismiss();
    setDatosPersonales({ ...datosPersonales, ...data });
    router.push("/registro-pasajero/verificacion");
  };

  return (
      <ContenedorPantalla 
        estilo={[
          styles.pantalla,
          { backgroundColor: colores.fondo },
        ]} 
        estiloContenedorContenido={[
          styles.scrollContent,
          { backgroundColor: colores.fondo },
        ]}>
        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo="Crea tu "
            tituloDestacado="cuenta"
            descripcion="Empieza a viajar con Altokke"
          />
        </View>

        <IndicadorPasos pasoActual={1} totalPasos={3} variante="claro" />

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
              placeholder="Contraseña"
              esPassword
              autoCapitalize="none"
              textContentType="newPassword"
            />

            <MedidorPasswordSeguro
              contrasena={contrasenaActual}
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
          </View>

          {Object.keys(errors).length > 0 && (
            <View 
              style={[
                styles.avisoValidacion,
                {
                  backgroundColor: colores.exitoFondo,
                  borderColor: colores.linea,
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={19}
                color={colores.exitoTexto}
              />
              <Text 
                style={[
                  styles.textoValidacion,
                  { color: colores.texto },
                ]}
              >
                Revisa los campos señalados antes de continuar.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <BotonPrincipal
            titulo="Continuar"
            mostrarIcono
            icono="arrow-forward"
            cargando={isSubmitting}
            onPress={handleSubmit(onSubmit)}
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
  pantalla: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    flexGrow: 1,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  formContainer: {
    gap: 14,
    marginTop: 14,
    marginBottom: 18,
  },
  seccionTitulo: {
    gap: 6,
    marginBottom: 4,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "700",
  },
  descripcionSeccion: {
    fontSize: 14,
    lineHeight: 20,
  },
  passwordContainer: {
    gap: 12,
  },
  mensajeCoincidencia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 4,
  },
  textoCoincidencia: {
    fontSize: 13,
    fontWeight: "500",
  },
  avisoValidacion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    backgroundColor: "#EAF4EE",
    borderColor: "#C8E4D3",
    borderWidth: 1,
    borderRadius: 12,
  },
  textoValidacion: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomContainer: {
    marginTop: "auto",
    paddingTop: 24,
    gap: 12,
  },
});


