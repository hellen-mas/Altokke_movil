import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface RoleCardProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

export function RoleCard({
  title,
  subtitle,
  iconName,
  selected,
  onPress,
}: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        selected ? styles.cardSelected : styles.cardUnselected,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          selected
            ? styles.iconContainerSelected
            : styles.iconContainerUnselected,
        ]}
      >
        <Ionicons
          name={iconName}
          size={24}
          color={selected ? paletaColores.boton : paletaColores.textoSecundario}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.checkContainer}>
        {selected ? (
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={paletaColores.boton}
          />
        ) : (
          <Ionicons
            name="ellipse-outline"
            size={28}
            color={paletaColores.textoSecundario}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardSelected: {
    borderColor: paletaColores.boton,
    backgroundColor: "rgba(53, 233, 130, 0.05)",
  },
  cardUnselected: {
    borderColor: paletaColores.borde,
    backgroundColor: "transparent",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerSelected: {
    backgroundColor: "rgba(53, 233, 130, 0.15)",
  },
  iconContainerUnselected: {
    backgroundColor: "rgba(70, 97, 87, 0.2)",
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  title: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
  },
  checkContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
