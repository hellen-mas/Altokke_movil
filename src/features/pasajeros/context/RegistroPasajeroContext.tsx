import React from "react";
import { create } from "zustand";
import { TipoDatosPersonales } from "@/features/pasajeros/utils/validacionesPasajero";

interface RegistroPasajeroStore {
  datosPersonales: Partial<TipoDatosPersonales>;
  setDatosPersonales: (data: Partial<TipoDatosPersonales>) => void;
  preferencias: any;
  setPreferencias: (data: any) => void;
  clearRegistro: () => void;
}

export const useRegistroPasajero = create<RegistroPasajeroStore>((set) => ({
  datosPersonales: {},
  preferencias: {},
  setDatosPersonales: (data) =>
    set((state) => ({ datosPersonales: { ...state.datosPersonales, ...data } })),
  setPreferencias: (data) =>
    set((state) => ({ preferencias: { ...state.preferencias, ...data } })),
  clearRegistro: () => set({ datosPersonales: {}, preferencias: {} }),
}));

export const RegistroPasajeroProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
