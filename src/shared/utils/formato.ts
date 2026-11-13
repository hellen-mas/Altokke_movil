/**
 * Utilidades globales de formateo (Moneda Peruana y Fechas)
 */

export function formatearSoles(monto: number): string {
  const valor = isNaN(monto) ? 0 : monto;
  return `S/ ${valor.toFixed(2)}`;
}

export function formatearHora(fecha: Date): string {
  const horas = fecha.getHours();
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  const sufijo = horas >= 12 ? "p. m." : "a. m.";
  return `${horas % 12 || 12}:${minutos} ${sufijo}`;
}

const MESES_CORTO = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "set", "oct", "nov", "dic"
];

export function formatearFechaHora(fecha: Date): string {
  const dia = fecha.getDate();
  const mes = MESES_CORTO[fecha.getMonth()];
  return `${dia} ${mes}, ${formatearHora(fecha)}`;
}
