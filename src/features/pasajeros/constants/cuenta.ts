export const COLORES_CUENTA = {
  cabecera: "#0B3B2A",
  iconoFondo: "#E6F5EC",
  iconoFondoPeligro: "#FBEAEA",
};

export const PASAJERO_DEMO = {
  id: "pasajero-001",
  rol: "pasajero",

  nombre: "Donina Garro",
  iniciales: "DG",
  calificacion: 4.9,
  viajes: 127,

  dni: "75070610",
  correo: "donigarro@gmail.com",
  telefono: "+51 913 714 910",
  fechaNacimiento: "1 de noviembre de 2005",
  genero: "Femenino",

  contactoEmergencia: {
    nombre: "Alicia Gomez",
    telefono: "+51 978 189 389",
  },
};

export const METODOS_PAGO = [
  { id: "efectivo", nombre: "Efectivo", descripcion: "Pagas directamente al conductor" },
  { id: "yape", nombre: "Yape", descripcion: "Pago con tu app Yape" },
  { id: "plin", nombre: "Plin", descripcion: "Pago con tu app Plin" },
] as const;

export type IdMetodoPago = (typeof METODOS_PAGO)[number]["id"];

export const DIRECCIONES_DEMO = [
  {
    id: "casa",
    nombre: "Casa",
    direccion: "Jr. Amazonas 320, Bagua",
    icono: "home-outline",
  },
  {
    id: "trabajo",
    nombre: "Trabajo",
    direccion: "Av. Universidad 200, Bagua",
    icono: "briefcase-outline",
  },
] as const;
