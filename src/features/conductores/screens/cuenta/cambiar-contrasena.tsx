import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { AvisoInformativo, BotonPrincipal, CampoTexto } from "@/shared/components/ui";
import { paletaColores } from "@/shared/theme/paletaColores";
import { supabase } from "@/shared/api/supabase";
import { router } from "expo-router";

export default function CambiarContrasena() {
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const guardarCambios = async () => {
    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
      return Alert.alert("Campos incompletos", "Completa todos los campos.");
    }
    if (nuevaContrasena.length < 8) {
      return Alert.alert("Contraseña muy corta", "La nueva contraseña debe tener al menos 8 caracteres.");
    }
    if (nuevaContrasena !== confirmarContrasena) {
      return Alert.alert("Las contraseñas no coinciden", "Verifica que ambas contraseñas nuevas sean iguales.");
    }
    if (contrasenaActual === nuevaContrasena) {
      return Alert.alert("Usa una contraseña diferente", "La nueva contraseña debe ser distinta de la actual.");
    }

    try {
      setCargando(true);
      const { error } = await supabase.auth.updateUser({ password: nuevaContrasena });
      if (error) throw error;

      Alert.alert("Contraseña actualizada", "Tu contraseña fue actualizada correctamente.", [
        { text: "Entendido", onPress: () => router.back() },
      ]);
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <CabeceraConductor titulo="Cambiar contraseña" subtitulo="Actualiza tu contraseña de acceso" mostrarAtras compacta />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.introCard}>
          <Ionicons name="lock-closed-outline" size={24} color={paletaColores.verde} />
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitulo}>Protege tu cuenta</Text>
            <Text style={styles.introDescripcion}>Utiliza una contraseña segura y diferente a la de otros servicios.</Text>
          </View>
        </View>

        <View style={styles.formularioCard}>
          <CampoTexto
            etiqueta="Contraseña actual"
            placeholder="Ingresa tu contraseña actual"
            value={contrasenaActual}
            onChangeText={setContrasenaActual}
            esPassword
          />
          <CampoTexto
            etiqueta="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            value={nuevaContrasena}
            onChangeText={setNuevaContrasena}
            esPassword
          />
          <CampoTexto
            etiqueta="Confirmar nueva contraseña"
            placeholder="Repite la nueva contraseña"
            value={confirmarContrasena}
            onChangeText={setConfirmarContrasena}
            esPassword
          />

          <BotonPrincipal
            titulo="Actualizar contraseña"
            onPress={guardarCambios}
            cargando={cargando}
            estilo={{ marginTop: 12 }}
          />
        </View>

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tu información está protegida con cifrado de punto a punto."
          variante="claro"
        />
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
    padding: 20,
    gap: 16,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  introTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: paletaColores.textPrimary,
  },
  introDescripcion: {
    fontSize: 13,
    color: paletaColores.textSecondary,
    marginTop: 2,
  },
  formularioCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
});
