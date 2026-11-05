import { useState, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView from "react-native-maps";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import {
  DireccionGuardada,
  pasajeroService,
} from "@/features/pasajeros/services/pasajeroService";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import type { PuntoMapa } from "@/features/viajes/types/tiposMapa";
import { useReverseGeocode } from "@/features/pasajeros/hooks/useReverseGeocode";

export const ICONOS_DISPONIBLES: {
  id: string;
  nombre: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
}[] = [
  { id: "home", nombre: "home-outline", etiqueta: "Casa" },
  { id: "trabajo", nombre: "briefcase-outline", etiqueta: "Trabajo" },
  { id: "estudio", nombre: "school-outline", etiqueta: "Estudios" },
  { id: "gym", nombre: "fitness-outline", etiqueta: "Gimnasio" },
  { id: "corazon", nombre: "heart-outline", etiqueta: "Favorito" },
  { id: "ubicacion", nombre: "location-outline", etiqueta: "Punto" },
];

export function useDireccionesGuardadas() {
  const { userId } = useAuth();
  const { perfil, recargar } = usePerfilPasajero();
  const { setDestino } = useViaje();
  const mapaRef = useRef<MapView | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [iconoSeleccionado, setIconoSeleccionado] =
    useState<keyof typeof Ionicons.glyphMap>("home-outline");
  const [guardando, setGuardando] = useState(false);
  const [coordenadasSeleccionadas, setCoordenadasSeleccionadas] =
    useState<PuntoMapa | null>(null);

  const {
    buscandoDireccion,
    buscandoUbicacion,
    geocodificarInversa,
    buscarEnMapa,
    invalidarConsultas,
    marcarEditada,
  } = useReverseGeocode();

  const direccionesGuardadas = perfil?.preferencias?.direcciones ?? [];

  const abrirModalAgregar = useCallback(() => {
    setNombre("");
    setDireccion("");
    setIconoSeleccionado("home-outline");
    setCoordenadasSeleccionadas(null);
    invalidarConsultas();
    setModalVisible(true);
  }, [invalidarConsultas]);

  const cerrarModalAgregar = useCallback(() => {
    invalidarConsultas();
    setModalVisible(false);
  }, [invalidarConsultas]);

  const seleccionarUbicacionEnMapa = useCallback(
    (punto: PuntoMapa) => {
      setCoordenadasSeleccionadas(punto);
      setDireccion("");
      geocodificarInversa(punto, (encontrada) => {
        setDireccion(encontrada);
      });
    },
    [geocodificarInversa]
  );

  const buscarDireccionTexto = useCallback(() => {
    buscarEnMapa(direccion, (coordenadas) => {
      setCoordenadasSeleccionadas(coordenadas);
      mapaRef.current?.animateToRegion(
        {
          ...coordenadas,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    });
  }, [buscarEnMapa, direccion]);

  const guardarDireccion = useCallback(async () => {
    if (!nombre.trim() || !direccion.trim()) {
      Alert.alert(
        "Campos requeridos",
        "Por favor ingresa un nombre y una dirección."
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        "Sesión requerida",
        "Inicia sesión para guardar direcciones en tu cuenta."
      );
      return;
    }

    if (
      !coordenadasSeleccionadas ||
      !Number.isFinite(coordenadasSeleccionadas.latitude) ||
      !Number.isFinite(coordenadasSeleccionadas.longitude) ||
      Math.abs(coordenadasSeleccionadas.latitude) > 90 ||
      Math.abs(coordenadasSeleccionadas.longitude) > 180
    ) {
      Alert.alert(
        "Selecciona una ubicación válida",
        "Marca en el mapa el punto exacto de esta dirección."
      );
      return;
    }

    invalidarConsultas();

    try {
      setGuardando(true);
      const nueva: DireccionGuardada = {
        id: `dir-${Date.now()}`,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        icono: iconoSeleccionado,
        coordenadas: coordenadasSeleccionadas,
      };

      await pasajeroService.guardarDireccion(userId, nueva);
      await recargar();
      cerrarModalAgregar();
      Alert.alert("Éxito", "Dirección guardada correctamente.");
    } catch (err: unknown) {
      Alert.alert(
        "Error al guardar",
        err instanceof Error ? err.message : "No se pudo registrar la dirección."
      );
    } finally {
      setGuardando(false);
    }
  }, [
    nombre,
    direccion,
    userId,
    coordenadasSeleccionadas,
    invalidarConsultas,
    iconoSeleccionado,
    recargar,
    cerrarModalAgregar,
  ]);

  const pedirViajeHacia = useCallback(
    (lugar: DireccionGuardada) => {
      const coordenadas = lugar.coordenadas;

      if (
        !coordenadas ||
        !Number.isFinite(coordenadas.latitude) ||
        !Number.isFinite(coordenadas.longitude) ||
        Math.abs(coordenadas.latitude) > 90 ||
        Math.abs(coordenadas.longitude) > 180
      ) {
        Alert.alert(
          "Ubicación no definida",
          "Esta dirección todavía no tiene un punto exacto en el mapa. Selecciona su ubicación antes de solicitar un mototaxi.",
          [
            {
              text: "Seleccionar ubicación",
              onPress: () => router.push("/destino"),
            },
            {
              text: "Cancelar",
              style: "cancel",
            },
          ]
        );
        return;
      }

      setDestino({
        id: lugar.id,
        nombre: lugar.nombre,
        detalle: lugar.direccion,
        coordenadas,
      });

      router.push("/confirmar-viaje");
    },
    [setDestino]
  );

  const eliminarDireccion = useCallback(
    async (direccionId: string) => {
      if (!userId) return;
      try {
        await pasajeroService.eliminarDireccion(userId, direccionId);
        await recargar();
        Alert.alert("Eliminado", "La dirección fue eliminada.");
      } catch {
        Alert.alert("Aviso", "No se pudo eliminar la dirección.");
      }
    },
    [userId, recargar]
  );

  return {
    direccionesGuardadas,
    modalVisible,
    nombre,
    setNombre,
    direccion,
    setDireccion: (texto: string) => {
      marcarEditada();
      setDireccion(texto);
    },
    iconoSeleccionado,
    setIconoSeleccionado,
    guardando,
    coordenadasSeleccionadas,
    setCoordenadasSeleccionadas,
    buscandoDireccion,
    buscandoUbicacion,
    mapaRef,
    abrirModalAgregar,
    cerrarModalAgregar,
    seleccionarUbicacionEnMapa,
    buscarDireccionTexto,
    guardarDireccion,
    pedirViajeHacia,
    eliminarDireccion,
  };
}

export default useDireccionesGuardadas;
