import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

/**
 * Banner flotante de aviso de pérdida de señal para Altokke Móvil.
 * Informa al pasajero y conductor si se interrumpe la cobertura en Bagua.
 */
export function BannerSinConexion() {
  const { sinConexion, reverificar } = useNetworkStatus();
  const { colores, esOscuro } = useAltokkeTheme();
  const [verificando, setVerificando] = useState(false);

  if (!sinConexion) return null;

  const handleReverificar = async () => {
    setVerificando(true);
    try {
      await reverificar();
    } finally {
      setVerificando(false);
    }
  };

  return (
    <View
      style={[
        styles.contenedor,
        {
          backgroundColor: esOscuro ? "#382323" : "#F6EDED",
          borderColor: esOscuro ? "#FF8383" : "#B42323",
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="Sin conexión a internet"
    >
      <View style={styles.filaInfo}>
        <Ionicons
          name="cloud-offline-outline"
          size={20}
          color={esOscuro ? "#FF8383" : "#B42323"}
        />
        <View style={styles.textos}>
          <Text
            style={[
              styles.titulo,
              { color: esOscuro ? "#FF8383" : "#B42323" },
            ]}
          >
            Sin conexión a internet
          </Text>
          <Text
            style={[
              styles.descripcion,
              { color: esOscuro ? "#F4F7F5" : "#121A15" },
            ]}
          >
            Reconectando automáticamente con Altokke...
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleReverificar}
        disabled={verificando}
        style={({ pressed }) => [
          styles.botonReintentar,
          {
            backgroundColor: esOscuro ? "#FF8383" : "#B42323",
            opacity: pressed || verificando ? 0.7 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Reintentar conexión"
      >
        {verificando ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBoton}>Reintentar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
  },
  filaInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  textos: {
    marginLeft: 10,
    flex: 1,
  },
  titulo: {
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
  },
  descripcion: {
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  botonReintentar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBoton: {
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    color: "#FFFFFF",
  },
});
