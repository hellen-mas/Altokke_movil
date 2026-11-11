import { reglaCorreo, reglaDni, reglaPasswordSegura } from "@/shared/utils/validacionesEsquemas";
import * as yup from "yup";

// 2. YUP_ESQUEMA_CONDUCTOR: Esquema declarativo de validación de datos personales del conductor
export const esquemaDatosConductor = yup.object({
  // Nombres y apellidos oficiales devueltos por RENIEC
  nombre: yup.string().trim().required("Debes consultar y validar tu DNI"),
  apellidos: yup.string().trim().required("Debes consultar y validar tu DNI"),
  dni: reglaDni,
  correo: reglaCorreo,

  // Contraseña con mínimo 12 caracteres y prueba personalizada anti-datos personales
  contrasena: reglaPasswordSegura
    .min(12, "Debe tener al menos 12 caracteres")
    .test(
      "sin-datos-personales",
      "No utilices tu DNI o correo como contraseña",
      function (valor) {
        if (!valor) return true;

        const { dni, correo } = this.parent;
        const clave = valor.toLowerCase();
        const usuarioCorreo = String(correo || "").split("@")[0].toLowerCase();
        return !(
          (dni && clave.includes(dni)) ||
          (usuarioCorreo.length >= 4 && clave.includes(usuarioCorreo))
        );
      }
    ),

  // Confirmación con referencia exacta a la contraseña ingresada
  confirmarContrasena: yup
    .string()
    .required("Debes confirmar tu contraseña")
    .oneOf([yup.ref("contrasena")], "Las contraseñas no coinciden"),
});