import { useEffect, useState, useCallback } from "react";
import NetInfo, { type NetInfoState, NetInfoStateType } from "@react-native-community/netinfo";

export interface AltokkeNetworkState {
  sinConexion: boolean;
  conectado: boolean;
  tipoConexion: NetInfoStateType;
  reverificar: () => Promise<boolean>;
}

/**
 * Hook de detección de conectividad para Altokke Móvil.
 * Monitorea caídas de señal 3G/4G en Bagua sin provocar render loops infinitos.
 */
export function useNetworkStatus(): AltokkeNetworkState {
  const [conectado, setConectado] = useState(true);
  const [tipoConexion, setTipoConexion] = useState<NetInfoStateType>(NetInfoStateType.unknown);

  useEffect(() => {
    let montado = true;

    // Suscripción con filtro de cambios primitivos para evitar re-renders innecesarios
    const unsub = NetInfo.addEventListener((estado: NetInfoState) => {
      if (!montado) return;
      const estaConectado = Boolean(estado.isConnected && estado.isInternetReachable !== false);
      setConectado((anterior) => (anterior !== estaConectado ? estaConectado : anterior));
      setTipoConexion((anterior) => (anterior !== estado.type ? estado.type : anterior));
    });

    // Consulta inicial inmediata
    NetInfo.fetch()
      .then((estado) => {
        if (!montado) return;
        const estaConectado = Boolean(estado.isConnected && estado.isInternetReachable !== false);
        setConectado(estaConectado);
        setTipoConexion(estado.type);
      })
      .catch((err: unknown) => {
        console.warn("Aviso al verificar estado inicial de red:", err);
      });

    return () => {
      montado = false;
      unsub();
    };
  }, []);

  const reverificar = useCallback(async (): Promise<boolean> => {
    try {
      const estado = await NetInfo.refresh();
      const estaConectado = Boolean(estado.isConnected && estado.isInternetReachable !== false);
      setConectado(estaConectado);
      setTipoConexion(estado.type);
      return estaConectado;
    } catch (err) {
      console.warn("Aviso al refrescar conexión:", err);
      return false;
    }
  }, []);

  return {
    sinConexion: !conectado,
    conectado,
    tipoConexion,
    reverificar,
  };
}
