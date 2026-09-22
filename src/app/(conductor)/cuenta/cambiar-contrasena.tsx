import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { paletaColores } from "@/paletaColores";

interface CampoContrasenaProps {
  titulo: string;
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
}

function CampoContrasena({
  titulo,
  valor,
  onChangeText,
  placeholder,
}: CampoContrasenaProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.campoGrupo}>
      <Text style={styles.label}>
        {titulo}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={valor}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            paletaColores.textoSecundarioClaro
          }
          secureTextEntry={!visible}
          style={styles.input}
        />

        <Pressable
          style={styles.verBoton}
          onPress={() => setVisible(!visible)}
        >
          <Ionicons
            name={
              visible
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={19}
            color={paletaColores.textoSecundarioClaro}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function CambiarContrasena() {
  const [contrasenaActual, setContrasenaActual] =
    useState("");

  const [nuevaContrasena, setNuevaContrasena] =
    useState("");

  const [confirmarContrasena, setConfirmarContrasena] =
    useState("");

  const guardarCambios = () => {
    if (
      !contrasenaActual ||
      !nuevaContrasena ||
      !confirmarContrasena
    ) {
      Alert.alert(
        "Campos incompletos",
        "Completa todos los campos."
      );
      return;
    }

    if (nuevaContrasena.length < 8) {
      Alert.alert(
        "Contraseña muy corta",
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      Alert.alert(
        "Las contraseñas no coinciden",
        "Verifica que ambas contraseñas nuevas sean iguales."
      );
      return;
    }

    if (contrasenaActual === nuevaContrasena) {
      Alert.alert(
        "Usa una contraseña diferente",
        "La nueva contraseña debe ser distinta de la contraseña actual."
      );
      return;
    }

    Alert.alert(
      "Contraseña actualizada",
      "Tu contraseña fue actualizada correctamente."
    );

    setContrasenaActual("");
    setNuevaContrasena("");
    setConfirmarContrasena("");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <CabeceraConductor
          titulo="Cambiar contraseña"
          subtitulo="Actualiza tu contraseña de acceso"
          mostrarAtras
          compacta
        />

        <View style={styles.contenido}>
          <View style={styles.introCard}>
            <View style={styles.introIcono}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={paletaColores.verde}
              />
            </View>

            <View style={styles.introInformacion}>
              <Text style={styles.introTitulo}>
                Protege tu cuenta
              </Text>

              <Text style={styles.introDescripcion}>
                Utiliza una contraseña segura y diferente
                a la que usas en otros servicios.
              </Text>
            </View>
          </View>

          <View style={styles.formulario}>
            <CampoContrasena
              titulo="Contraseña actual"
              valor={contrasenaActual}
              onChangeText={setContrasenaActual}
              placeholder="Ingresa tu contraseña actual"
            />

            <CampoContrasena
              titulo="Nueva contraseña"
              valor={nuevaContrasena}
              onChangeText={setNuevaContrasena}
              placeholder="Mínimo 8 caracteres"
            />

            <CampoContrasena
              titulo="Confirmar nueva contraseña"
              valor={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              placeholder="Repite la nueva contraseña"
            />
          </View>

          <View style={styles.requisitos}>
            <Text style={styles.requisitosTitulo}>
              La contraseña debe:
            </Text>

            <View style={styles.requisito}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={paletaColores.verde}
              />

              <Text style={styles.requisitoTexto}>
                Tener al menos 8 caracteres
              </Text>
            </View>

            <View style={styles.requisito}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={paletaColores.verde}
              />

              <Text style={styles.requisitoTexto}>
                Ser diferente de tu contraseña actual
              </Text>
            </View>
          </View>

          <AvisoInformativo
            icono="shield-checkmark-outline"
            titulo="Información segura"
            texto="Nunca compartas tu contraseña con otras personas. Altokke no te pedirá tu contraseña por mensajes o llamadas."
          />

          <Pressable
            style={({ pressed }) => [
              styles.botonGuardar,
              pressed && styles.botonPresionado,
            ]}
            onPress={guardarCambios}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={paletaColores.textoOscuro}
            />

            <Text style={styles.botonTexto}>
              Guardar nueva contraseña
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  contenido: {
    marginHorizontal: 18,
    marginTop: 18,
  },

  introCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#E8F4ED",
  },

  introIcono: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
  },

  introInformacion: {
    flex: 1,
  },

  introTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 13,
    fontWeight: "800",
  },

  introDescripcion: {
    marginTop: 3,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 10,
    lineHeight: 15,
  },

  formulario: {
    marginTop: 20,
    gap: 15,
  },

  campoGrupo: {
    gap: 6,
  },

  label: {
    color: paletaColores.textoClaro,
    fontSize: 11,
    fontWeight: "700",
  },

  inputContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 13,
    backgroundColor: paletaColores.superficieClara,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 13,
    color: paletaColores.textoClaro,
    fontSize: 12,
  },

  verBoton: {
    width: 46,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  requisitos: {
    marginTop: 18,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#F3F7F5",
  },

  requisitosTitulo: {
    marginBottom: 8,
    color: paletaColores.textoClaro,
    fontSize: 11,
    fontWeight: "700",
  },

  requisito: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },

  requisitoTexto: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 10,
  },

  botonGuardar: {
    height: 49,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 3,
    backgroundColor: paletaColores.boton,
  },

  botonPresionado: {
    backgroundColor: paletaColores.botonPresionado,
  },

  botonTexto: {
    color: paletaColores.textoOscuro,
    fontSize: 13,
    fontWeight: "700",
  },
});