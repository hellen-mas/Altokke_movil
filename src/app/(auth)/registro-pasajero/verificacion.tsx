import {
  AvisoInformativo,
  BotonPrincipal,
  CampoFechaNacimiento,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
  SelectorFotoPerfil,
} from "@/components/ui";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { paletaColores } from "@/paletaColores";
import { usuarioService } from "@/services/usuarioService";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { esquemaPaso2 } from "@/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActivityIndicator, Alert, Keyboard, StyleSheet, Text, View } from "react-native";

export default function PasajeroIdentidadScreen() {
  const { datosPersonales, setDatosPersonales } = useRegistroPasajero();
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniValidado, setDniValidado] = useState(false);
  const [fotoLocal, setFotoLocal] = useState<string | null>(datosPersonales.fotoPerfil || null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(datosPersonales.fotoBase64 || null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(esquemaPaso2),
    defaultValues: {
      dni: datosPersonales.dni || "",
      nombres: datosPersonales.nombres || "",
      apellidos: datosPersonales.apellidos || "",
      telefono: datosPersonales.telefono || "",
      fechaNacimiento: datosPersonales.fechaNacimiento || "",
    },
  });

  const dniActual = useWatch({ control, name: "dni" });
  const nombresActual = useWatch({ control, name: "nombres" });
  const apellidosActual = useWatch({ control, name: "apellidos" });
  const fechaNacimientoActual = useWatch({ control, name: "fechaNacimiento" });

  const consultarAPI = useCallback(async (dni: string) => {
    Keyboard.dismiss();
    setLoadingDni(true);
    try {
      const datos = await usuarioService.validarIdentidadDNI(dni);
      setValue("nombres", datos.nombres);
      setValue("apellidos", datos.apellidos);
      setDniValidado(true);
    } catch (err: any) {
      setDniValidado(false);
      setValue("nombres", "");
      setValue("apellidos", "");
      if (err?.code === "DNI_YA_REGISTRADO") {
        Alert.alert("DNI ya registrado", "Este número de DNI ya pertenece a una cuenta registrada.", [
          { text: "Iniciar sesión", onPress: () => router.replace("/login") },
          { text: "Entendido", style: "cancel" },
        ]);
      } else {
        Alert.alert("Validación de DNI", traducirErrorAuth(err, "No se pudo validar el DNI."));
      }
    } finally {
      setLoadingDni(false);
    }
  }, [setValue]);

  useEffect(() => {
    if (dniActual?.length === 8) {
      const timer = setTimeout(() => consultarAPI(dniActual), 400);
      return () => clearTimeout(timer);
    }
    if (dniActual && dniActual.length < 8) {
      setDniValidado(false);
      setValue("nombres", "");
      setValue("apellidos", "");
    }
  }, [dniActual, consultarAPI, setValue]);

  const onSubmit = (data: any) => {
    Keyboard.dismiss();
    setDatosPersonales({
      ...datosPersonales,
      ...data,
      fotoPerfil: fotoLocal,
      fotoBase64,
    });
    router.push("/registro-pasajero/preferencias");
  };

  const onError = (formErrors: any) => {
    Alert.alert(
      formErrors?.fechaNacimiento ? "Mayoría de edad requerida" : "Datos requeridos",
      formErrors?.fechaNacimiento?.message || "Por favor ingresa tu DNI, celular y fecha de nacimiento (+18 años)."
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
            titulo={"Validación de\n"}
            tituloDestacado="identidad"
            descripcion="Para la seguridad de toda la comunidad, requerimos tu documento de identidad."
          />
        </View>

        <IndicadorPasos pasoActual={2} totalPasos={3} />

        <View style={styles.formContainer}>
          <AvisoInformativo
            texto="Validamos tu DNI directamente con RENIEC para garantizar la autenticidad y seguridad en cada viaje."
            variante="oscuro"
          />

          <View style={styles.dniSection}>
            <CampoTextoHookForm
              control={control}
              name="dni"
              nombreIcono="card-outline"
              placeholder="Número de DNI (8 dígitos)"
              keyboardType="numeric"
              maxLength={8}
            />
            {loadingDni && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={paletaColores.boton} />
                <Text style={styles.statusText}>Consultando RENIEC...</Text>
              </View>
            )}
            {dniValidado && !loadingDni && (
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={16} color={paletaColores.boton} />
                <Text style={styles.statusSuccessText}>DNI validado exitosamente</Text>
              </View>
            )}
          </View>

          {dniValidado && nombresActual && apellidosActual ? (
            <View style={styles.verifiedCard}>
              <View style={styles.verifiedHeader}>
                <Ionicons name="person-circle-outline" size={20} color={paletaColores.boton} />
                <Text style={styles.verifiedTitle}>Datos oficiales RENIEC</Text>
              </View>
              <Text style={styles.verifiedName}>{`${nombresActual} ${apellidosActual}`}</Text>
            </View>
          ) : (
            <View style={styles.autoFillNote}>
              <Ionicons name="information-circle-outline" size={16} color={paletaColores.textoSecundario} />
              <Text style={styles.autoFillText}>Tus nombres y apellidos se completarán automáticamente con tu DNI.</Text>
            </View>
          )}

          <CampoTextoHookForm
            control={control}
            name="telefono"
            nombreIcono="call-outline"
            placeholder="Número de celular (9 dígitos)"
            keyboardType="phone-pad"
            maxLength={9}
          />

          <CampoFechaNacimiento
            valorIso={fechaNacimientoActual}
            alCambiar={(iso) => setValue("fechaNacimiento", iso, { shouldValidate: true })}
            error={errors?.fechaNacimiento?.message as string | undefined}
          />

          <SelectorFotoPerfil
            fotoUri={fotoLocal}
            alCambiarFoto={(uri, base64) => {
              setFotoLocal(uri);
              setFotoBase64(base64 || null);
            }}
          />
        </View>

        <View style={styles.bottomContainer}>
          <BotonPrincipal
            titulo="Continuar"
            cargando={loadingDni}
            onPress={handleSubmit(onSubmit, onError)}
            disabled={loadingDni}
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
    gap: 14,
    marginTop: 18,
    marginBottom: 20,
  },
  dniSection: {
    gap: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
    marginTop: 2,
  },
  statusText: {
    color: "#C2D4CB",
    fontSize: 14,
  },
  statusSuccessText: {
    color: paletaColores.boton,
    fontSize: 14,
    fontWeight: "600",
  },
  verifiedCard: {
    backgroundColor: paletaColores.input,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: paletaColores.boton,
    gap: 4,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedTitle: {
    color: paletaColores.boton,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  verifiedName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  autoFillNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  autoFillText: {
    color: "#A8BCB2",
    fontSize: 13.5,
  },
  bottomContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
});


