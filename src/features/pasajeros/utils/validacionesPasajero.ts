import * as yup from "yup";
import { reglaCorreo, reglaDni, reglaMayorEdad, reglaPasswordSegura, reglaTelefono } from "@/shared/utils/validacionesEsquemas";

export const esquemaRegistroPasajero = yup.object({
  // Paso 1: Acceso
  correo: reglaCorreo,
  telefono: reglaTelefono,
  contrasena: reglaPasswordSegura,
  confirmarContrasena: yup.string()
    .required("Requerido")
    .oneOf([yup.ref("contrasena")], "Las contraseñas no coinciden"),

  // Paso 2: Identidad
  dni: reglaDni,
  nombres: yup.string().required("Requerido"),
  apellidos: yup.string().required("Requerido"),
  fechaNacimiento: reglaMayorEdad,
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
