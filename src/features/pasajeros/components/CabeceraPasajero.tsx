
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { 
  Image, 
  Pressable, 
  StyleSheet, 
  Text, 
  View } 
from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  titulo?: string;
  subtitulo?: string;
  paddingInferior?: number;
  children?: ReactNode;
  hayNotificaciones?: boolean;
}

export function CabeceraPasajero({
  titulo,
  subtitulo,
  paddingInferior = 14,
  children,
  hayNotificaciones = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useAltokkeTheme();

  const fondoMarca = esOscuro
    ? colores.superficie
    : "#33875F";

  return (
    <View style={{ backgroundColor: colores.fondo }}>

      {/* Barra de marca */}
      <View
        style={[
          styles.barraMarca,
          {
            paddingTop: insets.top + 8,
            backgroundColor: fondoMarca,
          },
        ]}
      >
        <View style={styles.identidad}>
          <Image
            source={require("@/assets/images/logo-altokke-v2.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.nombreMarca,
              { color: esOscuro ? colores.texto : "#FFFFFF" },
            ]}
          >
            altokke
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/notificaciones")}
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          hitSlop={8}
          style={({ pressed }) => [
            styles.botonNotificaciones,
            {
              backgroundColor: esOscuro
                ? colores.campo
                : "rgba(255,255,255,0.14)",
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={21}
            color={esOscuro ? colores.texto : "#FFFFFF"}
          />

          {hayNotificaciones && (
            <View
              style={[
                styles.indicadorNotificacion,
                {
                  backgroundColor: colores.error,
                  borderColor: fondoMarca,
                },
              ]}
            />
          )}
        </Pressable>
      </View>

      {/* Saludo del pasajero*/}
      {(titulo || subtitulo || children) && (
          <View
            style={[
              styles.contenido,
              { paddingBottom: paddingInferior },
            ]}
          >
            {titulo && (
              <Text
                style={[
                  styles.titulo,
                  { color: colores.texto },
                ]}
                numberOfLines={2}
              >
                {titulo}
              </Text>
            )}

            {subtitulo && (
              <Text
                style={[
                  styles.subtitulo,
                  { color: colores.secundario },
                ]}
              >
                {subtitulo}
              </Text>
            )}

            {children}

            <View
              style={[
                styles.acento,
                { backgroundColor: colores.primario },
              ]}
            />
          </View>
          )}
        </View>
  );
}

const styles = StyleSheet.create({
  barraMarca: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 60,
  },

  identidad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
  },

  logo: {
    width: 34,
    height: 34,
  },

  nombreMarca: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.9,
  },

  botonNotificaciones: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  indicadorNotificacion: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },

  contenido: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 30,
  },

  subtitulo: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  acento: {
    width: 32,
    height: 3,
    borderRadius: 999,
    marginTop: 14,
  },
});
