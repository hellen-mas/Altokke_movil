
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  obtenerArticulo,
  obtenerCategoria,
} from "@/features/soporte/data/centroAyuda";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TituloAltokke } from "@/shared/components/ui/TituloAltokke";

export default function CategoriaAyuda() {
  const { categoria: categoriaParam } =
    useLocalSearchParams<{ categoria: string }>();

  const { colores } = useAltokkeTheme();
  const insets = useSafeAreaInsets();

  const categoria = obtenerCategoria(categoriaParam);

  if (!categoria) {
    return (
      <View
        style={[
          styles.pantalla,
          styles.centrado,
          { backgroundColor: colores.fondo },
        ]}
      >
        <Text style={{ color: colores.texto }}>
          No encontramos esta categoría.
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
          accessibilityLabel="Volver a Ayuda"
          style={styles.volver}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colores.texto}
          />
        </Pressable>

        <TituloAltokke
            texto={categoria.titulo}
            style={styles.titulo}
        />

        <Text
          style={[
            styles.descripcion,
            { color: colores.secundario },
          ]}
        >
          {categoria.descripcion}
        </Text>

        {categoria.secciones.map((seccion) => (
          <View key={seccion.titulo} style={styles.grupo}>
            <Text
              style={[
                styles.tituloGrupo,
                { color: colores.secundario },
              ]}
            >
              {seccion.titulo.toUpperCase()}
            </Text>

            <View
              style={[
                styles.tarjeta,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.linea,
                },
              ]}
            >
              {seccion.articulos.map((id, index) => {
                const articulo = obtenerArticulo(id);
                if (!articulo) return null;

                return (
                  <View key={id}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/ayuda/articulo/[id]",
                          params: { id },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={articulo.titulo}
                      style={({ pressed }) => [
                        styles.fila,
                        pressed && {
                          backgroundColor: colores.campo,
                        },
                      ]}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color={colores.exitoTexto}
                      />

                      <Text
                        style={[
                          styles.nombreArticulo,
                          { color: colores.texto },
                        ]}
                      >
                        {articulo.titulo}
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colores.secundario}
                      />
                    </Pressable>

                    {index !== seccion.articulos.length - 1 && (
                      <View
                        style={[
                          styles.separador,
                          { backgroundColor: colores.linea },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
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
    paddingBottom: 40,
  },
  volver: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginBottom: 12,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 28,
  },
  grupo: {
    marginBottom: 24,
    gap: 10,
  },
  tituloGrupo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 62,
  },
  nombreArticulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
    marginRight: 16,
  },
});
