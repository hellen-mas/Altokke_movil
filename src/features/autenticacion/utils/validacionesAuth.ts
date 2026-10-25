import * as yup from "yup";

export const esquemaNuevaContrasena = yup.object({
  password: yup.string().required("Requerido").min(8, "Mínimo 8 caracteres"),
  confirmPassword: yup
    .string()
    .required("Requerido")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
});

// Comparte la validación de correo entre login y recuperación de cuenta
export const esquemaCorreo = yup.string()
  .trim()
  .lowercase()
  .required("Ingresa tu correo electrónico")
  .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Ingresa un correo electrónico válido");

export const esquemaLogin = yup.object({
  correo: esquemaCorreo,
  contrasena: yup.string()
    .required("Ingresa tu contraseña")
    .test("no-vacia", "Ingresa tu contraseña", (val) => Boolean(val?.trim())),
});

export const esquemaRecuperar = yup.object({
  correo: esquemaCorreo,
});

export type TipoDatosLogin = yup.InferType<typeof esquemaLogin>;
export type TipoDatosRecuperar = yup.InferType<typeof esquemaRecuperar>;
