import { useCallback, useRef, useState } from "react";

/**
 * Hook para prevenir doble toque o ejecuciones concurrentes en botones/acciones asíncronas
 */
export function useAsyncLock() {
  const [bloqueado, setBloqueado] = useState(false);
  const cerrojoRef = useRef(false);

  const ejecutarSeguro = useCallback(
    async <T>(accion: () => Promise<T>): Promise<T | undefined> => {
      if (cerrojoRef.current) return undefined;
      cerrojoRef.current = true;
      setBloqueado(true);
      try {
        return await accion();
      } finally {
        cerrojoRef.current = false;
        setBloqueado(false);
      }
    },
    []
  );

  return {
    bloqueado,
    cerrojoRef,
    ejecutarSeguro,
  };
}
