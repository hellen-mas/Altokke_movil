import { CONDUCTOR_EJEMPLO } from "./conductor";
import { PASAJERO_DEMO } from "./cuenta";

export const USUARIOS_DEMO = [
  {
    id: CONDUCTOR_EJEMPLO.id,
    rol: "conductor",
    nombre: CONDUCTOR_EJEMPLO.nombre,
    correo: CONDUCTOR_EJEMPLO.correo,
    password: "12345",
  },
  {
    id: PASAJERO_DEMO.id,
    rol: "pasajero",
    nombre: PASAJERO_DEMO.nombre,
    correo: PASAJERO_DEMO.correo,
    password: "123456789",
  },
] as const;
