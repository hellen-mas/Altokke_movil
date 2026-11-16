import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

export interface AltokkeAccessibilityState {
  reducirMovimiento: boolean;
  lectorPantallaActivo: boolean;
  duracionAnimacion: (duracionMs: number) => number;
}

/**
 * Hook universal de accesibilidad para Altokke Móvil.
 * Respeta la preferencia "Quitar animaciones" / "Reducir movimiento" del sistema operativo,
 * protegiendo a usuarios con sensibilidad vestibular y optimizando el rendimiento.
 */
export function useAltokkeAccessibility(): AltokkeAccessibilityState {
  const [reducirMovimiento, setReducirMovimiento] = useState(() =>
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  const [lectorPantallaActivo, setLectorPantallaActivo] = useState(false);

  useEffect(() => {
    let montado = true;

    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.matchMedia) {
          const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
          const listener = (e: MediaQueryListEvent) => {
            if (montado) setReducirMovimiento(e.matches);
          };
          mediaQuery.addEventListener("change", listener);
          return () => {
            montado = false;
            mediaQuery.removeEventListener("change", listener);
          };
        }
      } catch (err) {
        console.warn("Aviso de accesibilidad en web:", err);
      }
      return () => {
        montado = false;
      };
    }

    // Plataforma nativa (Android / iOS)
    if (typeof AccessibilityInfo?.isReduceMotionEnabled === "function") {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((activo) => {
          if (montado) setReducirMovimiento(Boolean(activo));
        })
        .catch((err: unknown) => {
          console.warn("Aviso al consultar reduceMotion:", err);
        });
    }

    if (typeof AccessibilityInfo?.isScreenReaderEnabled === "function") {
      AccessibilityInfo.isScreenReaderEnabled()
        .then((activo) => {
          if (montado) setLectorPantallaActivo(Boolean(activo));
        })
        .catch((err: unknown) => {
          console.warn("Aviso al consultar screenReader:", err);
        });
    }

    const subMotion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (activo: boolean) => {
        if (montado) setReducirMovimiento(activo);
      }
    );

    const subReader = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (activo: boolean) => {
        if (montado) setLectorPantallaActivo(activo);
      }
    );

    return () => {
      montado = false;
      subMotion?.remove?.();
      subReader?.remove?.();
    };
  }, []);

  const duracionAnimacion = (duracionMs: number): number => {
    return reducirMovimiento ? 0 : duracionMs;
  };

  return {
    reducirMovimiento,
    lectorPantallaActivo,
    duracionAnimacion,
  };
}
