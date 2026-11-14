export interface DireccionGeocodificada {
  nombreLegible: string;
  calle: string;
  barrio: string;
  ciudad: string;
  coordenadas: { lat: number; lon: number };
}

const USER_AGENT = "AltokkeMovil-Bagua/1.0 (contacto@altokke.pe)";

// Caché en memoria para evitar saturar peticiones en sitios frecuentes
const geocodeCache = new Map<string, DireccionGeocodificada>();

/**
 * Servicio de geocodificación inversa 100% gratuito (sin tarjeta bancaria).
 * Emplea Photon (Komoot) con fallback en OpenStreetMap Nominatim.
 */
export async function obtenerDireccionInversa(
  lat: number,
  lon: number
): Promise<DireccionGeocodificada> {
  const claveCache = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache.has(claveCache)) {
    const enCache = geocodeCache.get(claveCache);
    if (enCache) return enCache;
  }

  // 1. Intento primario: Photon Komoot (ElasticSearch OSM, alta tolerancia a tildes)
  const controllerPhoton = new AbortController();
  const timeoutPhoton = setTimeout(() => controllerPhoton.abort(), 4000);
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`,
      {
        headers: { Accept: "application/json" },
        signal: controllerPhoton.signal,
      }
    );
    clearTimeout(timeoutPhoton);
    if (res.ok) {
      const data = await res.json();
      if (data?.features && data.features.length > 0) {
        const props = data.features[0].properties || {};
        const calle = props.street || props.name || "Calle sin nombre";
        const barrio = props.district || props.suburb || "Bagua";
        const resultado: DireccionGeocodificada = {
          nombreLegible: `${calle}, ${barrio}`,
          calle,
          barrio,
          ciudad: props.city || "Bagua",
          coordenadas: { lat, lon },
        };
        geocodeCache.set(claveCache, resultado);
        return resultado;
      }
    }
  } catch (err) {
    clearTimeout(timeoutPhoton);
    console.warn("Photon no disponible, activando fallback Nominatim:", err);
  }

  // 2. Intento secundario: OpenStreetMap Nominatim con User-Agent institucional
  const controllerNominatim = new AbortController();
  const timeoutNominatim = setTimeout(() => controllerNominatim.abort(), 4000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        signal: controllerNominatim.signal,
      }
    );
    clearTimeout(timeoutNominatim);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const calle = addr.road || addr.pedestrian || addr.suburb || (data.display_name ? data.display_name.split(",")[0] : "Punto en Bagua");
      const barrio = addr.neighbourhood || addr.suburb || "Bagua";
      const resultado: DireccionGeocodificada = {
        nombreLegible: `${calle}, ${barrio}`,
        calle: calle || "Bagua",
        barrio,
        ciudad: addr.city || addr.town || "Bagua",
        coordenadas: { lat, lon },
      };
      geocodeCache.set(claveCache, resultado);
      return resultado;
    }
  } catch (err) {
    clearTimeout(timeoutNominatim);
    console.warn("Nominatim no disponible, utilizando coordenadas de respaldo:", err);
  }

  // Fallback garantizado sin red
  return {
    nombreLegible: `Punto GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    calle: "Ubicación en mapa",
    barrio: "Bagua",
    ciudad: "Bagua",
    coordenadas: { lat, lon },
  };
}
