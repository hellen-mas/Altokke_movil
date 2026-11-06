
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

export type ModoApariencia =
  | "automatico"
  | "claro"
  | "oscuro";

interface TemaState {
  modoPreferido: ModoApariencia;
  setModoPreferido: (modo: ModoApariencia) => void;
}

export const useTemaStore = create<TemaState>()(
  persist(
    (set) => ({
      modoPreferido: "automatico",

      setModoPreferido: (modo) =>
        set({ modoPreferido: modo }),
    }),
    {
      name: "altokke-apariencia",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        modoPreferido: state.modoPreferido,
      }),
    }
  )
);
