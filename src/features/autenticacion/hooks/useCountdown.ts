import { useEffect, useState } from "react";

export function useCountdown(segundosIniciales = 60) {
  const [segundos, setSegundos] = useState(segundosIniciales);
  const contando = segundos > 0;

  // Crea el intervalo una vez por cuenta regresiva y no cada segundo
  useEffect(() => {
    if (!contando) return;
    const interval = setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [contando]);

  const reiniciar = (nuevosSegundos = segundosIniciales) => {
    setSegundos(nuevosSegundos);
  };

  return {
    segundos,
    activo: contando,
    reiniciar,
  };
}
