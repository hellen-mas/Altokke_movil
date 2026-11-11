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

// 1. ZUSTAND_BASE: Definición del contrato del store global en memoria RAM para los 25 campos del conductor
interface ConductorStore extends DatosFormularioConductor {
  actualizarFormulario: (datos: Partial<DatosFormularioConductor>) => void;
  // 5. ZUSTAND_LIMPIEZA: Método para reiniciar los 25 campos de la memoria RAM al estado vacío
  limpiarFormulario: () => void;
}

// 1. ZUSTAND_BASE: Hook global useRegistroConductor para retener datos entre las 5 etapas del registro
export const useRegistroConductor = create<ConductorStore>((set) => ({
  ...estadoInicial,
  actualizarFormulario: (datos) => set(datos),
  // 5. ZUSTAND_LIMPIEZA: Ejecuta el reseteo inmediato a estadoInicial
  limpiarFormulario: () => set(estadoInicial),
}));
