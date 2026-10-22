import * as yup from "yup";

export const esquemaNuevaContrasena = yup.object({
  password: yup.string().required("Requerido").min(8, "Mínimo 8 caracteres"),
  confirmPassword: yup
    .string()
    .required("Requerido")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
});

export const esquemaLogin = yup.object({
  correo: yup.string()
    .trim()
    .lowercase()
    .required("Ingresa tu correo electrónico")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Ingresa un correo electrónico válido"),
  contrasena: yup.string()
    .required("Ingresa tu contraseña")
    .test("no-vacia", "Ingresa tu contraseña", (val) => Boolean(val?.trim())),
});

export type TipoDatosLogin = yup.InferType<typeof esquemaLogin>;
