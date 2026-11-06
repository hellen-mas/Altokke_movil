import { useState, useRef, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import type { PuntoMapa } from "@/features/viajes/types/tiposMapa";

export function useReverseGeocode() {
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const consultaRef = useRef(0);
  const editadaRef = useRef(false);

  useEffect(() => {
    return () => {
      consultaRef.current += 1;
    };
  }, []);

  const invalidarConsultas = useCallback(() => {
    consultaRef.current += 1;
    setBuscandoDireccion(false);
    setBuscandoUbicacion(false);
  }, []);

  const geocodificarInversa = useCallback(
    async (punto: PuntoMapa, onDireccionObtenida: (direccion: string) => void) => {
      const numeroConsulta = ++consultaRef.current;
      editadaRef.current = false;
      setBuscandoDireccion(true);

      try {
        const resultados = await Location.reverseGeocodeAsync(punto);

        if (numeroConsulta !== consultaRef.current || editadaRef.current) {
          return;
        }

        const lugar = resultados[0];
        if (!lugar) return;

        const calle = [lugar.street, lugar.streetNumber].filter(Boolean).join(" ");
        const localidad = lugar.district || lugar.city || lugar.subregion;
        const encontrada = [calle || lugar.name, localidad].filter(Boolean).join(", ");

        if (encontrada) {
          onDireccionObtenida(encontrada);
        }
      } catch (error) {
        if (numeroConsulta === consultaRef.current) {
          console.warn("No se pudo obtener la dirección:", error);
        }
      } finally {
        if (numeroConsulta === consultaRef.current) {
          setBuscandoDireccion(false);
        }
      }
    },
    []
  );

  const buscarEnMapa = useCallback(
    async (
      textoDireccion: string,
      onPuntoEncontrado: (coordenadas: { latitude: number; longitude: number }) => void
    ) => {
      const texto = textoDireccion.trim();
      if (!texto) {
        Alert.alert("Escribe una dirección", "Ingresa una calle o referencia para buscarla en el mapa.");
        return;
      }

      setBuscandoUbicacion(true);
      const numeroConsulta = ++consultaRef.current;
      setBuscandoDireccion(false);

      try {
        const resultados = await Location.geocodeAsync(`${texto}, Bagua, Amazonas, Perú`);
        if (numeroConsulta !== consultaRef.current) return;

        if (resultados.length === 0) {
          Alert.alert(
            "Dirección no encontrada",
            "No encontramos esa dirección. Intenta escribir una referencia más precisa o marca el punto manualmente."
          );
          return;
        }

        const punto = resultados[0];
        if (
          !Number.isFinite(punto.latitude) ||
          !Number.isFinite(punto.longitude) ||
          Math.abs(punto.latitude) > 90 ||
          Math.abs(punto.longitude) > 180
        ) {
          Alert.alert("Ubicación no válida", "No se pudo obtener una ubicación válida para esta dirección.");
          return;
        }

        Alert.alert(
          "Ubicación aproximada encontrada",
          "Altokke encontró una posible ubicación. Verifica el marcador en el mapa antes de guardar.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Mostrar en el mapa",
              onPress: () => {
                consultaRef.current += 1;
                editadaRef.current = true;
                onPuntoEncontrado({
                  latitude: punto.latitude,
                  longitude: punto.longitude,
                });
              },
            },
          ]
        );
      } catch (error) {
        console.warn("Error al buscar dirección:", error);
        Alert.alert("No se pudo buscar", "Comprueba tu conexión o selecciona el lugar manualmente en el mapa.");
      } finally {
        setBuscandoUbicacion(false);
      }
    },
    []
  );

  return {
    buscandoDireccion,
    buscandoUbicacion,
    geocodificarInversa,
    buscarEnMapa,
    invalidarConsultas,
    marcarEditada: () => {
      editadaRef.current = true;
    },
  };
}

export default useReverseGeocode;
