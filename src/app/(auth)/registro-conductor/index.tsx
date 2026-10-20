import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
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
      return Alert.alert("Consulta en proceso", "Espera mientras verificamos los datos de tu DNI.");
    }
    if (dniVerificado !== dni || dni.length !== 8) {
      return Alert.alert("DNI requerido", "Ingresa un DNI válido de 8 dígitos y espera la verificación.");
    }
    if (!nombre.trim() || !apellidos.trim() || !fechaNacimiento || !correo.trim() || !contrasena || !confirmarContrasena.trim()) {
      return Alert.alert("Campos incompletos", "Completa todos los campos para continuar.");
    }
    if (calcularEdad(fechaNacimiento) < 18) {
      return Alert.alert("Edad no permitida", "Debes tener al menos 18 años para registrarte como conductor.");
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
        "Tu contraseña debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo."
      );
    }
    if (contrasena !== confirmarContrasena) {
      return Alert.alert("Contraseñas diferentes", "Las contraseñas ingresadas no coinciden.");
    }

    router.push("/registro-conductor/verificacion-contacto");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <EncabezadoPagina
          titulo={"Registro de\n"}
          tituloDestacado="conductor"
          descripcion="Completa tus datos para empezar a conducir con Altokke."
          variante="claro"
        />

        <ProgresoRegistro pasoActual={1} />

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
              <ActivityIndicator style={styles.indicadorDni} size="small" color={paletaColores.verde} />
            )}
          </View>

          {dniVerificado === dni && dni.length === 8 && (
            <View style={styles.mensajeExito}>
              <Ionicons name="checkmark-circle" size={18} color={paletaColores.verde} />
              <Text style={styles.textoExito}>Datos encontrados correctamente</Text>
            </View>
          )}

          <CampoTexto
            placeholder="Nombre completo"
            nombreIcono="person-outline"
            value={nombre}
            editable={false}
            variante="claro"
          />

          <CampoTexto
            placeholder="Apellidos"
            nombreIcono="person-outline"
            value={apellidos}
            editable={false}
            variante="claro"
          />

          <CampoFechaNacimiento
            valorFecha={fechaNacimiento}
            alCambiarFecha={setFechaNacimiento}
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

        <AvisoInformativo
          style={styles.aviso}
          texto="Tus datos se verificarán con tu documento de identidad en los siguientes pasos."
        />

        <BotonPrincipal
          titulo="Continuar"
          onPress={continuar}
          disabled={consultandoDni || !nombre || !apellidos}
        />

        <PiePaginaAutenticacion
          textoPregunta="¿Ya tienes una cuenta?"
          textoEnlace="Iniciar sesión"
          ruta="/login"
          variante="claro"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  formulario: {
    width: "100%",
    gap: 12,
  },
  contenedorDni: {
    position: "relative",
    width: "100%",
  },
  indicadorDni: {
    position: "absolute",
    right: 18,
    top: 20,
  },
  mensajeExito: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    marginTop: -4,
    marginBottom: 4,
  },
  textoExito: {
    color: paletaColores.verde,
    fontSize: 13,
    fontWeight: "600",
  },
  aviso: {
    marginTop: 18,
    marginBottom: 20,
  },
});
