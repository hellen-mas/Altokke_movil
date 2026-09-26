import type { DiaSemana, Viaje } from "@/types/conductor";

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
        marca: "Honda",
        modelo: "150",
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
            estado: "VERIFICADO",
        },
        tarjetaPropiedad: {
            estado: "VERIFICADO",
        },
        antecedentesPenales: {
            estado: "VERIFICADO",
        },
    },

    seguridad: {
        identidadVerificada: true,
        contactoEmergenciaConfigurado: true,
        compartirViaje: true,
    },
};

// Viajes de ejemplo
export const VIAJES_EJEMPLO: Viaje[] = [
    { id: "v1", fecha: "Lun", hora: "09:10 a. m.", diaSemana: "Lun", origen: "Av. Agropecuario / Jr. Cajamarca", destino: "Banco de la Nación", monto: 3.50, estado: "Completado" },
    { id: "v2", fecha: "Lun", hora: "07:15 a. m.", diaSemana: "Lun", origen: "Jr. Comercio", destino: "I.E. 16192", monto: 3.00, estado: "Completado" },
    { id: "v3", fecha: "Lun", hora: "04:40 p. m.", diaSemana: "Lun", origen: "Jr. Piura", destino: "Jr. Arequipa", monto: 2.50, estado: "Completado" },
    { id: "v4", fecha: "10 Mar", hora: "06:39 a. m.", diaSemana: "Mar", origen: "Jr. Ayacucho 1225", destino: "Hospital de Apoyo Gustavo Lanatta Luján", monto: 4.00, estado: "Completado" },
    { id: "v5", fecha: "10 Mar", hora: "09:17 a. m.", diaSemana: "Mar", origen: "Mercado Municipal", destino: "Terminal Terrestre", monto: 3.50, estado: "Completado" },
    { id: "v6", fecha: "Mar", hora: "10:05 a. m.", diaSemana: "Mar", origen: "Av. Héroes del Cenepa", destino: "Clínica Cristal Dent", monto: 3.50, estado: "Completado" },
    { id: "v7", fecha: "Mié", hora: "12:30 p. m.", diaSemana: "Mié", origen: "Jr. Comercio", destino: "Av. Héroes del Cenepa", monto: 3.00, estado: "Completado" },
    { id: "v8", fecha: "Jue", hora: "03:20 p. m.", diaSemana: "Jue", origen: "Jr. Huandoy", destino: "Keenpool", monto: 3.00, estado: "Completado" },
    { id: "v9", fecha: "Ayer", hora: "07:58 a. m.", diaSemana: "Vie", origen: "Mercado Municipal", destino: "Parque Seoane Corrales", monto: 3.00, estado: "Completado" },
    { id: "v10", fecha: "Ayer", hora: "01:22 p. m.", diaSemana: "Vie", origen: "Av. 29 de Agosto (Cuadra 8)", destino: "A una cuadra de la Plaza de Armas", monto: 2.50, estado: "Completado" },
    { id: "v11", fecha: "Ayer", hora: "08:45 a. m.", diaSemana: "Vie", origen: "Inkafarma", destino: "Jr. Piura", monto: 2.50, estado: "Completado" },
    { id: "v12", fecha: "Ayer", hora: "05:10 p. m.", diaSemana: "Vie", origen: "Jr. Cajamarca", destino: "Jr. Ucayali", monto: 4.00, estado: "Completado" },
    { id: "v13", fecha: "Hoy", hora: "08:24 a. m.", diaSemana: "Sáb", origen: "Jr. Tacna 876", destino: "Hospital de Apoyo Gustavo Lanatta Luján", monto: 4.50, estado: "Completado" },
    { id: "v14", fecha: "Hoy", hora: "11:37 a. m.", diaSemana: "Sáb", origen: "Terminal Terrestre", destino: "Jr. Amazonas 620", monto: 3.00, estado: "Completado" },
    { id: "v15", fecha: "Hoy", hora: "12:50 p. m.", diaSemana: "Sáb", origen: "I.E. La Inmaculada", destino: "Jr. Arequipa", monto: 3.00, estado: "Completado" },
    { id: "v16", fecha: "Hoy", hora: "06:30 p. m.", diaSemana: "Sáb", origen: "Av. Agropecuario", destino: "Jr. Ucayali", monto: 5.00, estado: "Completado" },
];

const DIAS_SEMANA: DiaSemana[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const viajesCompletados = VIAJES_EJEMPLO.filter(
    (viaje) => viaje.estado === "Completado",
);

const totalSemana = viajesCompletados.reduce(
    (suma, viaje) => suma + viaje.monto,
    0,
);

const viajesHoy = viajesCompletados.filter((viaje) => viaje.fecha === "Hoy");

const totalHoy = viajesHoy.reduce((suma, viaje) => suma + viaje.monto, 0);

// Ganancias
export const RESUMEN_GANANCIAS = {
    totalSemana,
    variacionSemana: 12,
    totalHoy,
    viajesCompletadosHoy: viajesHoy.length,
    promedioPorViaje: viajesHoy.length > 0 ? totalHoy / viajesHoy.length : 0,
    saldoDisponible: totalSemana,
    porDia: DIAS_SEMANA.map((dia) => ({
        dia,
        monto: viajesCompletados
            .filter((viaje) => viaje.diaSemana === dia)
            .reduce((suma, viaje) => suma + viaje.monto, 0),
    })),
};

// Historial
export const RESUMEN_HISTORIAL = {
    totalViajes: VIAJES_EJEMPLO.length,
    totalGanado: totalSemana,
};