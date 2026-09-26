import type { Viaje } from "@/types/conductor";

export const CONDUCTOR_EJEMPLO = {
    id: "conductor-001",

    // Información personal
    nombre: "Daniel Tirabanti Juarez",
    dni: "70345621",
    telefono: "+51 987 654 321",
    correo: "daniel.tirabanti@gmail.com",
    fechaNacimiento: "22 de marzo de 2007",
    ciudad: "Bagua, Amazonas",

    foto: null as string | null,

    // Información general
    calificacion: 4.8,
    viajes: 320,
    estado: "Conductor activo",

    // Contacto de emergencia
    contactoEmergencia: {
        nombre: "Luis Tirabanti",
        parentesco: "Hermano",
        telefono: "+51 912 345 678",
    },

    // Vehículo
    vehiculo: {
        placa: "M1-2345",
        marca: "Yamaha",
        modelo: "XTZ150",
        anio: 2026,
        color: "Negro",
        capacidad: 3,
        estado: "Operativo",
    },

    // Documentos
    documentos: {
        dni: {
            estado: "VERIFICADO",
        },
        licencia: {
            estado: "VERIFICADO",
        },
        soat: {
            estado: "EN_REVISION",
        },
        tarjetaPropiedad: {
            estado: "VERIFICADO",
        },
        antecedentesPenales: {
            estado: "PENDIENTE",
        },
    },

    seguridad: {
        identidadVerificada: true,
        contactoEmergenciaConfigurado: true,
        compartirViaje: true,
    },
};

// Ganancias
export const RESUMEN_GANANCIAS = {
    totalSemana: 286.40,
    variacionSemana: 12,
    totalHoy: 74.20,
    viajesCompletadosHoy: 18,
    promedioPorViaje: 4.12,
    saldoDisponible: 286.40,
    porDia: [
        { dia: "Lun", monto: 38.20 },
        { dia: "Mar", monto: 32.50 },
        { dia: "Mié", monto: 45.80 },
        { dia: "Jue", monto: 74.20 },
        { dia: "Vie", monto: 41.30 },
        { dia: "Sáb", monto: 54.40 },
        { dia: "Dom", monto: 0 },
    ],
};

// Viajes
export const VIAJES_EJEMPLO: Viaje[] = [
    { id: "v1", fecha: "Hoy", hora: "08:24 a. m.", origen: "Jr. Tacna 876", destino: "Hospital de Apoyo Gustavo Lanatta Luján", monto: 5.00, estado: "Completado" },
    { id: "v2", fecha: "Hoy", hora: "11:37 a. m.", origen: "Terminal Terrestre", destino: "Jr. Amazonas 620", monto: 3.00, estado: "Completado" },
    { id: "v3", fecha: "Ayer", hora: "07:58 a. m.", origen: "Mercado Municipal", destino: "Parque Seoane Corrales", monto: 5.00, estado: "Completado" },
    { id: "v4", fecha: "Ayer", hora: "01:22 p. m.", origen: "Av. 29 de Agosto (Cuadra 8)", destino: "Plaza de Armas", monto: 3.00, estado: "Completado" },
    { id: "v5", fecha: "10 Mar", hora: "06:39 a. m.", origen: "Jr. Ayacucho 1225, Bagua", destino: "Hospital de Apoyo Gustavo Lanatta Luján", monto: 3.00, estado: "Completado" },
    { id: "v6", fecha: "10 Mar", hora: "09:17 a. m.", origen: "Mercado Municipal", destino: "Terminal Terrestre", monto: 5.00, estado: "Completado" },
];

// Historial
export const RESUMEN_HISTORIAL = {
    totalViajes: 32,
    totalGanado: 131.84,
};