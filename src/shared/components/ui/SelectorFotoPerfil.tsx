import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { seleccionarFotoGaleria, validarFotoModeracion } from "@/shared/utils/avatar";
import { Ionicons } from "@expo/vector-icons";
// Usar expo-image para decodificar la foto al tamaño del avatar
import { Image } from "expo-image";
import React, { useState } from "react";
import { 
  ActivityIndicator,
  Alert, 
  Pressable, 
  StyleSheet, 
  Text, 
  View 
} from "react-native";

export interface SelectorFotoPerfilProps {
  fotoUri: string | null;
  alCambiarFoto: (uri: string, base64?: string | null) => void;
  titulo?: string;
  descripcion?: string;
  variante?: "oscuro" | "claro";
  obligatoria?: boolean;
}

export function SelectorFotoPerfil({
  fotoUri,
  alCambiarFoto,
  titulo = "Foto de perfil",
  descripcion = "Una foto clara de tu rostro ayuda a que el mototaxista te identifique fácilmente.",
  obligatoria = false,
}: SelectorFotoPerfilProps) {
  const { colores } = useAltokkeTheme();
  const [validando, setValidando] = useState(false);

  const elegirFoto = async () => {
    if (validando) return;
    try {
      const resultado = await seleccionarFotoGaleria();
      if (!resultado) return;

      setValidando(true);
      const moderacion = await validarFotoModeracion(resultado);
      setValidando(false);

      if (!moderacion.ok) {
        Alert.alert(
          "Foto no permitida",
          moderacion.error || "Esta foto no está permitida. Por favor, selecciona una foto apropiada de tu rostro (no se permite desnudez, armas ni sustancias ilícitas)."
        );
        return;
      }

      alCambiarFoto(resultado.uri, resultado.base64 || null);
    } catch (error: any) {
      setValidando(false);
      Alert.alert("Foto de perfil", error?.message || "No se pudo seleccionar la imagen.");
    }
  };

  return (
    <View 
      style={[
        styles.card,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.linea,
        },
      ]}
    >
      <Pressable 
        style={({ pressed }) => [
          styles.avatarContainer, 
          {
            backgroundColor: colores.campo,
            borderColor: colores.linea,
          },
          pressed && styles.presionado,
        ]}
        onPress={elegirFoto}
        disabled={validando}
        accessibilityRole="button"
        accessibilityLabel="Seleccionar foto de perfil"
      >
        {validando ? (
          <ActivityIndicator size="small" color={colores.primario} />
        ) : fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.foto} contentFit="cover" />
        ) : (
          <Ionicons name="person-outline" size={27} 
            color={ colores.exitoTexto }
          />
        )}
        <View 
          style={[
            styles.badgeCamara,
            {
              backgroundColor: colores.primario,
              borderColor: colores.superficie,
            },
          ]}
        >
          {validando ? (
            <Ionicons name="hourglass-outline" size={13} color="#FFFFFF" />
          ) : (
            <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
          )}
        </View>
      </Pressable>

      <View style={styles.info}>
        <View style={styles.tituloRow}>
          <Text
            style={[
              styles.titulo,
              { color: colores.texto },
            ]}
          >
            {titulo}
          </Text>
          {obligatoria && (
            <View style={[styles.badgeObligatorio, { backgroundColor: colores.errorFondo }]}>
              <Text style={[styles.textoObligatorio, { color: colores.error }]}>* Requerida</Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.descripcion,
            { color: validando ? colores.primario : colores.secundario },
          ]}
        >
          {validando ? "Verificando foto..." : descripcion}
        </Text>
        
        <Pressable 
          style={({ pressed }) => [styles.boton, pressed && styles.presionado,]}
          onPress={elegirFoto}
          accessibilityRole="button"
          accessibilityLabel={
            fotoUri
              ? "Cambiar fotografía"
              : "Elegir fotografía"
          }
        >
          <Ionicons 
            name={fotoUri ? "checkmark-circle" : "image-outline"} 
            size={17} 
            color={colores.exitoTexto} 
          />
          <Text 
            style={[
              styles.botonTexto,
              { color: colores.exitoTexto },
            ]}
          >{fotoUri ? "Cambiar foto" : "Elegir foto de galería"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 15,
    borderRadius: 16,
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  foto: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  badgeCamara: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 5,
  },
  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeObligatorio: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  textoObligatorio: {
    fontSize: 11,
    fontWeight: "700",
  },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
  },
  descripcion: {
    fontSize: 12,
    lineHeight: 18,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 6,
    marginTop: 2,
  },
  botonTexto: {
    fontSize: 13,
    fontWeight: "700",
  },
  presionado: {
    opacity: 0.7,
  },
});
