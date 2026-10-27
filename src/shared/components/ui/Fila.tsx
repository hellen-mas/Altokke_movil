
import {
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";

interface FilaProps extends ViewProps {
  espacio?: "between" | "center" | "start" | "end";
  gap?: number;
}

const alineaciones = {
  between: "space-between",
  center: "center",
  start: "flex-start",
  end: "flex-end",
} as const;

export function Fila({
  children,
  espacio = "between",
  gap = 8,
  style,
  ...props
}: FilaProps) {
  return (
    <View
      {...props}
      style={[
        styles.fila,
        {
          justifyContent: alineaciones[espacio],
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
  },
});
