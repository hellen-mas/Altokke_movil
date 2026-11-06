import React, { createContext, useContext, useState } from "react";

type RolUsuario = "pasajero" | "conductor" | null;

type TipoContextoAutenticacion = {
  isAuthenticated: boolean;
  userRole: RolUsuario;
  login: (rol: RolUsuario) => void;
  logout: () => void;
};

// Espacio para guardar la sesión del usuario
const ContextoAutenticacion = createContext<
  TipoContextoAutenticacion | undefined
>(undefined);

// Envuelve la app y le reparte a las pantallas los datos de sesión
export const AuthProvider = ({
  children: pantallasHijas,
}: {
  children: React.ReactNode;
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<RolUsuario>(null);

  const login = (rol: RolUsuario) => {
    setIsAuthenticated(true);
    setUserRole(rol);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <ContextoAutenticacion.Provider
      value={{ isAuthenticated, userRole, login, logout }}
    >
      {pantallasHijas}
    </ContextoAutenticacion.Provider>
  );
};

// Hook personalizado para obtener los datos de autenticación
export const useAuth = () => {
  const contexto = useContext(ContextoAutenticacion);

  if (!contexto) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }

  return contexto;
};
