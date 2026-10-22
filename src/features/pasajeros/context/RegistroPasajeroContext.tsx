import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { TipoDatosPersonales } from "@/features/pasajeros/utils/validacionesPasajero";

interface RegistroPasajeroContextType {
  datosPersonales: Partial<TipoDatosPersonales>;
  setDatosPersonales: (data: Partial<TipoDatosPersonales>) => void;
  preferencias: any;
  setPreferencias: (data: any) => void;
  clearRegistro: () => void;
}

// Creamos el espacio global para guardar los datos del registro mientras el usuario pasa de una pantalla a otra
const RegistroPasajeroContext = createContext<
  RegistroPasajeroContextType | undefined
>(undefined);

export function RegistroPasajeroProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [datosPersonales, setDatosPersonales] = useState({});
  const [preferencias, setPreferencias] = useState({});

  const clearRegistro = useCallback(() => {
    setDatosPersonales({});
    setPreferencias({});
  }, []);

  const value = useMemo(
    () => ({
      datosPersonales,
      setDatosPersonales,
      preferencias,
      setPreferencias,
      clearRegistro,
    }),
    [datosPersonales, preferencias, clearRegistro]
  );

  return (
    <RegistroPasajeroContext.Provider value={value}>
      {children}
    </RegistroPasajeroContext.Provider>
  );
}

export function useRegistroPasajero() {
  const context = useContext(RegistroPasajeroContext);
  if (context === undefined) {
    throw new Error(
      "useRegistroPasajero debe usarse dentro de un RegistroPasajeroProvider",
    );
  }
  return context;
}
