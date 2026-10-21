import { IndicadorPasos } from "@/components/ui";
import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { CampoFechaNacimiento } from "@/components/ui/CampoFechaNacimiento";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { MedidorPasswordSeguro } from "@/components/ui/MedidorPasswordSeguro";
import { PiePaginaAutenticacion } from "@/components/ui/PiePaginaAutenticacion";
import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { paletaColores } from "@/paletaColores";
import { usuarioService } from "@/services/usuarioService";
import { calcularEdad, sanitizarDNI } from "@/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
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

  const [consultandoDni, setConsultandoDni] = useState(false);
  const [dniVerificado, setDniVerificado] = useState("");
  const [errorDni, setErrorDni] = useState("");

  const cambiarDni = (texto: string) => {
    const nuevoDni = sanitizarDNI(texto);
    if (nuevoDni === dni) return;
    setDni(nuevoDni);
    setNombre("");
    setApellidos("");
    setDniVerificado("");
    setErrorDni("");
  };

  useEffect(() => {
    if (dni.length !== 8) {
      setDniVerificado("");
      setErrorDni("");
      return;
    }

    let cancelado = false;
    const timer = setTimeout(async () => {
      setConsultandoDni(true);
      setErrorDni("");
      try {
        const datos = await usuarioService.validarIdentidadDNI(dni);
        if (!cancelado) {
          setNombre(datos.nombres);
          setApellidos(datos.apellidos);
          setDniVerificado(dni);
        }
      } catch (err: any) {
        if (!cancelado) {
          setErrorDni(err?.message || "No se pudo validar el DNI.");
          setDniVerificado("");
          setNombre("");
          setApellidos("");
        }
      } finally {
        if (!cancelado) setConsultandoDni(false);
      }
    }, 450);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [dni, setNombre, setApellidos]);

  const continuar = () => {
    Keyboard.dismiss();
    if (consultandoDni) {
      return Alert.alert("Consulta en proceso", "Espera mientras verificamos tu DNI.");
    }
    if (dniVerificado !== dni || dni.length !== 8) {
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
      style={styles.areaSegura}
      edges={["top", "bottom"]}
    >
      <StatusBar style="dark"/>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
              variante="claro"
            />
          </View>

          <IndicadorPasos
            pasoActual={1}
            totalPasos={5}
            variante="claro"
          
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
                variante="claro"
                error={!!errorDni}
                textoError={errorDni}
              />
              {consultandoDni && (
                <ActivityIndicator style={styles.indicadorDni} size="small" color={paletaColores.primary} />
              )}
            </View>

            {dniVerificado === dni &&
              dni.length === 8 &&
              !consultandoDni &&
              nombre.trim() !== "" &&
              apellidos.trim() !== "" && (
                <View style={styles.tarjetaVerificada}>
                  <View style={styles.cabeceraVerificada}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={paletaColores.primary}
                    />
                    <Text style={styles.tituloVerificado}>
                      Datos verificados
                    </Text>
                  </View>

                  <Text style={styles.nombreVerificado}>
                    {`${nombre} ${apellidos}`}
                  </Text>
                </View>
              )}

            <CampoFechaNacimiento
              valorFecha={fechaNacimiento}
              alCambiarFecha={setFechaNacimiento}
              label="Fecha de nacimiento"
              variante="claro"
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
              variante="claro"
            />

            <CampoTexto
              placeholder="Contraseña"
              nombreIcono="lock-closed-outline"
              value={contrasena}
              onChangeText={setContrasena}
              esPassword
              autoCapitalize="none"
              autoCorrect={false}
              variante="claro"
            />

            <MedidorPasswordSeguro
              contrasena={contrasena}
              longitudMinima={12}
              variante="claro"
            />

            <CampoTexto
              placeholder="Confirmar contraseña"
              nombreIcono="lock-closed-outline"
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              esPassword
              autoCapitalize="none"
              autoCorrect={false}
              variante="claro"
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
              variante="claro"
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
