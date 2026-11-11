// 1. VALIDACION_CALCULAR_EDAD: Cálculo de edad exacta considerando huso horario de Perú
export function calcularEdad(fecha: Date | string): number {
  if (!fecha) return 0;
  // Concatenar T00:00:00 fuerza hora local peruana y evita desfase de -5 horas en UTC
  const d = typeof fecha === "string" ? new Date(fecha.includes("T") ? fecha : `${fecha}T00:00:00`) : fecha;
  if (isNaN(d.getTime())) return 0;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  // Resta 1 si aún no ha llegado el mes o el día del cumpleaños
  return (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) ? edad - 1 : edad;
}

// 2. VALIDACION_SANITIZAR_DNI: Elimina caracteres no numéricos y recorta a 8 dígitos
export const sanitizarDNI = (texto: string) => texto.replace(/\D/g, "").slice(0, 8);

// 3. VALIDACION_SANITIZAR_TEL: Limpia caracteres no numéricos y remueve prefijo +51 de Perú
export const sanitizarTelefono = (texto: string) => {
  const digitos = texto.replace(/\D/g, "");
  const sinPrefijo =
    digitos.length > 9 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
  return sinPrefijo.slice(0, 9);
};

export const esDNIValido = (dni: string) => /^\d{8}$/.test(dni);
export const esTelefonoValido = (tel: string) => /^9\d{8}$/.test(tel);
