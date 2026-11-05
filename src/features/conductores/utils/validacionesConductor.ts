import { reglaCorreo, reglaDni, reglaPasswordSegura } from "@/shared/utils/validacionesEsquemas";
import * as yup from "yup";

export const esquemaDatosConductor = yup.object({
    nombre: yup.string().trim().required("Debes conusltar y validar tu DNI"),
    apellidos: yup.string().trim().required("Debes consultar y validar tu DNI"),
    dni: reglaDni,
    correo: reglaCorreo,
    contrasena: reglaPasswordSegura
        .min(12, "Debe tener al menos 12 caracteres")
        .test("sin-datos-personales","No utilices tu DNI o correo como contraseña",
            function(valor) {
                if (!valor) return true;

                const { dni, correo } = this.parent;
                const clave = valor.toLowerCase();
                const usuarioCorreo = String(correo || "").split("@")[0].toLowerCase();
                return !(
                    (dni && clave.includes(dni)) ||
                    (usuarioCorreo.length >=4 && clave.includes(usuarioCorreo))
                );
            }
        ),

        confirmarContrasena: yup.string().required("Debes confirmar tu contraseña")
            .oneOf(
                [yup.ref("contrasena")],
                "Las contraseñas no coinciden"
            ),
});