import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";
import { ArchivoDocumento } from "@/types/conductor";

type RegistroConductorContextType = {
    // Para el paso 1
    nombre: string;
    setNombre: React.Dispatch<React.SetStateAction<string>>;
    apellidos: string;
    setApellidos: React.Dispatch<React.SetStateAction<string>>;
    dni: string;
    setDni: React.Dispatch<React.SetStateAction<string>>;
    fechaNacimiento: Date | null;
    setFechaNacimiento: React.Dispatch<React.SetStateAction<Date | null>>;
    correo: string;
    setCorreo: React.Dispatch<React.SetStateAction<string>>;
    contrasena: string;
    setContrasena: React.Dispatch<React.SetStateAction<string>>;
    confirmarContrasena: string;
    setConfirmarContrasena: React.Dispatch<React.SetStateAction<string>>;

    // Para el paso 2
    telefono: string;
    setTelefono: React.Dispatch<React.SetStateAction<string>>;
    codigo: string;
    setCodigo: React.Dispatch<React.SetStateAction<string>>;
    correoRespaldo: string;
    setCorreoRespaldo: React.Dispatch<React.SetStateAction<string>>;
    direccion: string;
    setDireccion: React.Dispatch<React.SetStateAction<string>>;
    foto: string | null;
    setFoto: React.Dispatch<React.SetStateAction<string | null>>;

    // Para el paso 3
    dniFrente: string | null;
    setDniFrente: React.Dispatch<React.SetStateAction<string | null>>;
    dniReverso: string | null;
    setDniReverso: React.Dispatch<React.SetStateAction<string | null>>;
    selfie: string | null;
    setSelfie: React.Dispatch<React.SetStateAction<string | null>>;

    // Para el paso 4
    licenciaConducir: ArchivoDocumento | null;
    setLicenciaConducir: React.Dispatch<React.SetStateAction<ArchivoDocumento | null>>;
    soat: ArchivoDocumento | null;
    setSoat: React.Dispatch<React.SetStateAction<ArchivoDocumento | null>>;
    antecedentesPenales: ArchivoDocumento | null;
    setAntecedentesPenales: React.Dispatch<React.SetStateAction<ArchivoDocumento | null>>;

    // Para el paso 5
    placa: string;
    setPlaca: React.Dispatch<React.SetStateAction<string>>;
    marca: string;
    setMarca: React.Dispatch<React.SetStateAction<string>>;
    modelo: string;
    setModelo: React.Dispatch<React.SetStateAction<string>>;
    anio: string;
    setAnio: React.Dispatch<React.SetStateAction<string>>;
    color: string;
    setColor: React.Dispatch<React.SetStateAction<string>>;
    capacidad: string;
    setCapacidad: React.Dispatch<React.SetStateAction<string>>;
    confirmacionVeracidad: boolean;
    setConfirmacionVeracidad: React.Dispatch<React.SetStateAction<boolean>>;
};

const RegistroConductorContext = createContext<RegistroConductorContextType | undefined>(undefined);

export function RegistroConductorProvider({
    children,
}: {
    children: ReactNode;
}) {
    // Datos personales
    const [nombre, setNombre] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");

    // Verificacion y contacto
    const [telefono, setTelefono] = useState("");
    const [codigo, setCodigo] = useState("");
    const [correoRespaldo, setCorreoRespaldo] = useState("");
    const [direccion, setDireccion] = useState("");
    const [foto, setFoto] = useState<string | null>(null);

    // Identidad oficial
    const [dniFrente, setDniFrente] = useState<string | null>(null);
    const [dniReverso, setDniReverso] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);

    // Documentos 
    const [licenciaConducir, setLicenciaConducir] = useState<ArchivoDocumento | null>(null);
    const [soat, setSoat] = useState<ArchivoDocumento | null>(null);
    const [antecedentesPenales, setAntecedentesPenales] = useState<ArchivoDocumento | null>(null);

    // Vehículo
    const [placa, setPlaca] = useState("");
    const [marca, setMarca] = useState("");
    const [modelo, setModelo] = useState("");
    const [anio, setAnio] = useState("");
    const [color, setColor] = useState("");
    const [capacidad, setCapacidad] = useState("");
    const [confirmacionVeracidad, setConfirmacionVeracidad] = useState(false);

    return (
        <RegistroConductorContext.Provider
            value={{
                nombre,
                setNombre,
                apellidos,
                setApellidos,
                dni,
                setDni,
                fechaNacimiento,
                setFechaNacimiento,
                correo,
                setCorreo,
                contrasena,
                setContrasena,
                confirmarContrasena,
                setConfirmarContrasena,
                telefono,
                setTelefono,
                codigo,
                setCodigo,
                correoRespaldo,
                setCorreoRespaldo,
                direccion,
                setDireccion,
                foto,
                setFoto,
                dniFrente,
                setDniFrente,
                dniReverso,
                setDniReverso,
                selfie,
                setSelfie,
                licenciaConducir,
                setLicenciaConducir,
                soat,
                setSoat,
                antecedentesPenales,
                setAntecedentesPenales,
                placa,
                setPlaca,
                marca,
                setMarca,
                modelo,
                setModelo,
                anio,
                setAnio,
                color,
                setColor,
                capacidad,
                setCapacidad,
                confirmacionVeracidad,
                setConfirmacionVeracidad,
            }}
        >
            {children}
        </RegistroConductorContext.Provider>
    );
}

export function useRegistroConductor() {
    const context = useContext(RegistroConductorContext);

    if (!context) {
        throw new Error(
            "useRegistroConductor debe utilizarse dentro de RegistroConductorProvider"
        );
    }

    return context;
}