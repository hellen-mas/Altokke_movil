export const COLORES_CUENTA = {
  cabecera: "#0B3B2A",
  iconoFondo: "#E6F5EC",
  iconoFondoPeligro: "#FBEAEA",
};

export const PASAJERO_DEMO = {
  id: "pasajero-001",
  rol: "pasajero",

  nombre: "Pasajero Altokke",
  iniciales: "PA",
  calificacion: 5.0,
  viajes: 0,

  dni: "70000000",
  correo: "pasajero@altokke.pe",
  telefono: "+51 900 000 000",
  fechaNacimiento: "1 de enero de 2000",
  genero: "No especificado",

  contactoEmergencia: {
    nombre: "Contacto de Emergencia",
    telefono: "+51 900 000 001",
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
