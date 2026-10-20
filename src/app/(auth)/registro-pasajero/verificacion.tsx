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
import { esquemaPaso2, sanitizarDNI, sanitizarTelefono } from "@/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { 
  ActivityIndicator, 
  Keyboard,
  Pressable, 
  StyleSheet, 
  Text, 
  View 
} from "react-native";

export default function PasajeroIdentidadScreen() {
  const { datosPersonales, setDatosPersonales } = useRegistroPasajero();
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniValidado, setDniValidado] = useState<string>("");
  const [errorDni, setErrorDni] = useState("");

  const consultaActual = useRef(0);

  const [fotoLocal, setFotoLocal] = useState<string | null>(
    datosPersonales.fotoPerfil || null
  );

  const [fotoBase64, setFotoBase64] = useState<string | null>(
    datosPersonales.fotoBase64 || null
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(esquemaPaso2),
    mode: "onChange",
    defaultValues: {
      dni: datosPersonales.dni || "",
      nombres: datosPersonales.nombres || "",
      apellidos: datosPersonales.apellidos || "",
      telefono: datosPersonales.telefono || "",
      fechaNacimiento: datosPersonales.fechaNacimiento || "",
    },
  });

  const dniActual = useWatch({ control, name: "dni" }) || "";
  const nombresActual = useWatch({ control, name: "nombres" });
  const apellidosActual = useWatch({ control, name: "apellidos" });
  const fechaNacimientoActual = useWatch({ control, name: "fechaNacimiento" });

  // Consultar el DNI sin conservar resultados de consultas antiguas.
  useEffect(() => {
    const identificador = ++consultaActual.current;

    if (!/^\d{8}$/.test(dniActual)) {
      setDniValidado("");
      setErrorDni("");
      setLoadingDni(false);

      setValue("nombres", "");
      setValue("apellidos", "");
      return;
    }

    if (dniValidado === dniActual) return;

    const timer = setTimeout(async () => {
      setLoadingDni(true);
      setErrorDni("");

      try {
        const datos = await usuarioService.validarIdentidadDNI(
          dniActual
        );

        if (identificador !== consultaActual.current) return;

        setValue("nombres", datos.nombres, {
          shouldValidate: true,
        });

        setValue("apellidos", datos.apellidos, {
          shouldValidate: true,
        });

        setDniValidado(dniActual);
      } catch (error: any) {
        if (identificador !== consultaActual.current) return;

        setDniValidado("");
        setValue("nombres", "");
        setValue("apellidos", "");

        if (error?.code === "DNI_YA_REGISTRADO") {
          setErrorDni(
            "Este DNI ya está registrado. Inicia sesión o utiliza otro documento."
          );
        } else {
          setErrorDni(
            traducirErrorAuth(
              error,
              "No pudimos validar el DNI. Inténtalo nuevamente."
            )
          );
        }
      } finally {
        if (identificador === consultaActual.current) {
          setLoadingDni(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      consultaActual.current++;
    };
  }, [dniActual, setValue]);

  const identidadVerificada =
    dniValidado === dniActual &&
    dniActual.length === 8 &&
    !loadingDni;

  const onSubmit = (data: any) => {
    Keyboard.dismiss();

    if (!identidadVerificada) {
      setErrorDni(
        "Primero debes validar tu DNI para continuar."
      );
      return;
    }

    setDatosPersonales({
      ...datosPersonales,
      ...data,
      fotoPerfil: fotoLocal,
      fotoBase64,
    });

    router.push("/registro-pasajero/preferencias");
  }

  return (
      <ContenedorPantalla 
        estilo={styles.pantalla}
        estiloContenedorContenido={styles.scrollContent}
      >
        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Verifica tu "}
            tituloDestacado="identidad"
            descripcion="Un paso más para viajar seguro."
            variante="claro"
          />
        </View>

        <IndicadorPasos 
          pasoActual={2} 
          totalPasos={3} 
          variante="claro"
        />

        <View style={styles.formContainer}>
          <AvisoInformativo
            texto="Verificaremos tu DNI para proteger tu cuenta."
            icono="shield-checkmark-outline"
            variante="claro"
          />

          <View style={styles.seccion}>
            <View style={styles.dniSection}>
              <CampoTextoHookForm
                control={control}
                name="dni"
                nombreIcono="card-outline"
                placeholder="Número de DNI (8 dígitos)"
                keyboardType="numeric"
                maxLength={15}
                transformar={sanitizarDNI}
                variante="claro"
              />
              {loadingDni && (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={paletaColores.primary} />
                  <Text style={styles.statusText}>Consultando RENIEC...</Text>
                </View>
              )}
              {identidadVerificada && (
                <View style={styles.statusRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={paletaColores.exito}
                  />
                  <Text style={styles.statusSuccessText}>DNI verificado correctamente</Text>
                </View>
              )}

              {!!errorDni && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={19}
                    color={paletaColores.error}
                  />

                  <View style={styles.errorContenido}>
                    <Text style={styles.errorText}>{errorDni}</Text>

                    {errorDni.includes("ya está registrado") && (
                      <Pressable
                        onPress={() => router.replace("/login")}
                        accessibilityRole="link"
                      >
                        <Text style={styles.enlace}>Ir a iniciar sesión</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </View>

            {identidadVerificada &&
            nombresActual &&
            apellidosActual && (
              <View style={styles.verifiedCard}>
                <View style={styles.verifiedHeader}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={paletaColores.exito}
                  />
                  <Text style={styles.verifiedTitle}>
                    Datos verificados
                  </Text>
                </View>

                <Text style={styles.verifiedName}>
                  {`${nombresActual} ${apellidosActual}`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Información adicional</Text>
            <CampoTextoHookForm
              control={control}
              name="telefono"
              nombreIcono="call-outline"
              placeholder="Número de celular (9 dígitos)"
              keyboardType="phone-pad"
              maxLength={15}
              transformar={sanitizarTelefono}
              variante="claro"
            />

            <CampoFechaNacimiento
              valorIso={fechaNacimientoActual}
              alCambiar={(iso) => setValue("fechaNacimiento", iso, { shouldValidate: true, shouldDirty: true, })}
              error={errors?.fechaNacimiento?.message as string | undefined}
              variante="claro"
            />
          </View>

          <SelectorFotoPerfil
            fotoUri={fotoLocal}
            descripcion="Ayuda al conductor a reconocerte."
            alCambiarFoto={(uri, base64) => {
              setFotoLocal(uri);
              setFotoBase64(base64 || null);
            }}
            variante="claro"
          />
        </View>

        <View style={styles.bottomContainer}>
          <BotonPrincipal
            titulo="Continuar"
            mostrarIcono
            icono="arrow-forward"
            cargando={loadingDni}
            disabled={loadingDni}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: paletaColores.fondoClaro,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  formContainer: {
    marginTop: 14,
    gap: 16,
  },
  seccion: {
    gap: 10,
  },
  tituloSeccion: {
    fontSize: 17,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },
  dniSection: {
    gap: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  statusText: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 13,
  },
  statusSuccessText: {
    color: paletaColores.primaryHover,
    fontSize: 13,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF1F1",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1CACA",
  },
  errorContenido: {
    flex: 1,
    gap: 6,
  },
  errorText: {
    color: "#A92D2D",
    fontSize: 13,
    lineHeight: 19,
  },
  enlace: {
    color: paletaColores.primaryHover,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  verifiedCard: {
    backgroundColor: "#EAF5EF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C4E5D1",
    gap: 5,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  verifiedTitle: {
    color: paletaColores.primaryHover,
    fontSize: 12,
    fontWeight: "700",
  },
  verifiedName: {
    color: paletaColores.textoClaro,
    fontSize: 16,
    fontWeight: "700",
  },
  verifiedDescription: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
  },
  autoFillNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },
  autoFillText: {
    flex: 1,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomContainer: {
    marginTop: 22,
    paddingTop: 8,
  },
});


