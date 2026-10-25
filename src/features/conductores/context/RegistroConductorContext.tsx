import React from "react";
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
  setNombre: (v: string) => void;
  setApellidos: (v: string) => void;
  setDni: (v: string) => void;
  setFechaNacimiento: (v: Date | null) => void;
  setCorreo: (v: string) => void;
  setContrasena: (v: string) => void;
  setConfirmarContrasena: (v: string) => void;
  setTelefono: (v: string) => void;
  setCodigo: (v: string) => void;
  setCorreoRespaldo: (v: string) => void;
  setDireccion: (v: string) => void;
  setFoto: (v: string | null) => void;
  setDniFrente: (v: string | null) => void;
  setDniReverso: (v: string | null) => void;
  setSelfie: (v: string | null) => void;
  setLicenciaConducir: (v: ArchivoDocumento | null) => void;
  setSoat: (v: ArchivoDocumento | null) => void;
  setAntecedentesPenales: (v: ArchivoDocumento | null) => void;
  setPlaca: (v: string) => void;
  setMarca: (v: string) => void;
  setModelo: (v: string) => void;
  setAnio: (v: string) => void;
  setColor: (v: string) => void;
  setCapacidad: (v: string) => void;
  setConfirmacionVeracidad: (v: boolean | ((prev: boolean) => boolean)) => void;
  limpiar: () => void;
}

export const useRegistroConductor = create<ConductorStore>((set) => ({
  ...estadoInicial,
  setNombre: (nombre) => set({ nombre }),
  setApellidos: (apellidos) => set({ apellidos }),
  setDni: (dni) => set({ dni }),
  setFechaNacimiento: (fechaNacimiento) => set({ fechaNacimiento }),
  setCorreo: (correo) => set({ correo }),
  setContrasena: (contrasena) => set({ contrasena }),
  setConfirmarContrasena: (confirmarContrasena) => set({ confirmarContrasena }),
  setTelefono: (telefono) => set({ telefono }),
  setCodigo: (codigo) => set({ codigo }),
  setCorreoRespaldo: (correoRespaldo) => set({ correoRespaldo }),
  setDireccion: (direccion) => set({ direccion }),
  setFoto: (foto) => set({ foto }),
  setDniFrente: (dniFrente) => set({ dniFrente }),
  setDniReverso: (dniReverso) => set({ dniReverso }),
  setSelfie: (selfie) => set({ selfie }),
  setLicenciaConducir: (licenciaConducir) => set({ licenciaConducir }),
  setSoat: (soat) => set({ soat }),
  setAntecedentesPenales: (antecedentesPenales) => set({ antecedentesPenales }),
  setPlaca: (placa) => set({ placa }),
  setMarca: (marca) => set({ marca }),
  setModelo: (modelo) => set({ modelo }),
  setAnio: (anio) => set({ anio }),
  setColor: (color) => set({ color }),
  setCapacidad: (capacidad) => set({ capacidad }),
  setConfirmacionVeracidad: (val) =>
    set((s) => ({
      confirmacionVeracidad: typeof val === "function" ? val(s.confirmacionVeracidad) : val,
    })),
  limpiar: () => set(estadoInicial),
}));

export const RegistroConductorProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;