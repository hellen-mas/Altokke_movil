import {
  BarraNavegacionSuperior,
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
} from "@/components/ui";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { supabase } from "@/lib/supabase";
import { paletaColores } from "@/paletaColores";
import { buscarDNI } from "@/utils/apiDNI";
import { seleccionarFotoGaleria } from "@/utils/avatar";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActivityIndicator, Alert, Image, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import * as yup from "yup";

const esquemaPaso2 = yup.object({
  dni: yup.string().length(8, "El DNI debe tener 8 dígitos").required("Requerido"),
  nombres: yup.string().required("Requerido"),
  apellidos: yup.string().required("Requerido"),
  telefono: yup.string().required("Requerido").min(9, "Debe tener 9 dígitos"),
});

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
  } = useForm({
    resolver: yupResolver(esquemaPaso2),
    defaultValues: {
      dni: datosPersonales.dni || "",
      nombres: datosPersonales.nombres || "",
      apellidos: datosPersonales.apellidos || "",
      telefono: datosPersonales.telefono || "",
    },
  });

  const dniActual = useWatch({ control, name: "dni" });
  const nombresActual = useWatch({ control, name: "nombres" });
  const apellidosActual = useWatch({ control, name: "apellidos" });

  const elegirFotoPerfil = async () => {
    try {
      const res = await seleccionarFotoGaleria();
      if (res) {
        setFotoLocal(res.uri);
        setFotoBase64(res.base64 || null);
      }
    } catch (err: any) {
      Alert.alert(
        "Foto de perfil",
        err?.message || "No se pudo seleccionar la imagen de la galería."
      );
    }
  };

  const consultarAPI = useCallback(async (numeroDni: string) => {
    Keyboard.dismiss();
    setLoadingDni(true);
    try {
      // 1. Verificamos primero en nuestra base de datos para no malgastar consultas de la API de pago
      const { data: usuarioExistente, error: dbError } = await supabase
        .from("usuarios")
        .select("id, rol")
        .eq("dni", numeroDni.trim())
        .maybeSingle();

      if (!dbError && usuarioExistente) {
        setDniValidado(false);
        setValue("nombres", "");
        setValue("apellidos", "");
        Alert.alert(
          "DNI ya registrado",
          `Este número de DNI ya pertenece a una cuenta registrada. Si es tu cuenta, por favor inicia sesión con tus credenciales.`,
          [
            {
              text: "Iniciar sesión",
              onPress: () => router.replace("/login"),
            },
            {
              text: "Entendido",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // 2. Solo si no está registrado en la base de datos, consultamos a la API de RENIEC
      const datos = await buscarDNI(numeroDni);
      setValue("nombres", datos.nombres);
      setValue("apellidos", datos.apellidos);
      setDniValidado(true);
    } catch (error: any) {
      setDniValidado(false);
      Alert.alert(
        "Validación de DNI",
        traducirErrorAuth(
          error,
          "No se pudo validar el DNI. Por favor verifica el número e inténtalo nuevamente."
        )
      );
    } finally {
      setLoadingDni(false);
    }
  }, [setValue]);

  // Cuando el usuario escribe los 8 dígitos del DNI, aplicamos debounce de 400ms para evitar saturación de peticiones
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (dniActual && dniActual.length === 8) {
      timeoutId = setTimeout(() => {
        consultarAPI(dniActual);
      }, 400);
    } else if (dniActual && dniActual.length < 8) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDniValidado(false);
      setValue("nombres", "");
      setValue("apellidos", "");
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dniActual, consultarAPI, setValue]);

  const onSubmit = (data: any) => {
    Keyboard.dismiss();
    setDatosPersonales({
      ...datosPersonales,
      ...data,
      fotoPerfil: fotoLocal,
      fotoBase64: fotoBase64,
    });
    router.push("/registro-pasajero/preferencias");
  };

  const onError = () => {
    Alert.alert(
      "Datos requeridos",
      "Por favor ingresa un número de DNI válido y tu número de celular para continuar."
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <BarraNavegacionSuperior titulo="Registro" />

      <View style={styles.headerContainer}>
        <EncabezadoPagina
          titulo={"Validación de\n"}
          tituloDestacado="identidad"
          descripcion="Para la seguridad de toda la comunidad, requerimos tu documento de identidad."
        />
      </View>

      <IndicadorPasos pasoActual={2} totalPasos={3} />

      <View style={styles.formContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="shield-checkmark" size={22} color={paletaColores.boton} />
          </View>
          <Text style={styles.infoText}>
            Validamos tu DNI directamente con RENIEC para garantizar la autenticidad y seguridad en cada viaje.
          </Text>
        </View>

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
            <Text style={styles.autoFillText}>
              Tus nombres y apellidos se completarán automáticamente con tu DNI.
            </Text>
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

        {/* Sección de Foto de Perfil */}
        <View style={styles.fotoSectionCard}>
          <Pressable
            style={({ pressed }) => [
              styles.fotoContainer,
              pressed && { opacity: 0.8 },
            ]}
            onPress={elegirFotoPerfil}
          >
            {fotoLocal ? (
              <Image source={{ uri: fotoLocal }} style={styles.foto} />
            ) : (
              <Ionicons
                name="person"
                size={32}
                color={paletaColores.textoSecundario}
              />
            )}
            <View style={styles.botonCamara}>
              <Ionicons name="camera" size={13} color="#0B1A12" />
            </View>
          </Pressable>

          <View style={styles.fotoInformacion}>
            <View style={styles.fotoBadgeRow}>
              <Text style={styles.fotoTitulo}>Foto de perfil</Text>
              <View style={styles.badgeRecomendado}>
                <Text style={styles.badgeTexto}>Recomendado</Text>
              </View>
            </View>
            <Text style={styles.fotoDescripcion}>
              Una foto clara de tu rostro ayuda a que el mototaxista te identifique fácilmente al recogerte.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.botonSubirFoto,
                pressed && { opacity: 0.7 },
              ]}
              onPress={elegirFotoPerfil}
            >
              <Ionicons
                name={fotoLocal ? "checkmark-circle" : "image-outline"}
                size={16}
                color={paletaColores.boton}
              />
              <Text style={styles.textoSubirFoto}>
                {fotoLocal ? "Cambiar foto" : "Elegir foto de galería"}
              </Text>
            </Pressable>
          </View>
        </View>
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
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
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
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#13231B",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: "rgba(46, 206, 121, 0.2)",
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(46, 206, 121, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#EDF5F0",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
  fotoSectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paletaColores.input,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    gap: 14,
  },
  fotoContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#13231B",
    borderWidth: 2,
    borderColor: paletaColores.boton,
  },
  foto: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  botonCamara: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: paletaColores.boton,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: paletaColores.fondo,
  },
  fotoInformacion: {
    flex: 1,
    gap: 4,
  },
  fotoBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fotoTitulo: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  badgeRecomendado: {
    backgroundColor: "rgba(46, 206, 121, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(46, 206, 121, 0.3)",
  },
  badgeTexto: {
    color: paletaColores.boton,
    fontSize: 12,
    fontWeight: "700",
  },
  fotoDescripcion: {
    color: "#C2D4CB",
    fontSize: 13.5,
    lineHeight: 18,
  },
  botonSubirFoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    paddingVertical: 4,
  },
  textoSubirFoto: {
    color: paletaColores.boton,
    fontSize: 15,
    fontWeight: "700",
  },
  bottomContainer: {
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
});
