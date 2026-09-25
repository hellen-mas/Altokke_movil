export type ArchivoDocumento = {
    uri: string;
    nombre: string;
    tipo?: string;
};

export type EstadoViaje = "Completado" | "Cancelado";

export type Viaje = {
    id: string;
    fecha: string;
    hora: string;
    origen: string;
    destino: string;
    monto: number;
    estado: EstadoViaje;
};