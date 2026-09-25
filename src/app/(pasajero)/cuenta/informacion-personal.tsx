import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AvatarPerfil } from "@/components/cuenta/AvatarPerfil";
import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { PASAJERO_DEMO } from "@/constants/cuenta";
import { paletaColores } from "@/paletaColores";

const DATOS = [
  { etiqueta: "Nombre completo", valor: PASAJERO_DEMO.nombre },
  { etiqueta: "Correo electrónico", valor: PASAJERO_DEMO.correo },
  { etiqueta: "Número de teléfono", valor: PASAJERO_DEMO.telefono },
  { etiqueta: "Fecha de nacimiento", valor: PASAJERO_DEMO.fechaNacimiento },
  { etiqueta: "Género", valor: PASAJERO_DEMO.genero },
];

export default function InformacionPersonal() {
  const [foto, setFoto] = useState<string | null>(null);

  const elegirFoto = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <EncabezadoPantalla titulo="Información personal" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <Pressable style={styles.fila} onPress={elegirFoto}>
          <AvatarPerfil nombre={PASAJERO_DEMO.nombre} tamano={44} uri={foto} />
          <Text style={styles.etiquetaFoto}>Foto de perfil</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={paletaColores.textoSecundarioClaro}
          />
        </Pressable>

        {DATOS.map((dato) => (
          <View key={dato.etiqueta} style={styles.fila}>
            <View style={styles.textos}>
              <Text style={styles.etiqueta}>{dato.etiqueta}</Text>
              <Text style={styles.valor}>{dato.valor}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={paletaColores.textoSecundarioClaro}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paletaColores.bordeClaro,
  },

  etiquetaFoto: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  textos: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  valor: {
    marginTop: 2,
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
  },
});
