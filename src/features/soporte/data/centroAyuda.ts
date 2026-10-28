
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type Icono = ComponentProps<typeof Ionicons>["name"];

export interface ArticuloAyuda {
  id: string;
  categoriaId: string;
  titulo: string;
  introduccion: string;
  pasos?: string[];
  recomendacion?: string;
}

export interface CategoriaAyuda {
  id: string;
  titulo: string;
  descripcion: string;
  icono: Icono;
  secciones: {
    titulo: string;
    articulos: string[];
  }[];
}

export const CATEGORIAS_AYUDA: CategoriaAyuda[] = [
  {
    id: "viajes",
    titulo: "Viajes y cancelaciones",
    descripcion: "Solicitudes, retrasos y objetos olvidados",
    icono: "car-outline",
    secciones: [
      {
        titulo: "Problemas con un viaje",
        articulos: [
          "conductor-no-llego",
          "cancelar-viaje",
          "objeto-olvidado",
        ],
      },
    ],
  },
  {
    id: "pagos",
    titulo: "Pagos y tarifas",
    descripcion: "Efectivo, Yape, Plin y precios",
    icono: "card-outline",
    secciones: [
      {
        titulo: "Métodos de pago",
        articulos: [
          "pagar-yape-plin",
          "cambiar-metodo-pago",
        ],
      },
      {
        titulo: "Consultas sobre tarifas",
        articulos: ["tarifa-diferente"],
      },
    ],
  },
  {
    id: "seguridad",
    titulo: "Seguridad y reportes",
    descripcion: "Conductores, vehículos e incidentes",
    icono: "shield-checkmark-outline",
    secciones: [
      {
        titulo: "Seguridad durante el viaje",
        articulos: [
          "conductor-diferente",
          "conduccion-peligrosa",
          "accidente-viaje",
        ],
      },
      {
        titulo: "Problemas con el conductor",
        articulos: [
          "comportamiento-inapropiado",
        ],
      },
    ],
  },
  {
    id: "ubicacion",
    titulo: "Ubicación y mapa",
    descripcion: "GPS, rutas y puntos de recogida",
    icono: "navigate-outline",
    secciones: [
      {
        titulo: "Ubicación del pasajero",
        articulos: [
          "gps-no-funciona",
          "direccion-incorrecta",
          "guardar-direccion",
        ],
      },
    ],
  },
  {
    id: "cuenta",
    titulo: "Cuenta y privacidad",
    descripcion: "Datos personales y acceso a tu cuenta",
    icono: "person-circle-outline",
    secciones: [
      {
        titulo: "Administrar mi cuenta",
        articulos: [
          "actualizar-telefono",
          "cambiar-contrasena",
          "corregir-identidad",
        ],
      },
      {
        titulo: "Privacidad",
        articulos: ["eliminar-cuenta"],
      },
    ],
  },
  {
    id: "guias",
    titulo: "Guías de Altokke",
    descripcion: "Aprende a utilizar la aplicación",
    icono: "book-outline",
    secciones: [
      {
        titulo: "Primeros pasos",
        articulos: [
          "solicitar-mototaxi",
          "consultar-historial",
          "direcciones-frecuentes",
        ],
      },
    ],
  },
];

