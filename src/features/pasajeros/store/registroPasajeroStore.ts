import { TipoDatosPersonales } from "@/features/pasajeros/utils/validacionesPasajero";
import { create } from "zustand";

interface RegistroPasajeroStore {
  datosPersonales: Partial<TipoDatosPersonales>;
  setDatosPersonales: (data: Partial<TipoDatosPersonales>) => void;
  clearRegistro: () => void;
}

export const useRegistroPasajero = create<RegistroPasajeroStore>((set) => ({
  datosPersonales: {},
  setDatosPersonales: (data) =>
    set((state) => ({ datosPersonales: { ...state.datosPersonales, ...data } })),
  clearRegistro: () => set({ datosPersonales: {} }),
}));

