import * as yup from "yup";

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
export const sanitizarTelefono = (texto: string) => texto.replace(/\D/g, "").slice(0, 9);
export const esDNIValido = (dni: string) => /^\d{8}$/.test(dni);
export const esTelefonoValido = (tel: string) => /^9\d{8}$/.test(tel);

export const esquemaRegistroPasajero = yup.object({
  // Paso 1: Acceso
  correo: yup.string().email("Correo inválido").required("Requerido"),
  telefono: yup.string().required("Requerido").min(9, "Debe tener 9 dígitos"),
  contrasena: yup.string()
    .required("Requerido")
    .min(8, "Mínimo 8 caracteres")
    .matches(/[A-Z]/, "Falta una mayúscula")
    .matches(/[a-z]/, "Falta una minúscula")
    .matches(/[0-9]/, "Falta un número")
    .matches(/[\W_]/, "Falta un símbolo"),
  confirmarContrasena: yup.string()
    .required("Confirma tu contraseña")
    .oneOf([yup.ref("contrasena")], "Las contraseñas no coinciden"),

  // Paso 2: Identidad
  dni: yup.string().length(8, "El DNI debe tener 8 dígitos").required("Requerido"),
  nombres: yup.string().required("Requerido"),
  apellidos: yup.string().required("Requerido"),
  fechaNacimiento: yup.string()
    .required("Selecciona tu fecha de nacimiento")
    .test("es-mayor-de-edad", "Debes tener al menos 18 años para registrarte", (val) => Boolean(val && calcularEdad(val) >= 18)),
  fotoPerfil: yup.string().nullable().optional(),
  fotoBase64: yup.string().nullable().optional(),
});

export type TipoDatosPersonales = yup.InferType<typeof esquemaRegistroPasajero>;

export const esquemaPaso1 = esquemaRegistroPasajero.pick([
  "correo",
  "contrasena",
  "confirmarContrasena",
]);

export const esquemaPaso2 = esquemaRegistroPasajero.pick([
  "dni",
  "nombres",
  "apellidos",
  "telefono",
  "fechaNacimiento",
]);

export const esquemaNuevaContrasena = yup.object({
  password: yup.string().required("Requerido").min(8, "Mínimo 8 caracteres"),
  confirmPassword: yup
    .string()
    .required("Requerido")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
});
