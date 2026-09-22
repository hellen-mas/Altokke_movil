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