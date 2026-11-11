// 1. edad: calcula la edad con hora de peru
export function calcularEdad(fecha: Date | string): number {
  if (!fecha) return 0;
  const d = typeof fecha === "string" ? new Date(fecha.includes("T") ? fecha : `${fecha}T00:00:00`) : fecha;
  if (isNaN(d.getTime())) return 0;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  return (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) ? edad - 1 : edad;
}

// 2. dni: limpia el dni a 8 numeros
export const sanitizarDNI = (texto: string) => texto.replace(/\D/g, "").slice(0, 8);

// 3. telefono: quita el +51 y deja 9 numeros
export const sanitizarTelefono = (texto: string) => {
  const digitos = texto.replace(/\D/g, "");
  const sinPrefijo =
    digitos.length > 9 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
  return sinPrefijo.slice(0, 9);
};

export const esDNIValido = (dni: string) => /^\d{8}$/.test(dni);
export const esTelefonoValido = (tel: string) => /^9\d{8}$/.test(tel);
