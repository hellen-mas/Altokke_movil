import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { IdMetodoPago, METODOS_PAGO } from "@/features/pasajeros/constants/cuenta";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

function LogoMetodo({ id, colorBoton }: { id: IdMetodoPago; colorBoton: string }) {
  if (id === "efectivo") {
    return (
      <View style={[styles.logo, { backgroundColor: colorBoton }]}>
        <Ionicons name="cash-outline" size={22} color="#FFFFFF" />
      </View>
    );
  }

  const esYape = id === "yape";

  return (
    <View
      style={[styles.logo, { backgroundColor: esYape ? "#742284" : "#00C2CB" }]}
    >
      <Text style={styles.textoLogo}>{esYape ? "yape" : "plin"}</Text>
    </View>
  );
}

export default function MetodosPago() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { metodoPago, setMetodoPago } = useViaje();
  const { perfil, guardarPreferencias } = usePerfilPasajero();

  const metodoActivo = metodoPago || (perfil?.preferencias?.metodo_pago as IdMetodoPago) || "efectivo";

  useEffect(() => {
    if (perfil?.preferencias?.metodo_pago && perfil.preferencias.metodo_pago !== metodoPago) {
      setMetodoPago(perfil.preferencias.metodo_pago as any);
    }
  }, [perfil]);

  const seleccionarMetodo = async (id: IdMetodoPago) => {
    setMetodoPago(id);
    if (userId) {
      try {
        await guardarPreferencias({ metodo_pago: id });
      } catch (err) {
        console.warn("Aviso al guardar método de pago:", err);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Métodos de pago" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {METODOS_PAGO.map((metodo) => {
          const esPrincipal = metodo.id === metodoActivo;

          return (
            <Pressable
              key={metodo.id}
              style={({ pressed }) => [
                styles.fila,
                { borderBottomColor: colores.linea },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => seleccionarMetodo(metodo.id)}
              hitSlop={6}
              accessibilityRole="radio"
              accessibilityState={{ checked: esPrincipal }}
            >
              <LogoMetodo id={metodo.id} colorBoton={colores.primario} />

              <View style={styles.textos}>
                <Text style={[styles.nombre, { color: colores.texto }]}>{metodo.nombre}</Text>
                <Text style={[styles.descripcion, { color: colores.secundario }]}>{metodo.descripcion}</Text>
              </View>

              {esPrincipal && (
                <View style={[styles.insignia, { backgroundColor: colores.exitoFondo }]}>
                  <Text style={[styles.textoInsignia, { color: colores.exitoTexto }]}>Predeterminado</Text>
                </View>
              )}

              <Ionicons
                name={esPrincipal ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={
                  esPrincipal
                    ? colores.exitoTexto
                    : colores.secundario
                }
              />
            </Pressable>
          );
        })}

        <Text style={[styles.aviso, { color: colores.secundario }]}>
          El método seleccionado se usará de forma predeterminada al solicitar tus viajes en mototaxi. Puedes cambiarlo en cualquier momento.
        </Text>
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
    paddingBottom: 30,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textoLogo: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  textos: {
    flex: 1,
  },

  nombre: {
    fontSize: 15,
    fontWeight: "600",
  },

  descripcion: {
    marginTop: 2,
    fontSize: 12,
  },

  insignia: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  textoInsignia: {
    fontSize: 11,
    fontWeight: "700",
  },

  aviso: {
    marginTop: 20,
    fontSize: 13,
    lineHeight: 18,
  },
});
