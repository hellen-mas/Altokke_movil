import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";
import {
    HISTORIAL_EJEMPLO,
    type Lugar,
    type ViajeHistorial,
} from "@/constants/pasajero";

export type TipoServicio = "normal" | "express" | "reserva";
export type MetodoPago = "efectivo" | "yape" | "plin";

type ViajeContextType = {
    tipoServicio: TipoServicio;
    setTipoServicio: React.Dispatch<React.SetStateAction<TipoServicio>>;
    metodoPago: MetodoPago;
    setMetodoPago: React.Dispatch<React.SetStateAction<MetodoPago>>;
    destino: Lugar | null;
    setDestino: React.Dispatch<React.SetStateAction<Lugar | null>>;
    historial: ViajeHistorial[];
    registrarViaje: (viaje: Omit<ViajeHistorial, "id" | "fecha">) => void;
};

const ViajeContext = createContext<ViajeContextType | undefined>(undefined);

export function ViajeProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [tipoServicio, setTipoServicio] = useState<TipoServicio>("normal");
    const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
    const [destino, setDestino] = useState<Lugar | null>(null);
    const [historial, setHistorial] =
        useState<ViajeHistorial[]>(HISTORIAL_EJEMPLO);

    // Guarda el viaje al principio de la lista, con la fecha y hora actuales
    const registrarViaje = (viaje: Omit<ViajeHistorial, "id" | "fecha">) => {
        const fecha = new Date();

        setHistorial((actual) => [
            { ...viaje, id: `viaje-${fecha.getTime()}`, fecha },
            ...actual,
        ]);
    };

    return (
        <ViajeContext.Provider
            value={{
                tipoServicio,
                setTipoServicio,
                metodoPago,
                setMetodoPago,
                destino,
                setDestino,
                historial,
                registrarViaje,
            }}
        >
            {children}
        </ViajeContext.Provider>
    );
}

export function useViaje() {
    const context = useContext(ViajeContext);

    if (!context) {
        throw new Error("useViaje debe usarse dentro de ViajeProvider");
    }

    return context;
}
