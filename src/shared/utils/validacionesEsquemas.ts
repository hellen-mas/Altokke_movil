import { calcularEdad } from "@/shared/utils/validaciones";
import * as yup from "yup";

export const reglaDni = yup
  .string()
  .trim()
  .required("El DNI es obligatorio")
  .matches(/^\d{8}$/, "El DNI debe tener 8 dígitos");

export const reglaTelefono = yup
  .string()
  .trim()
  .required("El teléfono es obligatorio")
  .matches(/^9\d{8}$/, "El teléfono debe tener 9 dígitos y empezar con 9");

export const reglaCorreo = yup
  .string()
  .trim()
  .lowercase()
  .required("Ingresa tu correo electrónico")
  .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Ingresa un correo electrónico válido");

export const reglaPasswordSegura = yup
  .string()
  .required("Ingresa una contraseña")
  .min(8, "Mínimo 8 caracteres")
  .matches(/[A-Z]/, "Falta una mayúscula")
  .matches(/[a-z]/, "Falta una minúscula")
  .matches(/[0-9]/, "Falta un número")
  .matches(/[^A-Za-z0-9]/, "Falta un símbolo");

export const reglaMayorEdad = yup
  .string()
  .required("Selecciona tu fecha de nacimiento")
  .test(
    "mayor-de-edad",
    "Debes tener al menos 18 años para registrarte",
    (valor) => Boolean(valor && calcularEdad(valor) >= 18)
  );