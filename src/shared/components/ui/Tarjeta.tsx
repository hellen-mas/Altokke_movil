
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { StyleSheet, View, type ViewProps } from "react-native";

export function Tarjeta({ children, style, ...props }: ViewProps) {
  const { colores } = useAltokkeTheme();

  return (
    <View
      {...props}
      style={[
        styles.tarjeta,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.linea,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
});
