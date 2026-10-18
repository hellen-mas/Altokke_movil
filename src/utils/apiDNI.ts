// Consulto a api.apiperu.dev por POST para traer los datos de la persona con su DNI
export async function buscarDNI(dni: string) {
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
      body: JSON.stringify({ dni: dni.trim() }),
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

    return {
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("La consulta de DNI tardó más de lo esperado. Verifica tu conexión a internet.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

