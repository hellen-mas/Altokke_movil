import { useTemaConductor } from "@/features/conductores/theme/temaConductor";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { crearEstilos } from "../screens/inicio.styles";

export function AccesosRapidosConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);

  return (
    <>
      <View style={styles.seccionEncabezado}>
        <Text style={styles.seccionTitulo}>Accesos rápidos</Text>
      </View>

      <View style={styles.accesos}>
        <Pressable
          style={styles.accesoItem}
          onPress={() => router.push("/(conductor)/billetera")}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.accesoIcono,
              { backgroundColor: c.primarioSuave },
            ]}
          >
            <Ionicons name="wallet-outline" size={23} color={c.primario} />
          </View>
          <Text style={styles.accesoTexto}>Billetera</Text>
        </Pressable>

        <Pressable
          style={styles.accesoItem}
          onPress={() => router.push("/(conductor)/solicitudes")}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.accesoIcono,
              { backgroundColor: c.superficieSuave },
            ]}
          >
            <Ionicons name="receipt-outline" size={23} color={c.primario} />
          </View>
          <Text style={styles.accesoTexto}>Solicitudes</Text>
        </Pressable>

        <Pressable
          style={styles.accesoItem}
          onPress={() => router.push("/(conductor)/cuenta/vehiculo")}
          accessibilityRole="button"
        >
          <View
            style={[styles.accesoIcono, { backgroundColor: c.ambarSuave }]}
          >
            <Ionicons name="car-sport-outline" size={23} color={c.primario} />
          </View>
          <Text style={styles.accesoTexto}>Vehículo</Text>
        </Pressable>

        <Pressable
          style={styles.accesoItem}
          onPress={() => router.push("/(conductor)/cuenta")}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.accesoIcono,
              { backgroundColor: c.primarioSuave },
            ]}
          >
            <Ionicons name="person-outline" size={23} color={c.primario} />
          </View>
          <Text style={styles.accesoTexto}>Cuenta</Text>
        </Pressable>
      </View>
    </>
  );
}
