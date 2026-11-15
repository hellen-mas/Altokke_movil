import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useCallback, useEffect, useState } from "react";
import { conductorService } from "@/features/conductores/services/conductorService";
import { supabase } from "@/shared/api/supabase";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

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
      const viaje =
        await conductorService.obtenerViajeActivoConductor(perfil.id);

      setTieneViajeActivo(Boolean(viaje));
      setErrorVerificandoViaje(false);

    } catch (error) {
      console.error(
        "Error verificando viaje activo del conductor:",
        error
      );

      setErrorVerificandoViaje(true);

    } finally {
      setVerificandoViaje(false);
    }
  }, [perfil.id]);

  useEffect(() => {
    if (!perfil.id || perfil.id === "conductor-local") return;

    let activo = true;

    conductorService
      .obtenerResumenGanancias(perfil.id)
      .then((resultado) => {
        if (!activo) return;

        setResumen({
          viajesCompletadosHoy: resultado.viajesCompletadosHoy,
          totalHoy: resultado.totalHoy,
        });
      })
      .catch((error) => {
        console.error("Error obteniendo el resumen del conductor:", error);
      });

    return () => {
      activo = false;
    };
  }, [perfil.id]);

  useEffect(() => {
    void verificarViajeActivo();

    if (!perfil.id || perfil.id === "conductor-local") {
      return;
    }

    const canal = supabase
      .channel(`disponibilidad_conductor_${perfil.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "viajes",
        },
        () => {
          void verificarViajeActivo();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [perfil.id, verificarViajeActivo]);

  const cambiarDisponibilidad = async () => {
    if (actualizandoEstado) return;

    if (!perfil.id || perfil.id === "conductor-local") {
      Alert.alert(
        "Perfil no disponible",
        "No se pudo identificar tu cuenta de conductor."
      );
      return;
    }

    // No cambiar disponibilidad mientras se verifica el viaje
    if (verificandoViaje || errorVerificandoViaje) {
      Alert.alert(
        "No se pudo verificar",
        "Comprueba tu conexión e inténtalo nuevamente."
      );
      return;
    }

    // No permitir desconectarse durante una carrera
    if (tieneViajeActivo) {
      Alert.alert(
        "Viaje en curso",
        "Debes finalizar tu carrera antes de desconectarte."
      );
      return;
    }

    const nuevoEstado = !perfil.enLinea;

    setActualizandoEstado(true);

    try {
      await actualizarPerfil({
        enLinea: nuevoEstado,
      });

    } catch (error) {
      console.error(
        "Error actualizando disponibilidad:",
        error
      );

      Alert.alert(
        "No se pudo actualizar",
        "No fue posible cambiar tu disponibilidad. Comprueba tu conexión e inténtalo nuevamente."
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

  const primerNombre = perfil.nombre.split(" ")[0];

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

        {/* DISPONIBILIDAD */}
        <View
          style={[
            styles.disponibilidad,
            estadoDisponibilidad === "disponible"
              ? styles.disponibilidadActiva
              : estadoDisponibilidad === "en_viaje"
                ? styles.disponibilidadViaje
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
                  estadoDisponibilidad === "disponible"
                    ? "navigate"
                    : estadoDisponibilidad === "en_viaje"
                      ? "car-sport-outline"
                      : estadoDisponibilidad === "error"
                        ? "alert-circle-outline"
                        : estadoDisponibilidad === "verificando"
                          ? "sync-outline"
                          : "power-outline"
                }
                size={25}
                color={
                  estadoDisponibilidad === "disponible" ||
                  estadoDisponibilidad === "en_viaje"
                    ? "#FFFFFF"
                    : c.textoSec
                }
              />
            </View>
          </View>

          <Text style={styles.disponibilidadTitulo}>
            {estadoDisponibilidad === "disponible"
              ? "Estás disponible"
              : estadoDisponibilidad === "en_viaje"
                ? "Estás atendiendo un viaje"
                : estadoDisponibilidad === "verificando"
                  ? "Comprobando disponibilidad"
                  : estadoDisponibilidad === "error"
                    ? "No pudimos verificar tu estado"
                    : "No estás disponible"}
          </Text>

          <Text style={styles.disponibilidadDescripcion}>
            {estadoDisponibilidad === "disponible"
              ? "Puedes recibir solicitudes de pasajeros cercanos."
              : estadoDisponibilidad === "en_viaje"
                ? "Estás atendiendo una carrera. No recibirás nuevas solicitudes mientras dure el viaje."
                : estadoDisponibilidad === "verificando"
                  ? "Estamos comprobando si tienes una carrera activa."
                  : estadoDisponibilidad === "error"
                    ? "Comprueba tu conexión para verificar tu disponibilidad."
                    : "No recibirás nuevas solicitudes de viaje."}
          </Text>

          {estadoDisponibilidad === "error" ? (
            <Pressable
              style={[
                styles.disponibilidadBoton,
                styles.botonConectarse,
              ]}
              onPress={() => void verificarViajeActivo()}
            >
              <Ionicons
                name="refresh-outline"
                size={19}
                color="#FFFFFF"
              />

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
                perfil.enLinea
                  ? styles.botonPausar
                  : styles.botonConectarse,
                actualizandoEstado && styles.botonDeshabilitado,
              ]}
              onPress={cambiarDisponibilidad}
              disabled={actualizandoEstado}
              accessibilityRole="button"
              accessibilityState={{
                disabled: actualizandoEstado,
              }}
            >
              {actualizandoEstado ? (
                <ActivityIndicator
                  size="small"
                  color={perfil.enLinea ? c.error : "#FFFFFF"}
                />
              ) : (
                <>
                  <Ionicons
                    name={
                      perfil.enLinea
                        ? "power-outline"
                        : "radio-outline"
                    }
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
                    {perfil.enLinea
                      ? "Desconectarme"
                      : "Conectarme"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>

        {/* MÉTRICAS */}
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

        {/* ACCESOS RÁPIDOS */}
        <View style={styles.seccionEncabezado}>
          <Text style={styles.seccionTitulo}>Accesos rápidos</Text>
        </View>

        <View style={styles.accesos}>
          <AccesoRapido
            icono="wallet-outline"
            texto="Ganancias"
            colorFondo={c.primarioSuave}
            onPress={() => router.push("/ganancias")}
          />

          <AccesoRapido
            icono="receipt-outline"
            texto="Solicitudes"
            colorFondo={c.superficieSuave}
            onPress={() => router.push("/solicitudes")}
          />

          <AccesoRapido
            icono="car-sport-outline"
            texto="Vehículo"
            colorFondo={c.ambarSuave}
            onPress={() => router.push("/cuenta/vehiculo")}
          />

          <AccesoRapido
            icono="person-outline"
            texto="Cuenta"
            colorFondo={c.primarioSuave}
            onPress={() => router.push("/cuenta")}
          />
        </View>

        {/* MENSAJE DE SEGURIDAD */}
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

        {/* ACCESO A SOLICITUDES */}
        <Pressable
          style={styles.solicitudes}
          onPress={() => router.push("/solicitudes")}
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

function AccesoRapido({
  icono,
  texto,
  colorFondo,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  colorFondo: string;
  onPress: () => void;
}) {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  return (
    <Pressable
      style={styles.accesoItem}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.accesoIcono, { backgroundColor: colorFondo }]}>
        <Ionicons name={icono} size={23} color={c.primario} />
      </View>
      <Text style={styles.accesoTexto}>{texto}</Text>
    </Pressable>
  );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.fondo,
  },

  container: {
    flex: 1,
    backgroundColor: c.fondo,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },

  introRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: c.textoSec,
    marginBottom: 4,
  },

  tituloPantalla: {
    fontSize: 23,
    fontWeight: "800",
    color: c.texto,
  },

  estadoMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  estadoMiniActivo: {
    backgroundColor: c.primarioSuave,
  },

  estadoMiniPausa: {
    backgroundColor: c.superficieSuave,
  },

  estadoMiniPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  estadoMiniPuntoActivo: {
    backgroundColor: c.botonOscuro,
  },

  estadoMiniPuntoPausa: {
    backgroundColor: c.primario,
  },

  estadoMiniTexto: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  estadoMiniTextoActivo: {
    color: c.primario,
  },

  estadoMiniTextoPausa: {
    color: c.textoSec,
  },

  disponibilidad: {
    borderRadius: 25,
    padding: 19,
    marginBottom: 25,
  },

  disponibilidadActiva: {
    backgroundColor: c.primarioSuave,
  },

  disponibilidadPausa: {
    backgroundColor: c.superficieSuave,
  },

  disponibilidadCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  disponibilidadIcono: {
    width: 47,
    height: 47,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  disponibilidadIconoActivo: {
    backgroundColor: c.primario,
  },

  disponibilidadIconoPausa: {
    backgroundColor: c.superficieSuave,
  },

  disponibilidadEstado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.72)",
  },

  disponibilidadPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  puntoActivo: {
    backgroundColor: c.botonOscuro,
  },

  puntoPausa: {
    backgroundColor: c.primario,
  },

  disponibilidadEstadoTexto: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.35,
  },

  textoEstadoActivo: {
    color: c.primario,
  },

  textoEstadoPausa: {
    color: c.textoSec,
  },

  disponibilidadTitulo: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    color: c.texto,
  },

  disponibilidadDescripcion: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: c.textoSec,
  },

  disponibilidadBoton: {
    minHeight: 47,
    borderRadius: 15,
    marginTop: 17,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  botonPausar: {
    backgroundColor: c.errorSuave,
  },

  botonConectarse: {
    backgroundColor: c.primario,
  },

  botonDeshabilitado: {
    opacity: 0.65,
  },

  disponibilidadBotonTexto: {
    fontSize: 13,
    fontWeight: "800",
  },

  textoBotonPausar: {
    color: c.error,
  },

  textoBotonConectarse: {
    color: "#FFFFFF",
  },

  seccionEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: c.texto,
  },

  seccionComplemento: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: c.textoSec,
  },

  metricas: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 26,
  },

  metrica: {
    flex: 1,
    minHeight: 120,
    borderRadius: 19,
    paddingHorizontal: 11,
    paddingVertical: 13,
    justifyContent: "space-between",
  },

  metricaViajes: {
    backgroundColor: c.primarioSuave,
  },

  metricaGanancias: {
    backgroundColor: c.ambarSuave,
  },

  metricaCalificacion: {
    backgroundColor: c.superficieSuave,
  },

  metricaIcono: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  metricaValor: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: c.texto,
  },

  metricaEtiqueta: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: c.textoSec,
  },

  accesos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  accesoItem: {
    width: "23%",
    alignItems: "center",
    gap: 8,
  },

  accesoIcono: {
    width: 55,
    height: 55,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  accesoTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textoSec,
    textAlign: "center",
  },

  consejo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 16,
    borderRadius: 21,
    backgroundColor: c.botonOscuro,
    marginBottom: 13,
  },

  consejoIcono: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  consejoContenido: {
    flex: 1,
  },

  consejoTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  consejoDescripcion: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: c.textoSec,
  },

  solicitudes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 20,
    backgroundColor: c.primarioSuave,
  },

  solicitudesIcono: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: c.superficie,
    alignItems: "center",
    justifyContent: "center",
  },

  solicitudesContenido: {
    flex: 1,
  },

  solicitudesTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: c.texto,
  },

  solicitudesDescripcion: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: c.textoSec,
  },

  disponibilidadViaje: {
    backgroundColor: c.superficieSuave,
  },
});
