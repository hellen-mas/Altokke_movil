import Constants, { ExecutionEnvironment } from "expo-constants";
import type { MapaBaseProps } from "@/features/viajes/types/tiposMapa";
import { MapaGoogle } from "./MapaGoogle";
import { MapaLeaflet } from "./MapaLeaflet";

// En Expo Go los mosaicos de Google Maps no cargan en Android (el mapa sale
// negro), así que allí se usa Leaflet. En la app compilada se usa Google Maps.
const EN_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function MapaBase(props: MapaBaseProps) {
  return EN_EXPO_GO ? <MapaLeaflet {...props} /> : <MapaGoogle {...props} />;
}
