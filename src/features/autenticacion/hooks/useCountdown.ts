import { useEffect, useState } from "react";

export function useCountdown(segundosIniciales = 60) {
  const [segundos, setSegundos] = useState(segundosIniciales);

  useEffect(() => {
    if (segundos <= 0) return;
    const interval = setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [segundos]);

  const reiniciar = (nuevosSegundos = segundosIniciales) => {
    setSegundos(nuevosSegundos);
  };

  return {
    segundos,
    activo: segundos > 0,
    reiniciar,
  };
}
