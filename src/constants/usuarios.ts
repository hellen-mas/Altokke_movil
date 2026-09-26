import { CONDUCTOR_EJEMPLO } from "./conductor";

export const USUARIOS_DEMO = [
  {
    id: CONDUCTOR_EJEMPLO.id,
    rol: "conductor",
    nombre: CONDUCTOR_EJEMPLO.nombre,
    correo: CONDUCTOR_EJEMPLO.correo,
    password: "12345",
  },
] as const;