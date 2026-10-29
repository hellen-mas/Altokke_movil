import { create } from "zustand";

/** Rectángulo en coordenadas de ventana (lo que devuelve measureInWindow). */
export type RectanguloVentana = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SplashTargetState = {
  /** Dónde quedó la escena de la mototaxi en la bienvenida. null = aún no se midió. */
  rect: RectanguloVentana | null;
  setRect: (rect: RectanguloVentana) => void;
};

export const useSplashTargetStore = create<SplashTargetState>((set) => ({
  rect: null,
  setRect: (rect) => set({ rect }),
}));