export const ARTICULOS_AYUDA: ArticuloAyuda[] = [
  {
    id: "conductor-no-llego",
    categoriaId: "viajes",
    titulo: "Mi conductor no llegó",
    introduccion:
      "Si tu conductor tarda en llegar, revisa el estado del viaje y la ubicación que aparece en la aplicación.",
    pasos: [
      "Verifica que el punto de recogida sea correcto.",
      "Revisa la información del viaje activo.",
      "Si no puedes continuar con el viaje, utiliza la opción de cancelación disponible.",
      "Si necesitas ayuda adicional, contacta a soporte.",
    ],
    recomendacion:
      "Las condiciones de cancelación deben consultarse según las políticas vigentes de Altokke.",
  },
  {
    id: "cancelar-viaje",
    categoriaId: "viajes",
    titulo: "Cómo cancelar un viaje",
    introduccion:
      "Si ya no necesitas el servicio, puedes utilizar la opción de cancelación mientras esté disponible en tu viaje.",
    pasos: [
      "Abre la información de tu viaje activo.",
      "Busca la opción Cancelar viaje.",
      "Lee la confirmación y verifica el estado actualizado.",
    ],
  },
  {
    id: "objeto-olvidado",
    categoriaId: "viajes",
    titulo: "Olvidé un objeto en el mototaxi",
    introduccion:
      "Si olvidaste alguna pertenencia, intenta reportarlo lo antes posible para facilitar la identificación del viaje.",
    pasos: [
      "Ingresa a Actividad y localiza el viaje correspondiente.",
      "Anota la fecha, hora aproximada y destino.",
      "Contacta a soporte de Altokke e indica qué objeto olvidaste.",
    ],
    recomendacion:
      "No compartas contraseñas ni información bancaria para gestionar la recuperación de objetos.",
  },
  {
    id: "pagar-yape-plin",
    categoriaId: "pagos",
    titulo: "Cómo pagar con Yape o Plin",
    introduccion:
      "Si seleccionaste Yape o Plin, coordina el pago con el conductor utilizando el medio disponible.",
    pasos: [
      "Verifica el importe acordado para el viaje.",
      "Confirma con el conductor los datos de pago.",
      "Realiza el pago desde tu aplicación bancaria o billetera.",
      "Comprueba el destinatario y conserva la constancia.",
    ],
  },
  {
    id: "cambiar-metodo-pago",
    categoriaId: "pagos",
    titulo: "Cambiar el método de pago",
    introduccion:
      "Si necesitas utilizar un medio diferente al elegido inicialmente, consúltalo con el conductor antes de realizar el pago.",
    recomendacion:
      "Comprueba siempre el importe final y evita realizar pagos duplicados.",
  },
  {
    id: "tarifa-diferente",
    categoriaId: "pagos",
    titulo: "La tarifa no coincide con lo acordado",
    introduccion:
      "Si detectas una diferencia entre el importe mostrado y el solicitado, reúne los datos del viaje antes de reportarla.",
    pasos: [
      "Consulta el viaje en la pestaña Actividad.",
      "Revisa la información de la tarifa.",
      "Contacta a soporte e indica la diferencia detectada.",
    ],
  },
  {
    id: "conductor-diferente",
    categoriaId: "seguridad",
    titulo: "El conductor no coincide con la aplicación",
    introduccion:
      "Antes de abordar, verifica que la información del conductor y del mototaxi corresponda con la mostrada en Altokke.",
    pasos: [
      "No abordes si identificas diferencias importantes.",
      "Permanece en un lugar seguro.",
      "Comunícate con soporte para informar lo ocurrido.",
    ],
  },
  {
    id: "conduccion-peligrosa",
    categoriaId: "seguridad",
    titulo: "El conductor manejó peligrosamente",
    introduccion:
      "La seguridad del pasajero es prioritaria. Si observas maniobras peligrosas, evita confrontaciones que puedan aumentar el riesgo.",
    pasos: [
      "Si es seguro hacerlo, solicita detenerte en un lugar apropiado.",
      "Aléjate de cualquier situación de peligro.",
      "Comunícate con soporte e informa los datos del viaje.",
    ],
  },
  {
    id: "accidente-viaje",
    categoriaId: "seguridad",
    titulo: "Tuve un accidente durante un viaje",
    introduccion:
      "Si ocurre un accidente, prioriza la atención de las personas afectadas.",
    pasos: [
      "Si hay heridos o peligro inmediato, contacta a los servicios de emergencia.",
      "Sigue las indicaciones de los profesionales que te atiendan.",
      "Cuando estés a salvo, comunica el incidente a soporte de Altokke.",
    ],
  },
  {
    id: "comportamiento-inapropiado",
    categoriaId: "seguridad",
    titulo: "Tuve un problema con el conductor",
    introduccion:
      "Si recibiste un trato inapropiado o experimentaste una situación incómoda, puedes comunicarlo al equipo de soporte.",
    pasos: [
      "Prioriza tu seguridad personal.",
      "Identifica el viaje correspondiente.",
      "Explica lo ocurrido de forma clara al contactar a soporte.",
    ],
  },
  {
    id: "gps-no-funciona",
    categoriaId: "ubicacion",
    titulo: "No aparece mi ubicación",
    introduccion:
      "Altokke necesita acceder a la ubicación del teléfono para mostrar tu posición en el mapa.",
    pasos: [
      "Activa la ubicación del dispositivo.",
      "Verifica que Altokke tenga permisos de ubicación.",
      "Comprueba tu conexión a Internet.",
      "Vuelve a abrir el mapa e intenta actualizar tu posición.",
    ],
  },
  {
    id: "direccion-incorrecta",
    categoriaId: "ubicacion",
    titulo: "El mapa muestra una dirección incorrecta",
    introduccion:
      "Las direcciones obtenidas automáticamente pueden ser aproximadas.",
    pasos: [
      "Revisa el origen y destino antes de confirmar.",
      "Corrige manualmente la dirección cuando sea necesario.",
      "Verifica que el marcador esté en el lugar adecuado.",
    ],
  },
  {
    id: "guardar-direccion",
    categoriaId: "ubicacion",
    titulo: "Cómo guardar una dirección",
    introduccion:
      "Puedes guardar lugares frecuentes para seleccionarlos fácilmente en futuros viajes.",
    pasos: [
      "Ingresa a Cuenta.",
      "Abre Direcciones guardadas.",
      "Selecciona Agregar dirección.",
      "Indica el lugar en el mapa y guarda los datos.",
    ],
  },
  {
    id: "actualizar-telefono",
    categoriaId: "cuenta",
    titulo: "Actualizar mi número de celular",
    introduccion:
      "Puedes actualizar tu número desde la información personal de tu cuenta.",
    pasos: [
      "Abre la pestaña Cuenta.",
      "Selecciona Mis datos.",
      "Toca Número de celular.",
      "Ingresa el nuevo número y guarda el cambio.",
    ],
  },
  {
    id: "cambiar-contrasena",
    categoriaId: "cuenta",
    titulo: "Cambiar mi contraseña",
    introduccion:
      "Puedes modificar tu contraseña desde las opciones de seguridad de tu cuenta.",
    pasos: [
      "Abre Cuenta y selecciona Seguridad.",
      "Toca Cambiar contraseña.",
      "Escribe y confirma la nueva contraseña.",
      "Guarda los cambios.",
    ],
  },
  {
    id: "corregir-identidad",
    categoriaId: "cuenta",
    titulo: "Corregir mis nombres o DNI",
    introduccion:
      "Los datos de identidad obtenidos durante el registro no pueden editarse libremente desde la pantalla Mis datos.",
    recomendacion:
      "Si detectaste un error, comunícate con soporte para solicitar orientación sobre la corrección.",
  },
  {
    id: "eliminar-cuenta",
    categoriaId: "cuenta",
    titulo: "Solicitar la eliminación de mi cuenta",
    introduccion:
      "Altokke permite iniciar una solicitud de eliminación desde la configuración de la cuenta.",
    pasos: [
      "Ingresa a Cuenta y abre Configuración.",
      "Selecciona Eliminar cuenta.",
      "Lee la información y confirma únicamente si estás seguro.",
    ],
    recomendacion:
      "Algunos registros podrían conservarse cuando existan obligaciones legales u operativas aplicables.",
  },
  {
    id: "solicitar-mototaxi",
    categoriaId: "guias",
    titulo: "Cómo solicitar un mototaxi",
    introduccion:
      "Solicitar un viaje en Altokke comienza seleccionando tu ubicación de partida y tu destino.",
    pasos: [
      "Ingresa a Inicio.",
      "Selecciona tu origen y destino.",
      "Revisa los detalles de la solicitud y la tarifa estimada.",
      "Confirma la solicitud para buscar un conductor.",
    ],
  },
  {
    id: "consultar-historial",
    categoriaId: "guias",
    titulo: "Cómo consultar mis viajes",
    introduccion:
      "La pestaña Actividad reúne la información de tus viajes anteriores.",
    pasos: [
      "Abre Actividad desde la navegación inferior.",
      "Busca el viaje que deseas consultar.",
      "Selecciona el viaje para revisar sus detalles disponibles.",
    ],
  },
  {
    id: "direcciones-frecuentes",
    categoriaId: "guias",
    titulo: "Guardar mis lugares frecuentes",
    introduccion:
      "Puedes registrar tu casa, universidad, trabajo u otros destinos habituales.",
    pasos: [
      "Abre Cuenta.",
      "Ingresa a Direcciones guardadas.",
      "Agrega un nuevo lugar y selecciona su ubicación.",
    ],
  },
];

export function obtenerCategoria(id: string) {
  return CATEGORIAS_AYUDA.find((categoria) => categoria.id === id);
}

export function obtenerArticulo(id: string) {
  return ARTICULOS_AYUDA.find((articulo) => articulo.id === id);
}
