import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";
import type { Lugar } from "@/constants/pasajero";

export type TipoServicio = "normal" | "express" | "reserva";

type ViajeContextType = {
    tipoServicio: TipoServicio;
    setTipoServicio: React.Dispatch<React.SetStateAction<TipoServicio>>;
    destino: Lugar | null;
    setDestino: React.Dispatch<React.SetStateAction<Lugar | null>>;
};

const ViajeContext = createContext<ViajeContextType | undefined>(undefined);

export function ViajeProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [tipoServicio, setTipoServicio] = useState<TipoServicio>("normal");
    const [destino, setDestino] = useState<Lugar | null>(null);

    return (
        <ViajeContext.Provider
            value={{
                tipoServicio,
                setTipoServicio,
                destino,
                setDestino,
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
