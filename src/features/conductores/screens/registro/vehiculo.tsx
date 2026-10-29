import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { IndicadorPasos } from "@/shared/components/ui";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { CampoTexto } from "@/shared/components/ui/CampoTexto";
import { EncabezadoPagina } from "@/shared/components/ui/EncabezadoPagina";
import { useRegistroConductor } from "@/features/conductores/context/RegistroConductorContext";
import { paletaColores } from "@/shared/theme/paletaColores";
import { conductorService } from "@/features/conductores/services/conductorService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VehiculoConductor() {
  const { colores, esOscuro } = useAltokkeTheme();
  const [enviando, setEnviando] = useState(false);
  const envioEnCurso = useRef(false);

  const {
    placa,
    marca,
    modelo,
    anio,
    color,
    capacidad,
    confirmacionVeracidad,
    nombre,
    apellidos,
    dni,
    correo,
    contrasena,
    telefono,
    foto,
    dniFrente,
    dniReverso,
    selfie,
    licenciaConducir,
    soat,
    antecedentesPenales,
    actualizarFormulario,
  } = useRegistroConductor();

  const anioActual = new Date().getFullYear();

  const validarFormulario = (): boolean => {
    if (!placa.trim() || !marca.trim() || !modelo.trim() || !anio.trim() || !color.trim() || !capacidad.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Completa todos los datos del vehículo."
      );
      return false;
    }

    const anioNumero = Number(anio);

    if (
      !/^\d{4}$/.test(anio) ||
      anioNumero < 1980 ||
      anioNumero > anioActual
    ) {
      Alert.alert(
        "Año inválido",
        `Ingresa un año entre 1980 y ${anioActual}.`
      );
      return false;
    }

    const capacidadNumero = Number(capacidad);

     if (
      !/^[1-4]$/.test(capacidad) ||
      !Number.isInteger(capacidadNumero)
    ) {
      Alert.alert(
        "Capacidad inválida",
        "La capacidad debe ser de 1 a 4 pasajeros."
      );
      return false;
    }

    if (!confirmacionVeracidad) {
      Alert.alert(
        "Confirmación requerida",
        "Confirma que los datos ingresados son correctos."
      );
      return false;
    }

    return true;
  };

  const enviarSolicitud = async () => {
    if (envioEnCurso.current) return;

    Keyboard.dismiss();

    if (!validarFormulario()) return;

    envioEnCurso.current = true;
    setEnviando(true);

    try {
      await conductorService.completarRegistroConductor({
        correo,
        contrasena,
        nombre,
        apellidos,
        telefono,
        dni,
        foto,
        dniFrente,
        dniReverso,
        selfie,
        licenciaConducir,
        soat,
        antecedentesPenales,
        vehiculo: {
          placa,
          marca,
          modelo,
          anio: Number(anio),
          color,
          capacidad: Number(capacidad),
        },
      });

      Alert.alert(
        "Solicitud enviada",
        "Recibimos tu información. Tu cuenta pasará por revisión.",
        [{ 
          text: "Endendido", 
          onPress: () => 
            router.replace("/registro-conductor/solicitud-enviada"), 
        }],
        { cancelable: false }
      );
    } catch (error: any) {
      if (error?.message === "CONFIRMAR_CORREO") {
        Alert.alert("Confirma tu correo", "Tu cuenta fue creada, pero debes confirmar tu correo antes de continuar.");
      } else {
        Alert.alert("Error de registro", error?.message || "No se pudo completar el registro.");
      }
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.areaSegura, { backgroundColor: colores.fondo }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={esOscuro ? "light" : "dark"}/>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colores.fondo }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { backgroundColor: colores.fondo }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
        >
          <View style={styles.encabezado}>
            <EncabezadoPagina
              titulo="Vehículo y  "
              tituloDestacado="solicitud"
              descripcion="Completa los datos de tu mototaxi y envía tu solicitud."
              variante={esOscuro ? "oscuro" : "claro"}
            />
          </View>

          <IndicadorPasos
            pasoActual={5}
            totalPasos={5}
            variante={esOscuro ? "oscuro" : "claro"}
          />

          <View style={styles.formulario}>
            <CampoTexto
              placeholder="Placa"
              nombreIcono="card-outline"
              value={placa}
              onChangeText={(texto) => actualizarFormulario({ placa: texto.toUpperCase() })}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
              variante={esOscuro ? "oscuro" : "claro"}
            />
            <CampoTexto
              placeholder="Marca"
              nombreIcono="car-outline"
              value={marca}
              onChangeText={(texto) => actualizarFormulario({ marca: texto })}
              autoCapitalize="words"
              variante={esOscuro ? "oscuro" : "claro"}
            />
            <CampoTexto
              placeholder="Modelo"
              nombreIcono="settings-outline"
              value={modelo}
              onChangeText={(texto) => actualizarFormulario({ modelo: texto })}
              autoCapitalize="words"
              variante={esOscuro ? "oscuro" : "claro"}
            />
            <View style={styles.filaDoble}>
              <View style={styles.campoMitad}>
                <CampoTexto
                  placeholder="Año"
                  nombreIcono="calendar-outline"
                  value={anio}
                  onChangeText={(texto) =>
                    actualizarFormulario({ anio: texto.replace(/\D/g, "") })
                  }
                  keyboardType="number-pad"
                  maxLength={4}
                  variante={esOscuro ? "oscuro" : "claro"}
                />
              </View>

              <View style={styles.campoMitad}>
                <CampoTexto
                  placeholder="Color"
                  nombreIcono="color-palette-outline"
                  value={color}
                  onChangeText={(texto) => actualizarFormulario({ color: texto })}
                  autoCapitalize="words"
                  variante={esOscuro ? "oscuro" : "claro"}
                />
              </View>
            </View>

            <CampoTexto
              placeholder="Capacidad de pasajeros (1 a 4)"
              nombreIcono="people-outline"
              value={capacidad}
              onChangeText={(texto) =>
                actualizarFormulario({ capacidad: texto.replace(/[^1-4]/g, "") })
              }
              keyboardType="number-pad"
              maxLength={1}
              variante={esOscuro ? "oscuro" : "claro"}
            />
          </View>

          <Pressable
            style={styles.confirmacion}
            onPress={() =>
              actualizarFormulario({ confirmacionVeracidad: !confirmacionVeracidad })
            }
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: confirmacionVeracidad,
            }}
            accessibilityLabel="Confirmo que los datos del vehículo son correctos"
          >
            <View
              style={[
                styles.checkbox,
                { backgroundColor: colores.campo, borderColor: colores.linea },
                confirmacionVeracidad &&
                  styles.checkboxActivo,
                confirmacionVeracidad && { backgroundColor: colores.primario, borderColor: colores.primario },
              ]}
            >
              {confirmacionVeracidad && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={colores.textoBoton}
                />
              )}
            </View>

            <Text style={[styles.confirmacionTexto, { color: colores.texto }]}>
              Confirmo que los datos son correctos.
            </Text>
          </Pressable>

           <View style={styles.aviso}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colores.exitoTexto}
            />

            <Text style={[styles.avisoTexto, { color: colores.secundario }]}>
              Tu solicitud pasará por revisión.
            </Text>
          </View>

          <View style={styles.navegacion}>
            <BotonPrincipal
              titulo={
                enviando
                  ? "Enviando solicitud..."
                  : "Enviar solicitud"
              }
              mostrarIcono={!enviando}
              icono="arrow-forward"
              cargando={enviando}
              disabled={enviando}
              onPress={enviarSolicitud}
            />

            <Pressable
              style={styles.botonVolver}
              onPress={() => router.back()}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityLabel="Volver al paso anterior"
            >
              <Ionicons
                name="arrow-back-outline"
                size={18}
                color={colores.secundario}
              />

              <Text style={[styles.textoVolver, { color: colores.secundario }]}>
                Volver
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    backgroundColor: paletaColores.fondoClaro,
  },
  encabezado: {
    marginTop: 6,
    marginBottom: 8,
  },
  formulario: {
    width: "100%",
    gap: 12,
    marginTop: 16,
  },
  filaDoble: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  campoMitad: {
    flex: 1,
    minWidth: 0,
  },
  confirmacion: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.inputClaro,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActivo: {
    backgroundColor: paletaColores.primary,
    borderColor: paletaColores.primary,
  },
  confirmacionTexto: {
    flex: 1,
    color: paletaColores.textoClaro,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  avisoTexto: {
    flex: 1,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    lineHeight: 18,
  },
  navegacion: {
    marginTop: "auto",
    paddingTop: 28,
    gap: 12,
  },
  botonVolver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
  },
  textoVolver: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 14,
    fontWeight: "600",
  },
});
