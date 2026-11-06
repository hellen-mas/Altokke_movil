import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  CATEGORIAS_AYUDA,
  ARTICULOS_AYUDA,
} from "@/features/soporte/data/centroAyuda";

export default function Ayuda() {
  const { colores, esOscuro } = useAltokkeTheme();
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState("");

  const temasFiltrados = CATEGORIAS_AYUDA.filter((categoria) => {
    const articulos = ARTICULOS_AYUDA.filter(
      (articulo) => articulo.categoriaId === categoria.id
    );

    const texto = [
      categoria.titulo,
      categoria.descripcion,
      ...categoria.secciones.map((seccion) => seccion.titulo),
      ...articulos.map((articulo) => articulo.titulo),
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(busqueda.trim().toLowerCase());
  });

  const contactarWhatsApp = () => {
    const mensaje = encodeURIComponent(
      "Hola equipo Altokke, necesito asistencia con un viaje o mi cuenta de pasajero."
    );
    const url = `https://wa.me/51913714910?text=${mensaje}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Soporte Altokke", "Comunícate directamente a nuestra central: +51 913 714 910.");
        }
      })
      .catch(() => {
        Alert.alert("Soporte Altokke", "Llama a nuestra central: +51 913 714 910.");
      });
  };

  const contactarSoporte = () => {
    Alert.alert("Canales de Soporte", "¿Cómo prefieres comunicarte con nuestro equipo?", [
      {
        text: "WhatsApp Soporte (Inmediato)",
        onPress: contactarWhatsApp,
      },
      {
        text: "Llamada Telefónica",
        onPress: () => Linking.openURL("tel:+51913714910").catch(() => {}),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: colores.fondo },
      ]}
    >
      <StatusBar style={esOscuro ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contenido,
          { paddingTop: insets.top + 20 },
        ]}
      >
        {/* Encabezado principal de pestaña */}
        <View style={styles.encabezado}>
          <Text
            style={[
              styles.tituloPrincipal,
              { color: colores.texto },
            ]}
          >
            Ayuda
          </Text>
        </View>

        <Text
          style={[
            styles.subtituloPrincipal,
            { color: colores.secundario },
          ]}
        >
          ¿En qué podemos ayudarte?
        </Text>

        {/* Buscar ayuda */}
        <View
          style={[
            styles.buscador,
            {
              backgroundColor: colores.campo,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colores.secundario}
          />
          <TextInput
             style={[
                styles.inputBusqueda,
                { color: colores.textoCampo },
              ]}
              placeholder="Buscar una pregunta o tema..."
              placeholderTextColor={colores.secundario}
              value={busqueda}
              onChangeText={setBusqueda}
              autoCorrect={false}
              returnKeyType="search"
          />

          {busqueda.length > 0 && (
            <Pressable 
              onPress={() => setBusqueda("")}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <Ionicons name="close-circle" size={19} color={colores.secundario} />
            </Pressable>
          )}
        </View>

        {/* Temas frecuentes */}
        <Text style={[styles.seccion, { color: colores.secundario }]}>
          TEMAS FRECUETES 
        </Text>

        {temasFiltrados.length === 0 ? (
          <View style={styles.sinResultadosCaja}>
            <Ionicons
              name="search-outline"
              size={28}
              color={colores.secundario}
            />

            <Text
              style={[
                styles.sinResultados,
                { color: colores.secundario },
              ]}
            >
              No encontramos resultados. Prueba con otras
              palabras o contacta a soporte.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.listaTemas,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            {temasFiltrados.map((tema, index) => (
              <View key={tema.id}>
                <Pressable
                  onPress={() => 
                    router.push({
                      pathname: "/ayuda/[categoria]",
                      params: { categoria: tema.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={tema.titulo}
                  style={({ pressed }) => [
                    styles.filaTema,
                    pressed && {
                      backgroundColor: colores.campo,
                    },
                  ]}
                >

                  <View
                    style={[
                      styles.iconoTema,
                      {
                        backgroundColor: colores.exitoFondo,
                      },
                    ]}
                  >
                    <Ionicons
                      name={tema.icono}
                      size={21}
                      color={colores.exitoTexto}
                    />
                  </View>

                  <View style={styles.textosTema}>
                    <Text
                      style={[
                        styles.tituloTema,
                        { color: colores.texto },
                      ]}
                    >
                      {tema.titulo}
                    </Text>

                    <Text
                      style={[
                        styles.descripcionTema,
                        { color: colores.secundario },
                      ]}
                      numberOfLines={2}
                    >
                      {tema.descripcion}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colores.secundario}
                  />
                </Pressable>
                
                {index !== temasFiltrados.length - 1 && (
                  <View
                    style={[
                      styles.separador,
                      { backgroundColor: colores.linea },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Contacto con soporte */}
        <View style={styles.tarjetaSoporte}>
          <View style={styles.filaSoporteTitulo}>
            <Ionicons
              name="chatbubbles-outline"
              size={24}
              color="#83D5AA"
            />

            <Text style={styles.tituloSoporte}>
              ¿Necesitas más ayuda?
            </Text>
          </View>

          <Text style={styles.descripcionSoporte}>
            Comunícate con nuestro equipo por WhatsApp
            o teléfono.
          </Text>

          <Pressable
            onPress={contactarSoporte}
            accessibilityRole="button"
            accessibilityLabel="Contactar soporte"
            style={({ pressed }) => [
              styles.botonSoporte,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color="#0B3B2A"
            />

            <Text style={styles.textoBotonSoporte}>
              Contactar soporte
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
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tituloPrincipal: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  subtituloPrincipal: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 22,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 15,
    borderRadius: 15,
  },

  inputBusqueda: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },

  seccion: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },

  listaTemas: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  filaTema: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  iconoTema: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  textosTema: {
    flex: 1,
    gap: 4,
  },

  tituloTema: {
    fontSize: 14,
    fontWeight: "600",
  },

  descripcionTema: {
    fontSize: 12,
    lineHeight: 17,
  },

  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 69,
    marginRight: 15,
  },

  sinResultadosCaja: {
    paddingVertical: 35,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },

  sinResultados: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  tarjetaSoporte: {
    backgroundColor: "#0B3B2A",
    padding: 20,
    borderRadius: 20,
    marginTop: 26,
    gap: 13,
  },

  filaSoporteTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tituloSoporte: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  descripcionSoporte: {
    color: "#D4E9DD",
    fontSize: 13,
    lineHeight: 20,
  },

  botonSoporte: {
    backgroundColor: "#FFFFFF",
    minHeight: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 4,
  },

  textoBotonSoporte: {
    color: "#0B3B2A",
    fontSize: 14,
    fontWeight: "700",
  },

  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalCaja: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },

  cabeceraModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  modalTitulo: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
  },

  preguntaBloque: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 7,
  },

  preguntaTexto: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  respuestaTexto: {
    fontSize: 13,
    lineHeight: 20,
  },

  botonCerrarModal: {
    minHeight: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  textoCerrarModal: {
    fontSize: 14,
    fontWeight: "700",
  },
});
