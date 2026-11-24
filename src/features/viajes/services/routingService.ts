export interface CoordenadaPunto {
  latitude: number;
  longitude: number;
}

export interface ResultadoRutaMototaxi {
  coordenadasRuta: CoordenadaPunto[];
  distanciaMetros: number;
  distanciaKm: number;
  duracionEstimadaMinutos: number;
  tarifaSugeridaPen: number;
}

/**
 * Servicio de trazado de rutas viales reales para mototaxis en Bagua.
 * Emplea OSRM público con reintento automático y fallback euclidiano resiliente.
 */
export async function calcularRutaMototaxi(
  origen: CoordenadaPunto,
  destino: CoordenadaPunto
): Promise<ResultadoRutaMototaxi> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.longitude},${origen.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson&steps=false`;

  const intentarPeticion = async (timeoutMs: number): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const respuesta = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!respuesta.ok) {
        throw new Error(`Servidor OSRM HTTP ${respuesta.status}`);
      }
      return await respuesta.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  try {
    let data: any = null;
    try {
      data = await intentarPeticion(5000);
    } catch (primerError) {
      console.warn("Reintentando consulta a OSRM tras fallo inicial:", primerError);
      await new Promise((resolve) => setTimeout(resolve, 600));
      data = await intentarPeticion(4000);
    }

    if (!data?.routes || data.routes.length === 0) {
      throw new Error("No se encontró una ruta vial conectada.");
    }

    const ruta = data.routes[0];
    const distanciaMetros = Number(ruta.distance || 0);
    const distanciaKm = Number((distanciaMetros / 1000).toFixed(2));

    // Calibración mototaxis en Bagua: 22 km/h promedio + 2 min espera
    const duracionEstimadaMinutos = Math.max(3, Math.ceil(distanciaKm / (22 / 60)) + 2);

    // Tarifa referencial de mototaxi en Bagua
    const tarifaSugeridaPen = distanciaKm <= 1.5
      ? 3.00
      : Number((3.00 + (distanciaKm - 1.5) * 1.50).toFixed(2));

    const coordenadasRuta: CoordenadaPunto[] = (ruta.geometry?.coordinates || []).map(
      (coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })
    );

    return {
      coordenadasRuta,
      distanciaMetros,
      distanciaKm,
      duracionEstimadaMinutos,
      tarifaSugeridaPen,
    };
  } catch (err) {
    console.warn("Fallo persistente al consultar OSRM, generando ruta de respaldo:", err);

    // Fallback euclidiano seguro si el servidor público tiene micro-corte
    const distAproxKm = Number(
      (Math.sqrt(
        Math.pow((destino.latitude - origen.latitude) * 111.0, 2) +
        Math.pow((destino.longitude - origen.longitude) * 111.0, 2)
      )).toFixed(2)
    );

    return {
      coordenadasRuta: [origen, destino],
      distanciaMetros: Math.round(distAproxKm * 1000),
      distanciaKm: distAproxKm,
      duracionEstimadaMinutos: Math.max(4, Math.ceil(distAproxKm * 3)),
      tarifaSugeridaPen: Math.max(3.00, Number((2.00 + distAproxKm * 2.26).toFixed(2))),
    };
  }
}
