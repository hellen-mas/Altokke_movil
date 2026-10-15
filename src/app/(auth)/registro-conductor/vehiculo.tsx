import { CampoTexto } from "@/components/ui/CampoTexto";
import { EncabezadoLogo } from "@/components/ui/EncabezadoLogo";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { supabase } from "@/lib/supabase";
import { subirAvatar } from "@/services/avatarStorage";
import { useState } from "react";
import {
  subirDocumento,
  guardarDocumentoBD,
  TipoDocumento
} from "@/services/documentosStorage";

export default function VehiculoConductor() {
  const [enviando, setEnviando] = useState(false);
  const {
    placa,
    setPlaca,
    marca,
    setMarca,
    modelo,
    setModelo,
    anio,
    setAnio,
    color,
    setColor,
    capacidad,
    setCapacidad,
    confirmacionVeracidad,
    setConfirmacionVeracidad,
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
  } = useRegistroConductor();

  const guardarArchivosConductor = async (
    usuarioId: string
  ) => {
    // 1. Fotografía de perfil
    if (foto) {
      const urlAvatar = await subirAvatar(
        usuarioId,
        foto
      );

      const { error } = await supabase
        .from("usuarios")
        .update({
          avatar_url: urlAvatar,
        })
        .eq("id", usuarioId);

      if (error) throw error;
    }

    // 2. Reunir documentos seleccionados
    const archivos: {
      tipo: TipoDocumento;
      uri: string;
      nombre?: string;
      mime?: string;
    }[] = [];

    if (dniFrente) {
      archivos.push({
        tipo: "DNI_FRONTAL",
        uri: dniFrente,
      });
    }

    if (dniReverso) {
      archivos.push({
        tipo: "DNI_POSTERIOR",
        uri: dniReverso,
      });
    }

    if (selfie) {
      archivos.push({
        tipo: "SELFIE",
        uri: selfie,
      });
    }

    if (licenciaConducir) {
      archivos.push({
        tipo: "LICENCIA",
        uri: licenciaConducir.uri,
        nombre: licenciaConducir.nombre,
        mime: licenciaConducir.tipo,
      });
    }

    if (soat) {
      archivos.push({
        tipo: "SOAT",
        uri: soat.uri,
        nombre: soat.nombre,
        mime: soat.tipo,
      });
    }

    if (antecedentesPenales) {
      archivos.push({
        tipo: "ANTECEDENTES",
        uri: antecedentesPenales.uri,
        nombre: antecedentesPenales.nombre,
        mime: antecedentesPenales.tipo,
      });
    }

    // 3. Subir y registrar cada documento
    for (const archivo of archivos) {
      const ruta = await subirDocumento(
        usuarioId,
        archivo.tipo,
        {
          uri: archivo.uri,
          nombre: archivo.nombre,
          tipo: archivo.mime,
        }
      );

      await guardarDocumentoBD(
        usuarioId,
        archivo.tipo,
        ruta
      );
    }
  };

  const enviarSolicitud = async () => {
    if (
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      !anio.trim() ||
      !color.trim() ||
      !capacidad.trim()
    ) {
      Alert.alert(
        "Campos incompleto",
        "Completa todos los datos del vehículo para continuar.",
      );
      return;
    }

    const anioNumero = Number(anio);
    const anioActual = new Date().getFullYear();

    if (
      anio.length !== 4 ||
      Number.isNaN(anioNumero) ||
      anioNumero < 1980 ||
      anioNumero > anioActual
    ) {
      Alert.alert(
        "Año inválido",
        `Ingresa un año válido entre 1980 y ${anioActual}.`,
      );
      return;
    }

    const capacidadNumero = Number(capacidad);
    if (
      Number.isNaN(capacidadNumero) ||
      capacidadNumero < 1 ||
      capacidadNumero > 4
    ) {
      Alert.alert(
        "Capacidad inválida",
        "Ingresa una capacidad válida de pasajeros.",
      );
      return;
    }

    if (!confirmacionVeracidad) {
      Alert.alert(
        "Confirmación requerida",
        "Debes confirmar que la información proporcionada es verdadera.",
      );
      return;
    }

    if (enviando) return;

    setEnviando(true);

    try {
       // 1. Comprobar si existe una sesión REALMENTE válida
        const { data: sesionData } =
          await supabase.auth.getSession();

        let usuarioId: string | null = null;
        let usuarioValido = false;

        if (sesionData.session) {
          const { data: usuarioData, error: usuarioError } =
            await supabase.auth.getUser();

          if (
            !usuarioError &&
            usuarioData.user &&
            usuarioData.user.email?.toLowerCase() ===
              correo.trim().toLowerCase() &&
            usuarioData.user.user_metadata?.rol === "conductor"
          ) {
            usuarioId = usuarioData.user.id;
            usuarioValido = true;
          }
        }

        if (!usuarioValido) {
          // Limpiar cualquier sesión antigua o inválida
          const { error: salidaError } =
            await supabase.auth.signOut({ scope: "local" });

          if (salidaError) {
            throw new Error(
              "No se pudo limpiar la sesión anterior: " +
              salidaError.message
            );
          }

          // 2. Crear la cuenta del nuevo conductor
          const { data, error: registroError } =
            await supabase.auth.signUp({
              email: correo.trim(),
              password: contrasena,
              options: {
                data: {
                  nombre: nombre.trim(),
                  apellidos: apellidos.trim(),
                  telefono: telefono.trim(),
                  dni: dni.trim(),
                  rol: "conductor",
                },
              },
            });

          if (registroError) throw registroError;

          if (!data.user) {
            throw new Error("No se pudo crear la cuenta.");
          }

          if (!data.session) {
            Alert.alert(
              "Confirma tu correo",
              "Tu cuenta fue creada, pero debes confirmar tu correo antes de subir los documentos."
            );
            return;
          }

          usuarioId = data.user.id;
        }

        // Confirmar que el usuario autenticado corresponde
        // al conductor antes de subir archivos.
        const { data: confirmacion, error: errorConfirmacion } =
          await supabase.auth.getUser();

        if (
          errorConfirmacion ||
          !confirmacion.user ||
          confirmacion.user.id !== usuarioId
        ) {
          throw new Error(
            "No se pudo validar la sesión del conductor. Vuelve a iniciar sesión."
          );
        }

        if (!usuarioId) {
          throw new Error(
            "No se pudo obtener el ID del conductor."
          );
        }
        
        console.log("Conductor autenticado:", usuarioId);

      // 3. Guardar fotografías y documentos
      console.log("Subiendo archivos del conductor...");

      await guardarArchivosConductor(usuarioId);

      console.log("Archivos guardados correctamente.");

      // 4. Registrar vehículo
      const { error: vehiculoError } = await supabase
        .from("vehiculos")
        .insert({
          conductor_id: usuarioId,
          placa: placa.trim().toUpperCase(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          anio: Number(anio),
          color: color.trim(),
          capacidad: Number(capacidad),
          activo: false,
        });

      if (vehiculoError) throw vehiculoError;

      console.log("Vehículo registrado correctamente.");

      // 5. Registro completado
      Alert.alert(
        "Solicitud enviada",
        "Tus documentos y vehículo fueron registrados. Tu cuenta está pendiente de aprobación.",
        [
          {
            text: "Aceptar",
            onPress: () => {
              router.replace(
                "/registro-conductor/solicitud-enviada"
              );
            },
          },
        ]
      );

    } catch (error: any) {
      console.error("Error al registrar conductor:", error);

      Alert.alert(
        "Error de registro",
        error.message || "No se pudo completar el registro."
      );
    } finally {
      setEnviando(false);
    }
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
        <EncabezadoLogo variante="claro" />

        <EncabezadoPagina
          titulo={"Vehículo y\n"}
          tituloDestacado="solicitud"
          descripcion="Completa los datos de tu mototaxi y envía tu solicitud."
          variante="claro"
        />

        <ProgresoRegistro pasoActual={5}/>

        {/* Formulario */}
        <View style={styles.formulario}>
          <CampoTexto
            placeholder="Placa"
            nombreIcono="card-outline"
            value={placa}
            onChangeText={(texto) => setPlaca(texto.toUpperCase())}
            autoCapitalize="characters"
            maxLength={10}
            variante="claro"
          />
          <CampoTexto
            placeholder="Marca"
            nombreIcono="car-outline"
            value={marca}
            onChangeText={setMarca}
            autoCapitalize="words"
            variante="claro"
          />
          <CampoTexto
            placeholder="Modelo"
            nombreIcono="settings-outline"
            value={modelo}
            onChangeText={setModelo}
            autoCapitalize="words"
            variante="claro"
          />
          <CampoTexto
            placeholder="Año"
            nombreIcono="calendar-outline"
            value={anio}
            onChangeText={setAnio}
            keyboardType="numeric"
            maxLength={4}
            variante="claro"
          />
          <CampoTexto
            placeholder="Color"
            nombreIcono="color-palette-outline"
            value={color}
            onChangeText={setColor}
            autoCapitalize="words"
            variante="claro"
          />
          <CampoTexto
            placeholder="Capacidad de pasajeros"
            nombreIcono="people-outline"
            value={capacidad}
            onChangeText={setCapacidad}
            keyboardType="numeric"
            maxLength={1}
            variante="claro"
          />
        </View>

        {/* Confirmación */}
        <Pressable
          style={styles.confirmacion}
          onPress={() =>
            setConfirmacionVeracidad((valorActual) => !valorActual)
          }
        >
          <View
            style={[
              styles.checkbox,
              confirmacionVeracidad && styles.checkboxActivo,
            ]}
          >
            {confirmacionVeracidad && (
              <Ionicons name="checkmark" size={17} color="#FFFFFF" />
            )}
          </View>

          <Text style={styles.confirmacionTexto}>
            Confirmo que la información proporcionada es verdadera.
          </Text>
        </Pressable>

        {/* Aviso */}
        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tu cuenta será revisada antes de ser activada."
        />

        <BotonPrincipal 
          titulo={enviando ? "Guardando archivos..." : "Enviar solicitud"}
          onPress={enviarSolicitud}
          disabled={enviando}
        />

        <Pressable style={styles.atras} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={20}
            color={paletaColores.textoSecundarioClaro}
          />

          <Text style={styles.atrasTexto}>Atrás</Text>
        </Pressable>
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
    paddingBottom: 40,
  },

  formulario: {
    width: "100%",
    gap: 12,
  },

  confirmacion: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeClaro,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.inputClaro,
  },

  checkboxActivo: {
    backgroundColor: paletaColores.verde,
    borderColor: paletaColores.verde,
  },

  confirmacionTexto: {
    flex: 1,
    color: paletaColores.textoClaro,
    fontSize: 13,
    lineHeight: 18,
  },
  
  atras: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },

  atrasTexto: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 14,
    fontWeight: "600",
  },
});
