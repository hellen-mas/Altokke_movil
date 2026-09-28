import React, { createContext, useContext, useState } from 'react';

type UserRole = 'pasajero' | 'conductor' | null;

type AuthContextType = {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (rol: UserRole) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const login = (rol: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(rol);
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
