import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
import { seleccionarFotoGaleria } from "@/utils/avatar";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { 
  Alert, 
  Image, 
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
}

export function SelectorFotoPerfil({
  fotoUri,
  alCambiarFoto,
  titulo = "Foto de perfil",
  descripcion = "Una foto clara de tu rostro ayuda a que el mototaxista te identifique fácilmente.",
}: SelectorFotoPerfilProps) {
  const { colores } = useAltokkeTheme();

  const elegirFoto = async () => {
    try {
      const resultado = await seleccionarFotoGaleria();
      if (resultado) {
        alCambiarFoto(resultado.uri, resultado.base64 || null);
      }
    } catch (error: any) {
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
        accessibilityRole="button"
        accessibilityLabel="Seleccionar foto de perfil"
      >
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.foto} />
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
          <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
        </View>
      </Pressable>

      <View style={styles.info}>
        <Text
          style={[
            styles.titulo,
            { color: colores.texto },
          ]}
        >
          {titulo}
        </Text>

        <Text
          style={[
            styles.descripcion,
            { color: colores.secundario },
          ]}
        >
          {descripcion}
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
