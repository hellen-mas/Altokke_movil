import { CampoTexto } from "@/components/ui/CampoTexto";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { seleccionarFotoGaleria } from "@/utils/avatar";
import { esTelefonoValido, sanitizarTelefono } from "@/utils/validaciones";
import { router } from "expo-router";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";

export default function VerificacionContactoConductor() {
  const {
    telefono,
    setTelefono,
    correoRespaldo,
    setCorreoRespaldo,
    direccion,
    setDireccion,
    foto,
    setFoto,
  } = useRegistroConductor();

  const cambiarTelefono = (texto: string) => {
    setTelefono(sanitizarTelefono(texto));
  };

  const seleccionarFoto = async () => {
    try {
      const res = await seleccionarFotoGaleria();
      if (res?.uri) setFoto(res.uri);
    } catch (e: any) {
      Alert.alert("Permiso de fotos", e.message || "No se pudo seleccionar la foto.");
    }
  };

  const continuar = () => {
    if (!telefono.trim() || !direccion.trim() || !foto) {
      return Alert.alert("Campos incompletos", "Completa tu teléfono, dirección y fotografía de perfil.");
    }
    if (!esTelefonoValido(telefono.trim())) {
      return Alert.alert("Teléfono inválido", "Ingresa un número celular peruano de 9 dígitos.");
    }
    if (correoRespaldo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoRespaldo.trim())) {
      return Alert.alert("Correo inválido", "Ingresa un correo de respaldo válido.");
    }
    router.push("/registro-conductor/identidad-oficial");
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
          titulo={"Verificación y\n"}
          tituloDestacado="contacto"
          descripcion="Confirma tu información de contacto para continuar con el registro"
          variante="claro"
        />

        <ProgresoRegistro pasoActual={2}/>

        {/* Formulario */}
        <View style={styles.formulario}>
          <View style={styles.telefonoContainer}>
            <Ionicons
              name="call-outline"
              size={23}
              color={paletaColores.textoSecundarioClaro}
            />

            <View style={styles.telefonoContenido}>
              <Text style={styles.inputLabel}>Número de teléfono</Text>

              <View style={styles.numeroFila}>
                <Text style={styles.prefijo}>+51</Text>

                <TextInput
                  style={styles.telefonoTextInput}
                  placeholder="987654321"
                  placeholderTextColor={paletaColores.textoSecundarioClaro}
                  value={telefono}
                  onChangeText={cambiarTelefono}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>
          </View>

          <CampoTexto
            placeholder="Correo de respaldo (opcional)"
            nombreIcono="mail-outline"
            value={correoRespaldo}
            onChangeText={setCorreoRespaldo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            variante="claro"
          />
          <CampoTexto
            placeholder="Dirección actual"
            nombreIcono="location-outline"
            value={direccion}
            onChangeText={setDireccion}
            variante="claro"
          />
        </View>

        {/* Foto de perfil */}
        <View style={styles.fotoCard}>
          <Pressable style={styles.fotoContainer} onPress={seleccionarFoto}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.foto} />
            ) : (
              <Ionicons
                name="camera-outline"
                size={32}
                color={paletaColores.textoSecundarioClaro}
              />
            )}

            <View style={styles.botonMas}>
              <Text style={styles.botonMasTexto}>+</Text>
            </View>
          </Pressable>

          <View style={styles.fotoInformacion}>
            <Text style={styles.fotoTitulo}>Foto de perfil</Text>
            <Text style={styles.fotoDescripcion}>
              Sube una foto clara de tu rostro para identificación.
            </Text>

            <Pressable style={styles.botonSubirFoto} onPress={seleccionarFoto}>
              <Text style={styles.textoSubirFoto}>
                {foto ? "Cambiar foto" : "Subir foto de perfil"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Información */}
        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tu número de teléfono será validado posteriormente. Asegúrate de ingresar información correcta."
        />

        <BotonPrincipal titulo="Continuar" onPress={continuar} />
        <Pressable
          style={styles.atras}
          onPress={() => router.back()}
        >
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

  telefonoContainer: {
    width: "100%",
    height: 72,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
    gap: 12,

    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 14,

    backgroundColor: paletaColores.inputClaro,
  },

  telefonoContenido: {
    flex: 1,
    justifyContent: "center",
  },

  inputLabel: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
    marginBottom: 2,
  },

  numeroFila: {
    flexDirection: "row",
    alignItems: "center",
  },

  prefijo: {
    fontSize: 16,
    color: paletaColores.textoClaro,
    marginRight: 6,
  },

  telefonoTextInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontSize: 16,
    color: paletaColores.textoClaro,
  },

  fotoCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 16,
    backgroundColor: paletaColores.inputClaro,
    gap: 16,
  },

  fotoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2F4",
  },

  foto: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },

  botonMas: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.verde,
  },

  botonMasTexto: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },

  fotoInformacion: {
    flex: 1,
  },

  fotoTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "700",
  },

  fotoDescripcion: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    marginBottom: 10,
  },

  botonSubirFoto: {
    alignSelf: "flex-start",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#DDF7EA",
  },

  textoSubirFoto: {
    color: paletaColores.textoClaro,
    fontSize: 12,
    fontWeight: "600",
  },

  atras: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },

  atrasTexto: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 14,
    fontWeight: "600",
  },
});
