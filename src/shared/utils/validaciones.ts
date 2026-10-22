export function calcularEdad(fecha: Date | string): number {
  if (!fecha) return 0;
  const d = typeof fecha === "string" ? new Date(fecha.includes("T") ? fecha : `${fecha}T00:00:00`) : fecha;
  if (isNaN(d.getTime())) return 0;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  return (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) ? edad - 1 : edad;
}

export const sanitizarDNI = (texto: string) => texto.replace(/\D/g, "").slice(0, 8);
export const sanitizarTelefono = (texto: string) => {
  const digitos = texto.replace(/\D/g, "");
  //Si pegan el numero con el digito (+51), lo quitamos y nos quedamos con los 9 digitos del numero
  const sinPrefijo =
    digitos.length > 9 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
  return sinPrefijo.slice(0, 9);
};
export const esDNIValido = (dni: string) => /^\d{8}$/.test(dni);
export const esTelefonoValido = (tel: string) => /^9\d{8}$/.test(tel);
