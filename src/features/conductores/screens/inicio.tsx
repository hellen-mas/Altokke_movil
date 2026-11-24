import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { AccesosRapidosConductor } from "@/features/conductores/components/AccesosRapidosConductor";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { conductorService } from "@/features/conductores/services/conductorService";
import { useTemaConductor } from "@/features/conductores/theme/temaConductor";
import { crearEstilos } from "./inicio.styles";
import { supabase } from "@/shared/api/supabase";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function InicioConductorScreen() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const { perfil, actualizarPerfil } = usePerfilConductor();

  const [resumen, setResumen] = useState({
    viajesCompletadosHoy: 0,
    totalHoy: 0,
  });
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [tieneViajeActivo, setTieneViajeActivo] = useState(false);
  const [verificandoViaje, setVerificandoViaje] = useState(true);
  const [errorVerificandoViaje, setErrorVerificandoViaje] = useState(false);

  const verificarViajeActivo = useCallback(async () => {
    if (!perfil.id || perfil.id === "conductor-local") {
      setTieneViajeActivo(false);
      setVerificandoViaje(false);
      return;
    }
    setVerificandoViaje(true);
    try {
      const viaje = await conductorService.obtenerViajeActivoConductor(
        perfil.id,
      );
      setTieneViajeActivo(Boolean(viaje));
      setErrorVerificandoViaje(false);
    } catch (error) {
      console.error("Error verificando viaje activo:", error);
      setErrorVerificandoViaje(true);
    } finally {
      setVerificandoViaje(false);
    }
  }, [perfil.id]);

  useEffect(() => {
    let activo = true;
    if (!perfil.id || perfil.id === "conductor-local") {
      return () => {
        activo = false;
      };
    }
    conductorService
      .obtenerResumenGanancias(perfil.id)
      .then((resultado) => {
        if (!activo) return;
        setResumen({
          viajesCompletadosHoy: resultado.viajesCompletadosHoy,
          totalHoy: resultado.totalHoy,
        });
      })
      .catch((error) => console.error("Error obteniendo resumen:", error));
    return () => {
      activo = false;
    };
  }, [perfil.id]);

  useEffect(() => {
    let activo = true;
    queueMicrotask(() => {
      if (activo) void verificarViajeActivo();
    });
    if (!perfil.id || perfil.id === "conductor-local") {
      return () => {
        activo = false;
      };
    }
    const canal = supabase
      .channel(`disponibilidad_conductor_${perfil.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "viajes" },
        () => {
          void verificarViajeActivo();
        },
      )
      .subscribe();
    return () => {
      activo = false;
      void supabase.removeChannel(canal);
    };
  }, [perfil.id, verificarViajeActivo]);

  // Telemetría GPS continua mientras el conductor está en línea (para que los pasajeros vean mototaxis reales en el mapa)
  useEffect(() => {
    if (!perfil.id || perfil.id === "conductor-local" || !perfil.enLinea || tieneViajeActivo) {
      return;
    }

    let activo = true;
    let subscripcion: Location.LocationSubscription | null = null;

    const iniciarTransmisionGps = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (!activo || status !== Location.PermissionStatus.GRANTED) return;

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 8000,
            distanceInterval: 10,
          },
          (loc) => {
            if (!activo) return;
            void conductorService.actualizarUbicacion(
              perfil.id,
              loc.coords.latitude,
              loc.coords.longitude
            );
          }
        );

        if (activo) {
          subscripcion = sub;
        } else {
          sub.remove();
        }
      } catch (err) {
        console.warn("Aviso en el GPS del conductor:", err);
      }
    };

    void iniciarTransmisionGps();

    return () => {
      activo = false;
      if (subscripcion) {
        subscripcion.remove();
      }
    };
  }, [perfil.id, perfil.enLinea, tieneViajeActivo]);

  const cambiarDisponibilidad = async () => {
    if (actualizandoEstado) return;
    if (!perfil.id || perfil.id === "conductor-local") {
      Alert.alert(
        "Perfil no disponible",
        "No se pudo identificar tu cuenta de conductor.",
      );
      return;
    }
    if (verificandoViaje || errorVerificandoViaje) {
      Alert.alert(
        "No se pudo verificar",
        "Comprueba tu conexión e inténtalo nuevamente.",
      );
      return;
    }
    if (tieneViajeActivo) {
      Alert.alert(
        "Viaje en curso",
        "Debes finalizar tu carrera antes de desconectarte.",
      );
      return;
    }
    const nuevoEstado = !perfil.enLinea;
    setActualizandoEstado(true);
    try {
      await actualizarPerfil({ enLinea: nuevoEstado });
    } catch (error) {
      console.error("Error actualizando disponibilidad:", error);
      Alert.alert(
        "No se pudo actualizar",
        "Comprueba tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setActualizandoEstado(false);
    }
  };

  const estadoDisponibilidad = verificandoViaje
    ? "verificando"
    : errorVerificandoViaje
      ? "error"
      : tieneViajeActivo
        ? "en_viaje"
        : perfil.enLinea
          ? "disponible"
          : "desconectado";

  const primerNombre = perfil.nombre ? perfil.nombre.split(" ")[0] : "Conductor";

  return (
    <View style={styles.safeArea}>
      <CabeceraConductor
        titulo={`Hola, ${primerNombre}`}
        subtitulo="Conductor"
        mostrarMarca
        mostrarAtras={false}
        compacta
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.disponibilidad,
            estadoDisponibilidad === "en_viaje"
              ? styles.disponibilidadViaje
              : estadoDisponibilidad === "disponible"
                ? styles.disponibilidadActiva
                : styles.disponibilidadPausa,
          ]}
        >
          <View style={styles.disponibilidadCabecera}>
            <View
              style={[
                styles.disponibilidadIcono,
                estadoDisponibilidad === "disponible" ||
                estadoDisponibilidad === "en_viaje"
                  ? styles.disponibilidadIconoActivo
                  : styles.disponibilidadIconoPausa,
              ]}
            >
              <Ionicons
                name={
                  estadoDisponibilidad === "en_viaje"
                    ? "car-outline"
                    : estadoDisponibilidad === "disponible"
                      ? "radio"
                      : "moon-outline"
                }
                size={23}
                color={
                  estadoDisponibilidad === "disponible" ||
                  estadoDisponibilidad === "en_viaje"
                    ? "#FFFFFF"
                    : c.textoSec
                }
              />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.disponibilidadTitulo}>
                {estadoDisponibilidad === "verificando"
                  ? "Comprobando..."
                  : estadoDisponibilidad === "en_viaje"
                    ? "En carrera activa"
                    : estadoDisponibilidad === "disponible"
                      ? "Estás disponible"
                      : estadoDisponibilidad === "error"
                        ? "Sin conexión"
                        : "Estás en pausa"}
              </Text>
              <Text style={styles.disponibilidadDescripcion}>
                {estadoDisponibilidad === "en_viaje"
                  ? "Tienes un viaje en curso con un pasajero."
                  : estadoDisponibilidad === "disponible"
                    ? "Recibirás solicitudes de pasajeros cercanos."
                    : estadoDisponibilidad === "error"
                      ? "Revisa tu conexión a internet para continuar."
                      : "Conéctate para empezar a recibir viajes."}
              </Text>
            </View>
          </View>

          {estadoDisponibilidad === "en_viaje" ? (
            <Pressable
              style={[styles.disponibilidadBoton, styles.botonConectarse]}
              onPress={() => router.push("/conductor/viaje-activo")}
            >
              <Ionicons name="navigate-outline" size={19} color="#FFFFFF" />
              <Text
                style={[
                  styles.disponibilidadBotonTexto,
                  styles.textoBotonConectarse,
                ]}
              >
                Continuar viaje en curso
              </Text>
            </Pressable>
          ) : estadoDisponibilidad === "error" ? (
            <Pressable
              style={[styles.disponibilidadBoton, styles.botonConectarse]}
              onPress={() => void verificarViajeActivo()}
            >
              <Ionicons name="refresh-outline" size={19} color="#FFFFFF" />
              <Text
                style={[
                  styles.disponibilidadBotonTexto,
                  styles.textoBotonConectarse,
                ]}
              >
                Reintentar
              </Text>
            </Pressable>
          ) : estadoDisponibilidad === "disponible" ||
            estadoDisponibilidad === "desconectado" ? (
            <Pressable
              style={[
                styles.disponibilidadBoton,
                perfil.enLinea ? styles.botonPausar : styles.botonConectarse,
                actualizandoEstado && styles.botonDeshabilitado,
              ]}
              onPress={cambiarDisponibilidad}
              disabled={actualizandoEstado}
              accessibilityRole="button"
            >
              {actualizandoEstado ? (
                <ActivityIndicator
                  size="small"
                  color={perfil.enLinea ? c.error : "#FFFFFF"}
                />
              ) : (
                <>
                  <Ionicons
                    name={perfil.enLinea ? "power-outline" : "radio-outline"}
                    size={19}
                    color={perfil.enLinea ? c.error : "#FFFFFF"}
                  />
                  <Text
                    style={[
                      styles.disponibilidadBotonTexto,
                      perfil.enLinea
                        ? styles.textoBotonPausar
                        : styles.textoBotonConectarse,
                    ]}
                  >
                    {perfil.enLinea ? "Desconectarme" : "Conectarme"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>

        <View style={styles.seccionEncabezado}>
          <Text style={styles.seccionTitulo}>Tu actividad</Text>
          <Text style={styles.seccionComplemento}>HOY</Text>
        </View>

        <View style={styles.metricas}>
          <View style={[styles.metrica, styles.metricaViajes]}>
            <View style={styles.metricaIcono}>
              <Ionicons name="car-outline" size={19} color={c.primario} />
            </View>
            <Text style={styles.metricaValor}>
              {resumen.viajesCompletadosHoy}
            </Text>
            <Text style={styles.metricaEtiqueta}>Viajes</Text>
          </View>
          <View style={[styles.metrica, styles.metricaGanancias]}>
            <View style={styles.metricaIcono}>
              <Ionicons name="wallet-outline" size={19} color={c.ambar} />
            </View>
            <Text style={styles.metricaValor}>
              S/ {resumen.totalHoy.toFixed(2)}
            </Text>
            <Text style={styles.metricaEtiqueta}>Ganancias</Text>
          </View>
          <View style={[styles.metrica, styles.metricaCalificacion]}>
            <View style={styles.metricaIcono}>
              <Ionicons name="star-outline" size={19} color={c.textoSec} />
            </View>
            <Text style={styles.metricaValor}>
              {perfil.calificacion.toFixed(1)}
            </Text>
            <Text style={styles.metricaEtiqueta}>Calificación</Text>
          </View>
        </View>

        <AccesosRapidosConductor />

        <View style={styles.consejo}>
          <View style={styles.consejoIcono}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color={c.textoSec}
            />
          </View>
          <View style={styles.consejoContenido}>
            <Text style={styles.consejoTitulo}>Conduce con cuidado</Text>
            <Text style={styles.consejoDescripcion}>
              Tu seguridad y la de tus pasajeros es lo primero.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.solicitudes}
          onPress={() => router.push("/conductor/solicitudes")}
          accessibilityRole="button"
        >
          <View style={styles.solicitudesIcono}>
            <Ionicons
              name="notifications-outline"
              size={23}
              color={c.primario}
            />
          </View>
          <View style={styles.solicitudesContenido}>
            <Text style={styles.solicitudesTitulo}>Solicitudes de viaje</Text>
            <Text style={styles.solicitudesDescripcion}>
              Consulta los viajes disponibles en tu zona.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={c.primario} />
        </Pressable>
      </ScrollView>
    </View>
  );
}
