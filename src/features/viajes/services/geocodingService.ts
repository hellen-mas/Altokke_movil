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

export interface LugarBuscado {
  id: string;
  nombre: string;
  detalle: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Búsqueda directa de lugares y direcciones para Bagua y alrededores.
 * Usa Photon Komoot (OSM) con sesgo a coordenadas de Bagua y fallback Nominatim.
 */
export async function buscarLugares(termino: string): Promise<LugarBuscado[]> {
  const query = termino.trim();
  if (!query || query.length < 2) return [];

  // 1. Intento primario: Photon con sesgo de lat/lon hacia Bagua (-5.6397, -78.5311)
  const controllerPhoton = new AbortController();
  const timeoutPhoton = setTimeout(() => controllerPhoton.abort(), 4000);

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=-5.6397&lon=-78.5311&limit=8`,
      {
        headers: { Accept: "application/json" },
        signal: controllerPhoton.signal,
      }
    );
    clearTimeout(timeoutPhoton);

    if (res.ok) {
      const data = await res.json();
      if (data?.features && Array.isArray(data.features) && data.features.length > 0) {
        return data.features.map((f: any, idx: number) => {
          const coords = f.geometry?.coordinates || [-78.5311, -5.6397];
          const props = f.properties || {};
          const nombre = props.name || props.street || query;
          const detalle = [props.street, props.district || props.suburb, props.city || "Bagua"]
            .filter(Boolean)
            .join(", ") || "Bagua, Amazonas";

          return {
            id: `photon-${props.osm_id || idx}-${coords[0]}`,
            nombre,
            detalle,
            coordenadas: {
              latitude: Number(coords[1]),
              longitude: Number(coords[0]),
            },
          };
        });
      }
    }
  } catch (err) {
    clearTimeout(timeoutPhoton);
    console.warn("Aviso al consultar Photon forward:", err);
  }

  // 2. Fallback Nominatim
  const controllerNominatim = new AbortController();
  const timeoutNominatim = setTimeout(() => controllerNominatim.abort(), 4000);

  try {
    const queryNominatim = query.toLowerCase().includes("bagua")
      ? query
      : `${query}, Bagua, Amazonas, Peru`;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        queryNominatim
      )}&limit=8&countrycodes=pe`,
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
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any, idx: number) => {
          const partes = (item.display_name || "").split(",");
          const nombre = item.name || partes[0]?.trim() || query;
          const detalle = partes.slice(1, 4).join(",").trim() || "Bagua, Amazonas";

          return {
            id: `nominatim-${item.place_id || idx}`,
            nombre,
            detalle,
            coordenadas: {
              latitude: Number(item.lat),
              longitude: Number(item.lon),
            },
          };
        });
      }
    }
  } catch (err) {
    clearTimeout(timeoutNominatim);
    console.warn("Aviso al consultar Nominatim search:", err);
  }

  return [];
}
