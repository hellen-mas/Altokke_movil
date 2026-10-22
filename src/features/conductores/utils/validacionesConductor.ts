import * as yup from "yup";

export const esquemaDatosConductor = yup.object({
    nombre: yup.string().trim().required("Debes conusltar y validar tu DNI"),
    apellidos: yup.string().trim().required("Debes consultar y validar tu DNI"),
    dni: yup.string().required("El DNI es obligatorio").matches(/^\d{8}$/, "El DNI debe tener 8 dígitos numéricos"),
    correo: yup.string().trim().required("El correo es obligatorio").email("Ingresa un correo electrónico válido"),
    contrasena: yup.string()
        .required("La contraseña es obligatoria")
        .min(12, "Debe tener al menos 12 caracteres")
        .matches(/[A-Z]/, "Incluye al menos una mayúscula")
        .matches(/[a-z]/, "Incluye al menos una minúscula")
        .matches(/[0-9]/, "Incluye al menos un número")
        .matches(/[^A-Za-z0-9]/, "Incluye al menos un símbolo")
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