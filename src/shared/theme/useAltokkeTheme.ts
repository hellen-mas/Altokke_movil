
import { useColorScheme } from "react-native";
import { useTemaStore } from "./temaStore";

const coloresClaro = {
  fondo: "#F7F9F8",
  superficie: "#FFFFFF",
  campo: "#E9EEEA",
  campoFoco: "#E3EBE5",
  texto: "#121A15",
  textoCampo: "#17251C",
  secundario: "#596C60",
  primario: "#83D5AA",
  primarioPresionado: "#68BC92",
  primarioDeshabilitado: "#C6E8D5",
  textoBoton: "#0C211C",
  progresoInactivo: "#DCE5DF",
  linea: "#DCE5DF",
  exitoFondo: "#EAF5EF",
  exitoTexto: "#16804D",
  error: "#B42323",
  errorFondo: "#F6EDED",
} as const;

const coloresOscuro = {
  fondo: "#0A130E",
  superficie: "#121E18",
  campo: "#1C2B22",
  campoFoco: "#253D2F",
  texto: "#F4F7F5",
  textoCampo: "#F4F7F5",
  secundario: "#A3B5AA",
  primario: "#83D5AA",
  primarioPresionado: "#68BC92",
  primarioDeshabilitado: "#305747",
  textoBoton: "#0C211C",
  progresoInactivo: "#304238",
  linea: "#304238",
  exitoFondo: "#173526",
  exitoTexto: "#80DBA5",
  error: "#FF8383",
  errorFondo: "#382323",
} as const;

export type ColoresTema = typeof coloresClaro | typeof coloresOscuro;

export function useAltokkeTheme() {
  const esquemaSistema = useColorScheme();
  const modoPreferido = useTemaStore(
    (state) => state.modoPreferido
  );

  const setModoPreferido = useTemaStore(
    (state) => state.setModoPreferido
  );

  const esOscuro =
    modoPreferido === "oscuro" ||
    (modoPreferido === "automatico" &&
      esquemaSistema === "dark");

  return {
    esOscuro,
    modo: esOscuro ? "dark" : "light",
    modoPreferido,
    setModoPreferido,
    colores: esOscuro ? coloresOscuro : coloresClaro,
  };
}
