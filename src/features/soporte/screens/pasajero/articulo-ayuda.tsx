
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  obtenerArticulo,
  obtenerCategoria,
} from "@/features/soporte/data/centroAyuda";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { TituloAltokke } from "@/shared/components/ui/TituloAltokke";

export default function ArticuloAyuda() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colores } = useAltokkeTheme();
  const insets = useSafeAreaInsets();

  const articulo = obtenerArticulo(id);
  const categoria = articulo
    ? obtenerCategoria(articulo.categoriaId)
    : null;

  const contactarSoporte = async () => {
    if (!articulo) return;

    const mensaje = encodeURIComponent(
      `Hola, equipo Altokke. Necesito ayuda con: ${articulo.titulo}.`
    );

    const url = `https://wa.me/51913714910?text=${mensaje}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "No se pudo abrir WhatsApp",
        "Puedes intentar contactar al equipo de soporte desde la pestaña Ayuda."
      );
    }
  };

  if (!articulo) {
    return (
      <View
        style={[
          styles.pantalla,
          styles.centrado,
          { backgroundColor: colores.fondo },
        ]}
      >
        <Text style={{ color: colores.texto }}>
          Este artículo no está disponible.
        </Text>

        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colores.exitoTexto }}>
            Volver
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.pantalla,
        { backgroundColor: colores.fondo },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contenido,
          { paddingTop: insets.top + 14 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver a los artículos"
          style={styles.volver}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colores.texto}
          />
        </Pressable>

        <Text
          style={[
            styles.categoria,
            { color: colores.exitoTexto },
          ]}
        >
          {categoria?.titulo || "Centro de ayuda"}
        </Text>

        <TituloAltokke
            texto={articulo.titulo}
            style={styles.titulo}
        />

        <Text
          style={[
            styles.introduccion,
            { color: colores.secundario },
          ]}
        >
          {articulo.introduccion}
        </Text>

        {articulo.pasos && articulo.pasos.length > 0 && (
          <View style={styles.seccion}>
            <Text
              style={[
                styles.subtitulo,
                { color: colores.texto },
              ]}
            >
              ¿Qué puedes hacer?
            </Text>

            {articulo.pasos.map((paso, index) => (
              <View key={index} style={styles.paso}>
                <View
                  style={[
                    styles.numero,
                    { backgroundColor: colores.exitoFondo },
                  ]}
                >
                  <Text
                    style={[
                      styles.textoNumero,
                      { color: colores.exitoTexto },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.textoPaso,
                    { color: colores.texto },
                  ]}
                >
                  {paso}
                </Text>
              </View>
            ))}
          </View>
        )}

        {articulo.recomendacion && (
          <View
            style={[
              styles.aviso,
              { backgroundColor: colores.exitoFondo },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colores.exitoTexto}
            />

            <Text
              style={[
                styles.textoAviso,
                { color: colores.texto },
              ]}
            >
              {articulo.recomendacion}
            </Text>
          </View>
        )}

        <View style={styles.contacto}>
          <Text
            style={[
              styles.contactoTitulo,
              { color: colores.texto },
            ]}
          >
            ¿Necesitas más ayuda?
          </Text>

          <Text
            style={[
              styles.contactoDescripcion,
              { color: colores.secundario },
            ]}
          >
            Puedes comunicarte con el equipo de soporte
            indicando el problema que estás consultando.
          </Text>

          <Pressable
            onPress={() => void contactarSoporte()}
            accessibilityRole="button"
            accessibilityLabel="Contactar soporte"
            style={({ pressed }) => [
              styles.boton,
              {
                backgroundColor: pressed
                  ? colores.primarioPresionado
                  : colores.primario,
              },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={19}
              color={colores.textoBoton}
            />

            <Text
              style={[
                styles.textoBoton,
                { color: colores.textoBoton },
              ]}
            >
              Contactar soporte
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  centrado: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  volver: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginBottom: 16,
  },
  categoria: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  titulo: {
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 35,
    letterSpacing: -0.4,
  },
  introduccion: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 18,
  },
  seccion: {
    marginTop: 32,
    gap: 20,
  },
  subtitulo: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 2,
  },
  paso: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },
  numero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  textoNumero: {
    fontSize: 13,
    fontWeight: "700",
  },
  textoPaso: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    paddingTop: 3,
  },
  aviso: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginTop: 28,
  },
  textoAviso: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  contacto: {
    marginTop: 34,
    gap: 12,
  },
  contactoTitulo: {
    fontSize: 18,
    fontWeight: "700",
  },
  contactoDescripcion: {
    fontSize: 13,
    lineHeight: 21,
  },
  boton: {
    minHeight: 50,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 6,
  },
  textoBoton: {
    fontSize: 14,
    fontWeight: "700",
  },
});
