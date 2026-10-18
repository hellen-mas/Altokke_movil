import { paletaColores } from "@/paletaColores";
import { seleccionarFotoGaleria } from "@/utils/avatar";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

export interface SelectorFotoPerfilProps {
  fotoUri: string | null;
  alCambiarFoto: (uri: string, base64?: string | null) => void;
  titulo?: string;
  descripcion?: string;
}

export function SelectorFotoPerfil({
  fotoUri,
  alCambiarFoto,
  titulo = "Foto de perfil",
  descripcion = "Una foto clara de tu rostro ayuda a que el mototaxista te identifique fácilmente.",
}: SelectorFotoPerfilProps) {
  const elegirFoto = async () => {
    try {
      const res = await seleccionarFotoGaleria();
      if (res) {
        alCambiarFoto(res.uri, res.base64 || null);
      }
    } catch (err: any) {
      Alert.alert("Foto de perfil", err?.message || "No se pudo seleccionar la imagen.");
    }
  };

  return (
    <View style={styles.card}>
      <Pressable style={({ pressed }) => [styles.avatarContainer, pressed && { opacity: 0.8 }]} onPress={elegirFoto}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.foto} />
        ) : (
          <Ionicons name="person" size={32} color={paletaColores.textoSecundario} />
        )}
        <View style={styles.badgeCamara}>
          <Ionicons name="camera" size={13} color="#0B1A12" />
        </View>
      </Pressable>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{titulo}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipTexto}>Recomendado</Text>
          </View>
        </View>
        <Text style={styles.descripcion}>{descripcion}</Text>
        <Pressable style={({ pressed }) => [styles.boton, pressed && { opacity: 0.7 }]} onPress={elegirFoto}>
          <Ionicons name={fotoUri ? "checkmark-circle" : "image-outline"} size={16} color={paletaColores.boton} />
          <Text style={styles.botonTexto}>{fotoUri ? "Cambiar foto" : "Elegir foto de galería"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paletaColores.input,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    gap: 14,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#13231B",
    borderWidth: 2,
    borderColor: paletaColores.boton,
  },
  foto: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  badgeCamara: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: paletaColores.boton,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: paletaColores.fondo,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  chip: {
    backgroundColor: "rgba(46, 206, 121, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(46, 206, 121, 0.3)",
  },
  chipTexto: {
    color: paletaColores.boton,
    fontSize: 12,
    fontWeight: "700",
  },
  descripcion: {
    color: "#C2D4CB",
    fontSize: 13.5,
    lineHeight: 18,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    paddingVertical: 4,
  },
  botonTexto: {
    color: paletaColores.boton,
    fontSize: 15,
    fontWeight: "700",
  },
});
