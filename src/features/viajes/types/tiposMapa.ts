import type { StyleProp, ViewStyle } from "react-native";

export interface PuntoMapa {
  latitude: number;
  longitude: number;
}

export interface MapaBaseProps {
  centro: PuntoMapa;
  origen?: PuntoMapa;
  ubicacionActual?: PuntoMapa | null;
  onSeleccionarPunto?: (coordenadas: PuntoMapa) => void;
  destino?: PuntoMapa;
  ruta?: PuntoMapa[];
  conductores?: PuntoMapa[];
  interactivo?: boolean;
  margenInferior?: number;
  style?: StyleProp<ViewStyle>;
}
