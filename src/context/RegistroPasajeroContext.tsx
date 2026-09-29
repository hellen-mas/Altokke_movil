import React, { createContext, useContext, useState } from "react";

interface RegistroPasajeroContextType {
  datosPersonales: any;
  setDatosPersonales: (data: any) => void;
  preferencias: any;
  setPreferencias: (data: any) => void;
  clearRegistro: () => void;
}

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

  const clearRegistro = () => {
    setDatosPersonales({});
    setPreferencias({});
  };

  return (
    <RegistroPasajeroContext.Provider
      value={{
        datosPersonales,
        setDatosPersonales,
        preferencias,
        setPreferencias,
        clearRegistro,
      }}
    >
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
