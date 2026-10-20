import { paletaColores } from "@/paletaColores";
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
  variante = "oscuro"
}: SelectorFotoPerfilProps) {
  const esClaro = variante === "claro";

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
        esClaro && styles.cardClaro,
      ]}
    >
      <Pressable 
        style={({ pressed }) => [
          styles.avatarContainer, 
          esClaro && styles.avatarClaro,
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
            color={
              esClaro 
                ? paletaColores.primaryHover
                : paletaColores.textoSecundario
            } 
          />
        )}
        <View style={styles.badgeCamara}>
          <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
        </View>
      </Pressable>

      <View style={styles.info}>
        <Text
          style={[
            styles.titulo,
            esClaro && styles.tituloClaro,
          ]}
        >
          {titulo}
        </Text>

        <Text
          style={[
            styles.descripcion,
            esClaro && styles.descripcionClara,
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
            color={paletaColores.primary} 
          />
          <Text style={styles.botonTexto}>{fotoUri ? "Cambiar foto" : "Elegir foto de galería"}</Text>
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
    backgroundColor: paletaColores.surface,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    padding: 15,
    borderRadius: 16,
    gap: 16,
  },
  cardClaro: {
    backgroundColor: paletaColores.superficieClara,
    borderColor: paletaColores.bordeClaro,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.surfaceElevated,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
  },
  avatarClaro: {
    backgroundColor: "#EAF5EF",
    borderColor: "#C4E5D1",
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
    backgroundColor: paletaColores.primary,
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
    color: paletaColores.texto,
    fontSize: 15,
    fontWeight: "700",
  },
  tituloClaro: {
    color: paletaColores.textoClaro,
  },
  descripcion: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    lineHeight: 18,
  },
  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
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
    color: paletaColores.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  presionado: {
    opacity: 0.7,
  },
});
