import {
  BarraNavegacionSuperior,
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
  PiePaginaAutenticacion,
  SelectorFecha,
  SelectorOpciones,
} from "@/components/ui";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { paletaColores } from "@/paletaColores";
import { esquemaRegistroPasajero } from "@/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function PasajeroDatosPersonalesScreen() {
  const { datosPersonales, setDatosPersonales } = useRegistroPasajero();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(esquemaRegistroPasajero),
    defaultValues: {
      ciudad: datosPersonales.ciudad || "",
      nombres: datosPersonales.nombres || "",
      apellidos: datosPersonales.apellidos || "",
      tipoDocumento: datosPersonales.tipoDocumento || "",
      numeroDocumento: datosPersonales.numeroDocumento || "",
      fechaNacimiento: datosPersonales.fechaNacimiento || undefined,
      genero: datosPersonales.genero || "",
      direccion: datosPersonales.direccion || "",
      telefono: datosPersonales.telefono || "",
      correo: datosPersonales.correo || "",
    },
  });

  const onSubmit = (data: any) => {
    setDatosPersonales(data);
    router.push("/registro-pasajero/verificacion");
  };

  const onError = () => {
    Alert.alert(
      "Campos incompletos",
      "Por favor, completa todos los datos para continuar.",
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <BarraNavegacionSuperior titulo="Altokke" />

      <EncabezadoPagina
        titulo="Crea tu cuenta "
        tituloDestacado="de pasajero"
        descripcion="Completa tus datos básicos para continuar."
      />

      <IndicadorPasos pasoActual={1} totalPasos={3} />

      <View style={styles.profileSection}>
        <Pressable style={styles.profileImageContainer}>
          <View style={styles.profileImagePlaceholder}>
            <Ionicons
              name="person"
              size={40}
              color={paletaColores.textoSecundario}
            />
          </View>
          <View style={styles.addIconContainer}>
            <Ionicons name="add" size={16} color={paletaColores.fondo} />
          </View>
        </Pressable>
        <View style={styles.profileTextContainer}>
          <Text style={styles.profileTitle}>
            Foto de perfil <Text style={styles.optionalText}>(opcional)</Text>
          </Text>
          <Text style={styles.profileDescription}>
            Agrega una foto para que te reconozcan más fácil.
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="nombres"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="person-outline"
              textoReferencia="Nombres"
              valor={value}
              alCambiarTexto={onChange}
              error={!!errors.nombres}
              textoError={errors.nombres?.message as string}
            />
          )}
        />
        <Controller
          control={control}
          name="apellidos"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="person-outline"
              textoReferencia="Apellidos"
              valor={value}
              alCambiarTexto={onChange}
              error={!!errors.apellidos}
              textoError={errors.apellidos?.message as string}
            />
          )}
        />
        <Controller
          control={control}
          name="tipoDocumento"
          render={({ field: { onChange, value } }) => (
            <SelectorOpciones
              nombreIcono="card-outline"
              textoReferencia="Tipo de documento"
              valor={value}
              opciones={["DNI", "Pasaporte", "Carnet de Extranjería"]}
              alSeleccionar={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="numeroDocumento"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="card-outline"
              textoReferencia="Número de documento"
              valor={value}
              alCambiarTexto={onChange}
              keyboardType="numeric"
              error={!!errors.numeroDocumento}
              textoError={errors.numeroDocumento?.message as string}
            />
          )}
        />
        <Controller
          control={control}
          name="fechaNacimiento"
          render={({ field: { onChange, value } }) => (
            <SelectorFecha
              nombreIcono="calendar-outline"
              textoReferencia="Fecha de nacimiento"
              fecha={value}
              alSeleccionar={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="genero"
          render={({ field: { onChange, value } }) => (
            <SelectorOpciones
              nombreIcono="male-female-outline"
              textoReferencia="Género"
              valor={value}
              opciones={["Masculino", "Femenino", "Otro", "Prefiero no decirlo"]}
              alSeleccionar={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="direccion"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="location-outline"
              textoReferencia="Dirección"
              valor={value}
              alCambiarTexto={onChange}
              error={!!errors.direccion}
              textoError={errors.direccion?.message as string}
            />
          )}
        />
        <Controller
          control={control}
          name="ciudad"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="business-outline"
              textoReferencia="Ciudad"
              valor={value}
              alCambiarTexto={onChange}
              error={!!errors.ciudad}
              textoError={errors.ciudad?.message as string}
            />
          )}
        />
        <Controller
          control={control}
          name="telefono"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="call-outline"
              textoReferencia="Teléfono"
              valor={value}
              alCambiarTexto={onChange}
              keyboardType="phone-pad"
              error={!!errors.telefono}
              textoError={errors.telefono?.message as string}
            />
          )}
        />
        <Controller
          control={control}
          name="correo"
          render={({ field: { onChange, value } }) => (
            <CampoTexto
              nombreIcono="mail-outline"
              textoReferencia="Correo electrónico"
              valor={value}
              alCambiarTexto={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.correo}
              textoError={errors.correo?.message as string}
            />
          )}
        />
      </View>

      <View style={styles.buttonContainer}>
        <BotonPrincipal
          titulo="Siguiente"
          alPresionar={handleSubmit(onSubmit, onError)}
        />
      </View>

      <PiePaginaAutenticacion
        textoPregunta="¿Ya tienes cuenta?"
        textoEnlace="Iniciar sesión"
        ruta={"/login"}
        mostrarBorde={false}
      />
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: paletaColores.input,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: paletaColores.verde,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: paletaColores.fondo,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: paletaColores.texto,
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: "400",
    color: paletaColores.textoSecundario,
  },
  profileDescription: {
    fontSize: 14,
    color: paletaColores.textoSecundario,
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
    marginBottom: 30,
  },
  buttonContainer: {
    marginBottom: 20,
  },
});
