import { useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type { MapaBaseProps } from "@/features/viajes/types/tiposMapa";
import { MapaGoogle } from "./MapaGoogle";
import { MapaMapLibre } from "./MapaMapLibre";

// En Expo Go los mosaicos de Google Maps no cargan en Android sin clave de desarrollo.
// En producción se usa Google Maps con fallback automático a MapLibre ante micro-cortes.
const EN_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function MapaBase(props: MapaBaseProps) {
  const [falloGoogle, setFalloGoogle] = useState(false);

  if (EN_EXPO_GO || falloGoogle) {
    return <MapaMapLibre {...props} />;
  }

  return (
    <MapaGoogle
      {...props}
      onError={() => {
        console.warn("Fallo detectado en Google Maps: activando fallback vectorial MapLibre.");
        setFalloGoogle(true);
        props.onError?.();
      }}
    />
  );
}
