import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";

interface Props {
  title?: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BarraNavegacionSuperior({
  title = "Altokke",
  onBack,
  rightComponent,
  style
}: Props) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.headerTop, style]}>
      <Pressable onPress={handleBack} style={styles.backButton} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={paletaColores.texto} />
      </Pressable>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <View style={styles.rightContainer}>
        {rightComponent ? rightComponent : <View style={{ width: 24 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: '700',
    color: paletaColores.texto,
  },
  rightContainer: {
    width: 80, // Allow enough space for right components like step indicators
    alignItems: 'flex-end',
  }
});
