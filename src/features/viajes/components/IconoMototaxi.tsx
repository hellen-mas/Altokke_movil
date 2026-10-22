import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  size?: number;
  color: string;
}

export function IconoMototaxi({ size = 24, color }: Props) {
  return <MaterialCommunityIcons name="rickshaw" size={size} color={color} />;
}
