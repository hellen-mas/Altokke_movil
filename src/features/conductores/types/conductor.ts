export type ArchivoDocumento = {
    uri: string;
    nombre: string;
    tipo?: string;
};

export type EstadoViaje = "Completado" | "Cancelado";

export type DiaSemana = "Lun" | "Mar" | "Mié" | "Jue" | "Vie" | "Sáb" | "Dom";

export type Viaje = {
    id: string;
    fecha: string;
    hora: string;
    diaSemana: DiaSemana;
    origen: string;
    destino: string;
    monto: number;
    estado: EstadoViaje;
};