import * as yup from "yup";

export const esquemaRegistroPasajero = yup.object({
  // Formato: yup .tipoDato() .formato("mensaje") .regla("mensaje")
  nombres: yup.string().required("Requerido"),
  apellidos: yup.string().required("Requerido"),
  tipoDocumento: yup.string().required("Requerido"),
  numeroDocumento: yup.string().required("Requerido"),
  fechaNacimiento: yup.date().required("Requerido"),
  genero: yup.string().required("Requerido"),
  direccion: yup.string().required("Requerido"),
  ciudad: yup.string().required("Requerido"),
  telefono: yup.string().required("Requerido"),
  correo: yup.string().email("Correo inválido").required("Requerido"),
});

export const esquemaNuevaContrasena = yup.object({
  // Formato: yup .tipoDato() .regla("mensaje") .condicion(valor, "mensaje")
  password: yup.string().required("Requerido").min(8, "Mínimo 8 caracteres"),
  confirmPassword: yup
    .string()
    .required("Requerido")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
});
