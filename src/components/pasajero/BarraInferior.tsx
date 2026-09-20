import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { paletaColores } from "@/paletaColores";

type Seccion = "inicio" | "actividad" | "ayuda" | "cuenta";

interface Props {
  activa: Seccion;
}

const SECCIONES: {
  id: Seccion;
  titulo: string;
  icono: keyof typeof Ionicons.glyphMap;
  iconoActivo: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "inicio", titulo: "Inicio", icono: "home-outline", iconoActivo: "home" },
  { id: "actividad", titulo: "Actividad", icono: "time-outline", iconoActivo: "time" },
  { id: "ayuda", titulo: "Ayuda", icono: "help-circle-outline", iconoActivo: "help-circle" },
  { id: "cuenta", titulo: "Cuenta", icono: "person-outline", iconoActivo: "person" },
];

export function BarraInferior({ activa }: Props) {
  const insets = useSafeAreaInsets();

  const irA = (seccion: Seccion) => {
    if (seccion === activa) return;

    if (seccion === "inicio") {
      router.replace("/mapa");
    } else if (seccion === "actividad") {
      router.replace("/actividad");
    }
    // Ayuda y Cuenta las desarrollan otros integrantes del equipo
  };

  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {SECCIONES.map((seccion) => {
        const esActiva = seccion.id === activa;
        const color = esActiva
          ? paletaColores.boton
          : paletaColores.textoSecundarioClaro;

        return (
          <Pressable
            key={seccion.id}
            style={styles.item}
            onPress={() => irA(seccion.id)}
          >
            <Ionicons
              name={esActiva ? seccion.iconoActivo : seccion.icono}
              size={24}
              color={color}
            />
            <Text style={[styles.titulo, { color }]}>{seccion.titulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    paddingTop: 10,
    backgroundColor: paletaColores.superficieClara,
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
  },

  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },

  titulo: {
    fontSize: 12,
    fontWeight: "600",
  },
});
