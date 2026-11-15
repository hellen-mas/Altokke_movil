import { useMemo } from "react";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

const claro = {
  fondo: "#F2F6F1",
  superficie: "#E7EFE9",
  superficieSuave: "#DCE8DF",
  texto: "#12261C",
  textoSec: "#5A6E62",
  primario: "#1E8A5A",
  primarioPresionado: "#17734A",
  primarioSuave: "rgba(30,138,90,0.13)",
  borde: "rgba(18,38,28,0.07)",
  ambar: "#8F6F1E",
  ambarSuave: "rgba(212,160,40,0.18)",
  error: "#B3302F",
  errorSuave: "rgba(179,48,47,0.11)",
  botonOscuro: "#183D2D",
  sobreHeader: "#FFFFFF",
  headerA: "#063D2A",
  headerB: "#07543A",
  headerC: "#087048",
  barra: "#EAF1EC",
} as const;

const oscuro = {
  fondo: "#0A130E",
  superficie: "#13211A",
  superficieSuave: "#1B2D23",
  texto: "#EEF4F0",
  textoSec: "#93A89B",
  primario: "#24A665",
  primarioPresionado: "#1C8450",
  primarioSuave: "rgba(52,211,134,0.16)",
  borde: "rgba(255,255,255,0.06)",
  ambar: "#E3B957",
  ambarSuave: "rgba(227,185,87,0.16)",
  error: "#FF8A80",
  errorSuave: "rgba(255,138,128,0.14)",
  botonOscuro: "#1E6B49",
  sobreHeader: "#FFFFFF",
  headerA: "#04170F",
  headerB: "#062A1D",
  headerC: "#0A3D2A",
  barra: "#0F1B15",
} as const;

export type ColoresConductor = { [K in keyof typeof claro]: string };

/** Tema del módulo conductor: sigue el modo claro/oscuro/automático de la app. */
export function useTemaConductor<T>(
  crearEstilos: (c: ColoresConductor) => T,
) {
  const { esOscuro } = useAltokkeTheme();
  const c: ColoresConductor = esOscuro ? oscuro : claro;
  const estilos = useMemo(() => crearEstilos(c), [c, crearEstilos]);
  return { c, estilos, esOscuro };
}

export function useColoresConductor() {
  const { esOscuro } = useAltokkeTheme();
  return { c: (esOscuro ? oscuro : claro) as ColoresConductor, esOscuro };
}
