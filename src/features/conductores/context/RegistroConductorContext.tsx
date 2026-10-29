import { create } from "zustand";
import { ArchivoDocumento } from "@/features/conductores/types/conductor";

interface DatosFormularioConductor {
  nombre: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: Date | null;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  telefono: string;
  codigo: string;
  correoRespaldo: string;
  direccion: string;
  foto: string | null;
  dniFrente: string | null;
  dniReverso: string | null;
  selfie: string | null;
  licenciaConducir: ArchivoDocumento | null;
  soat: ArchivoDocumento | null;
  antecedentesPenales: ArchivoDocumento | null;
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  capacidad: string;
  confirmacionVeracidad: boolean;
}

const estadoInicial: DatosFormularioConductor = {
  nombre: "",
  apellidos: "",
  dni: "",
  fechaNacimiento: null,
  correo: "",
  contrasena: "",
  confirmarContrasena: "",
  telefono: "",
  codigo: "",
  correoRespaldo: "",
  direccion: "",
  foto: null,
  dniFrente: null,
  dniReverso: null,
  selfie: null,
  licenciaConducir: null,
  soat: null,
  antecedentesPenales: null,
  placa: "",
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  capacidad: "",
  confirmacionVeracidad: false,
};

interface ConductorStore extends DatosFormularioConductor {
  actualizarFormulario: (datos: Partial<DatosFormularioConductor>) => void;
  limpiarFormulario: () => void;
}

export const useRegistroConductor = create<ConductorStore>((set) => ({
  ...estadoInicial,
  actualizarFormulario: (datos) => set(datos),
  limpiarFormulario: () => set(estadoInicial),
}));
