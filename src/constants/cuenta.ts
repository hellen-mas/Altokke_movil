export const COLORES_CUENTA = {
  cabecera: "#0B3B2A",
  iconoFondo: "#E6F5EC",
  iconoFondoPeligro: "#FBEAEA",
};

export const PASAJERO_DEMO = {
  nombre: "Jhunior Cercado",
  iniciales: "JC",
  calificacion: 4.9,
  viajes: 127,
  correo: "cercadojhunior@gmail.com",
  telefono: "+51 982 735 946",
  fechaNacimiento: "31 de octubre de 2003",
  genero: "Masculino",
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
