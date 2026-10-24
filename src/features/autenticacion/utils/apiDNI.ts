// Convierte el texto a título (primera letra de cada palabra en mayúscula)
const aTitulo = (texto: string) =>
  texto.toLowerCase().replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());

// Guardo en memoria las consultas exitosas para no repetir la consulta del mismo DNI
const cacheDni = new Map<string, { nombres: string; apellidos: string }>();
const LIMITE_CACHE_DNI = 20;

// Consulto a api.apiperu.dev por POST para traer los datos de la persona con su DNI
export async function buscarDNI(dni: string) {
  const dniLimpio = dni.trim();

  const guardado = cacheDni.get(dniLimpio);
  if (guardado) return { ...guardado };

  const token = process.env.EXPO_PUBLIC_DNI_API_TOKEN?.trim();
  if (!token) throw new Error("Servicio de validación no disponible temporalmente.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://api.apiperu.dev/dni", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dni: dniLimpio }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok || !data?.success || !data?.data) {
      const msg = (data?.message || "").toLowerCase();
      if (msg.includes("not found") || msg.includes("no encontrado")) {
        throw new Error("No se encontraron datos registrados para este número de DNI.");
      }
      throw new Error("No se pudo validar el DNI. Por favor verifica el número e inténtalo nuevamente.");
    }

    const { nombres = "", apellido_paterno = "", apellido_materno = "" } = data.data;
    const apellidos = [apellido_paterno, apellido_materno].filter(Boolean).join(" ");

    const resultado = {
      nombres: aTitulo(nombres.trim()),
      apellidos: aTitulo(apellidos.trim()),
    };

    // Si llego al límite, quito el más antiguo (el Map guarda el orden de inserción)
    if (cacheDni.size >= LIMITE_CACHE_DNI) {
      const masAntiguo = cacheDni.keys().next().value;
      if (masAntiguo !== undefined) cacheDni.delete(masAntiguo);
    }
    cacheDni.set(dniLimpio, resultado);

    return { ...resultado };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("La consulta de DNI tardó más de lo esperado. Verifica tu conexión a internet.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

