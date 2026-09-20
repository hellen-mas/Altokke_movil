import type { StyleProp, ViewStyle } from "react-native";

export interface PuntoMapa {
  latitude: number;
  longitude: number;
}

export interface MapaBaseProps {
  /** Punto sobre el que se centra el mapa al abrirse */
  centro: PuntoMapa;
  /** Ubicación del pasajero (si no se indica, se usa el centro) */
  origen?: PuntoMapa;
  destino?: PuntoMapa;
  /** Puntos de la ruta entre origen y destino */
  ruta?: PuntoMapa[];
  conductores?: PuntoMapa[];
  /** false = el mapa es solo de vista (por ejemplo dentro de un ScrollView) */
  interactivo?: boolean;
  style?: StyleProp<ViewStyle>;
}
