import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

export type TipoServicio = "normal" | "express" | "reserva";

type ViajeContextType = {
    tipoServicio: TipoServicio;
    setTipoServicio: React.Dispatch<React.SetStateAction<TipoServicio>>;
};

const ViajeContext = createContext<ViajeContextType | undefined>(undefined);

export function ViajeProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [tipoServicio, setTipoServicio] = useState<TipoServicio>("normal");

    return (
        <ViajeContext.Provider
            value={{
                tipoServicio,
                setTipoServicio,
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
