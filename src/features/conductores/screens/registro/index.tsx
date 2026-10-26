import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { IndicadorPasos } from "@/shared/components/ui";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { CampoFechaNacimiento } from "@/shared/components/ui/CampoFechaNacimiento";
import { CampoTexto } from "@/shared/components/ui/CampoTexto";
import { EncabezadoPagina } from "@/shared/components/ui/EncabezadoPagina";
import { MedidorPasswordSeguro } from "@/features/autenticacion/components/MedidorPasswordSeguro";
import { PiePaginaAutenticacion } from "@/features/autenticacion/components/PiePaginaAutenticacion";
import { useRegistroConductor } from "@/features/conductores/context/RegistroConductorContext";
import { paletaColores } from "@/shared/theme/paletaColores";
import { useConsultaDni } from "@/features/autenticacion/hooks/useConsultaDni";
import { calcularEdad, sanitizarDNI } from "@/shared/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DatosPersonalesConductor() {
  const { colores, esOscuro } = useAltokkeTheme();
  const {
    nombre,
    setNombre,
    apellidos,
    setApellidos,
    dni,
    setDni,
    fechaNacimiento,
    setFechaNacimiento,
    correo,
    setCorreo,
    contrasena,
    setContrasena,
    confirmarContrasena,
    setConfirmarContrasena,
  } = useRegistroConductor();

  const {
    cargando: consultandoDni,
    error: errorDni,
    esValido: dniEsValido,
    dniVerificado,
  } = useConsultaDni(
    dni,
    (nombresObtenidos, apellidosObtenidos) => {
      setNombre(nombresObtenidos);
      setApellidos(apellidosObtenidos);
    }
  );

  const cambiarDni = (texto: string) => {
    const nuevoDni = sanitizarDNI(texto);
    if (nuevoDni === dni) return;
    setDni(nuevoDni);
    if (nuevoDni.length !== 8) {
      setNombre("");
      setApellidos("");
    }
  };

  const continuar = () => {
    Keyboard.dismiss();
    if (consultandoDni) {
      return Alert.alert("Consulta en proceso", "Espera mientras verificamos tu DNI.");
    }
    if (!dniEsValido) {
      return Alert.alert("DNI requerido", "Ingresa un DNI válido y espera la verificación.");
    }
    if (!nombre.trim() || !apellidos.trim() || !fechaNacimiento || !correo.trim() || !contrasena || !confirmarContrasena.trim()) {
      return Alert.alert("Campos incompletos", "Completa todos los campos para continuar.");
    }
    if (calcularEdad(fechaNacimiento) < 18) {
      return Alert.alert("Edad no permitida", "Debes tener al menos 18 años.");
    }

    const requisitosContrasena = [
      contrasena.length >= 12,
      /[A-Z]/.test(contrasena),
      /[a-z]/.test(contrasena),
      /[0-9]/.test(contrasena),
      /[^A-Za-z0-9]/.test(contrasena),
    ];
    if (!requisitosContrasena.every(Boolean)) {
      return Alert.alert(
        "Contraseña poco segura",
        "Utiliza al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo."
      );
    }
    if (contrasena !== confirmarContrasena) {
      return Alert.alert("Contraseñas diferentes", "Las contraseñas no coinciden.");
    }

    router.push("/registro-conductor/verificacion-contacto");
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
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          <View style={styles.encabezado}>
            <EncabezadoPagina
              titulo={"Tus datos "}
              tituloDestacado="personales"
              descripcion="Comencemos con tu información."
              variante={esOscuro ? "oscuro" : "claro"}
            />
          </View>

          <IndicadorPasos
            pasoActual={1}
            totalPasos={5}
            variante={esOscuro ? "oscuro" : "claro"}
          
          />

          <View style={styles.formulario}>
            <View style={styles.contenedorDni}>
              <CampoTexto
                placeholder="Número de DNI"
                nombreIcono="card-outline"
                value={dni}
                onChangeText={cambiarDni}
                keyboardType="number-pad"
                maxLength={15}
                variante={esOscuro ? "oscuro" : "claro"}
                error={!!errorDni}
                textoError={errorDni}
              />
              {consultandoDni && (
                <ActivityIndicator style={styles.indicadorDni} size="small" color={colores.primario} />
              )}
            </View>

            {dniVerificado === dni &&
              dni.length === 8 &&
              !consultandoDni &&
              nombre.trim() !== "" &&
              apellidos.trim() !== "" && (
                <View style={[styles.tarjetaVerificada, { backgroundColor: colores.exitoFondo, borderColor: colores.linea }]}>
                  <View style={styles.cabeceraVerificada}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colores.primario}
                    />
                    <Text style={[styles.tituloVerificado, { color: colores.exitoTexto }]}>
                      Datos verificados
                    </Text>
                  </View>

                  <Text style={[styles.nombreVerificado, { color: colores.texto }]}>
                    {`${nombre} ${apellidos}`}
                  </Text>
                </View>
              )}

            <CampoFechaNacimiento
              valorFecha={fechaNacimiento}
              alCambiarFecha={setFechaNacimiento}
              label="Fecha de nacimiento"
              variante={esOscuro ? "oscuro" : "claro"}
            />

            <CampoTexto
              placeholder="Correo electrónico"
              nombreIcono="mail-outline"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              variante={esOscuro ? "oscuro" : "claro"}
            />

            <CampoTexto
              placeholder="Contraseña"
              nombreIcono="lock-closed-outline"
              value={contrasena}
              onChangeText={setContrasena}
              esPassword
              autoCapitalize="none"
              autoCorrect={false}
              variante={esOscuro ? "oscuro" : "claro"}
            />

            <MedidorPasswordSeguro
              contrasena={contrasena}
              longitudMinima={12}
              variante={esOscuro ? "oscuro" : "claro"}
            />

            <CampoTexto
              placeholder="Confirmar contraseña"
              nombreIcono="lock-closed-outline"
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              esPassword
              autoCapitalize="none"
              autoCorrect={false}
              variante={esOscuro ? "oscuro" : "claro"}
            />
          </View>
          
          <View style={styles.pieFormulario}>
             <BotonPrincipal
              titulo="Continuar"
              mostrarIcono
              icono="arrow-forward"
              onPress={continuar}
              disabled={
                consultandoDni ||
                dniVerificado !== dni ||
                !nombre ||
                !apellidos
              }
            />
            <PiePaginaAutenticacion
              textoPregunta="¿Ya tienes una cuenta?"
              textoEnlace="Iniciar sesión"
              ruta="/login"
              variante={esOscuro ? "oscuro" : "claro"}
            />
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
    paddingBottom: 32,
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
  contenedorDni: {
    position: "relative",
    width: "100%",
  },
  indicadorDni: {
    position: "absolute",
    right: 18,
    top: 19,
  },
  tarjetaVerificada: {
    backgroundColor: "#EAF5EF",
    borderWidth: 1,
    borderColor: "#C4E5D1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  cabeceraVerificada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  tituloVerificado: {
    color: paletaColores.primaryHover,
    fontSize: 12,
    fontWeight: "700",
  },
  nombreVerificado: {
    color: paletaColores.textoClaro,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  pieFormulario: {
    marginTop: 26,
    gap: 12,
  },
});
