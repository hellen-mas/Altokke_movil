import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraFlujoViaje } from "@/features/viajes/components/CabeceraFlujoViaje";
import { PanelDeslizableViaje } from "@/features/viajes/components/PanelDeslizableViaje";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { PulsoBusqueda } from "@/features/viajes/components/PulsoBusqueda";
import { TarjetaConductor } from "@/features/viajes/components/TarjetaConductor";
import { BotonPrincipal } from "@/shared/components/ui";
import { CENTRO_BAGUA } from "@/features/viajes/constants/pasajero";
import { useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useCancelarViaje } from "@/features/viajes/hooks/use-cancelar-viaje";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useViajeEnVivo } from "@/features/viajes/hooks/use-viaje-en-vivo";
import { useConductorViaje } from "@/features/viajes/hooks/use-conductor-viaje";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { formatearSoles, NOMBRE_METODO_PAGO } from "@/features/viajes/utils/viaje";
import { escribirConductor } from "@/features/viajes/utils/contacto";
import { ModalCancelarViaje } from "../../components/ModalCancelarViaje";
import { supabase } from "@/shared/api/supabase";
import {
  contraofertaService,
  type ContraofertaViaje,
} from "@/features/viajes/services/contraofertaService";
import type { PuntoMapa } from "@/features/viajes/types/tiposMapa";
import { emitirNotificacionPush } from "@/features/notificaciones/services/notificacionesService";

// Si nadie acepta en este tiempo, se avisa que no hay conductores disponibles
const TIEMPO_MAXIMO_BUSQUEDA = 2 * 60 * 1000;

export default function PantallaBuscandoConductor() {
  const { colores } = useAltokkeTheme();
  const resumen = useResumenViaje();
  const { solicitarCancelacion, cancelando, modalVisible, cerrarModal, confirmarCancelación } = useCancelarViaje("buscando");

  const { viajeActivoId } = useViaje();
  const { viaje } = useViajeEnVivo(viajeActivoId);
  const conductorEncontrado = Boolean(viaje?.conductor_id);
  const conductor = useConductorViaje(viajeActivoId, viaje?.conductor_id);

  const [sinConductor, setSinConductor] = useState(false);
  const [intento, setIntento] = useState(0);
  const [conductoresEnLinea, setConductoresEnLinea] = useState<PuntoMapa[]>([]);
  const [ofertas, setOfertas] = useState<ContraofertaViaje[]>([]);
  const [aceptandoOfertaId, setAceptandoOfertaId] = useState<string | null>(null);

  // Emitir notificación push a conductores cercanos al solicitar el viaje
  useEffect(() => {
    if (viajeActivoId) {
      void emitirNotificacionPush({
        evento: "solicitud_viaje",
        viajeId: viajeActivoId,
      });
    }
  }, [viajeActivoId]);

  // Consulta en tiempo real de conductores en línea reales desde Supabase
  useEffect(() => {
    let activo = true;

    const cargarConductores = async () => {
      try {
        const { data, error } = await supabase
          .from("conductores_perfil")
          .select("usuario_id, lat_actual, lng_actual")
          .eq("en_linea", true)
          .eq("estado", "aprobado");

        if (!error && data && activo) {
          const mapeados: PuntoMapa[] = data
            .filter((c) => c.lat_actual != null && c.lng_actual != null)
            .map((c) => ({
              latitude: Number(c.lat_actual),
              longitude: Number(c.lng_actual),
            }));
          setConductoresEnLinea(mapeados);
        }
      } catch (err) {
        console.warn("Aviso consultando conductores en línea:", err);
      }
    };

    cargarConductores();
    const interval = setInterval(cargarConductores, 12000);

    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, []);

  // Suscripción Realtime a contraofertas de conductores para este viaje
  useEffect(() => {
    if (!viajeActivoId) return;

    let activo = true;

    const refrescarOfertas = async () => {
      const lista = await contraofertaService.obtenerOfertasViaje(viajeActivoId);
      if (activo) setOfertas(lista);
    };

    refrescarOfertas();
    const desuscribir = contraofertaService.suscribirOfertas(viajeActivoId, refrescarOfertas);

    return () => {
      activo = false;
      desuscribir();
    };
  }, [viajeActivoId]);

  const aceptarContraoferta = async (ofertaId: string) => {
    try {
      setAceptandoOfertaId(ofertaId);
      const res = await contraofertaService.seleccionarOferta(ofertaId);
      if (res?.success) {
        router.replace("/viaje-activo");
      } else {
        Alert.alert(
          "Oferta no disponible",
          "La contraoferta ha expirado o ya no está disponible."
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo aceptar la contraoferta.");
    } finally {
      setAceptandoOfertaId(null);
    }
  };

  useEffect(() => {
    if (conductorEncontrado) return;
    const espera = setTimeout(() => setSinConductor(true), TIEMPO_MAXIMO_BUSQUEDA);
    return () => clearTimeout(espera);
  }, [conductorEncontrado, intento]);

  const mostrarSinConductor = sinConductor && !conductorEncontrado;

  // Si se entra sin haber armado un viaje, se vuelve a pedir el destino
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const {
    origen,
    origenLugar,
    destino,
    servicio,
    metodoPago,
    tarifa,
    ruta,
  } = resumen;

  const verMiViaje = () => {
    router.replace("/viaje-activo");
  };

  const seguirBuscando = () => {
    setSinConductor(false);
    setIntento((n) => n + 1);
  };

  return (
    <GestureHandlerRootView style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <CabeceraFlujoViaje
        titulo={
          conductorEncontrado
            ? "Conductor encontrado"
            : "Buscando conductor"
        }
        subtitulo={
          conductorEncontrado
            ? "Tu conductor aceptó la solicitud"
            : "Estamos esperando una respuesta"
        }
        mostrarRegreso={false}
      />

      <View style={styles.zonaMapa}>
        <MapaBase
          centro={CENTRO_BAGUA}
          origen={origen}
          destino={destino.coordenadas}
          ruta={ruta}
          conductores={
            conductorEncontrado && conductor?.lat != null && conductor?.lng != null
              ? [{ latitude: conductor.lat, longitude: conductor.lng }]
              : conductoresEnLinea
          }
          margenInferior={0}
          style={styles.mapaCompleto}
        />

        <PanelDeslizableViaje
          posiciones={["28%", "60%", "90%"]}
          posicionInicial={1}
          footer={
            <View
              style={[
                styles.pieFijo,
                { backgroundColor: colores.superficie },
              ]}
            >
              {conductorEncontrado ? (
                <BotonPrincipal
                  titulo="Ver mi viaje"
                  mostrarIcono
                  icono="arrow-forward"
                  onPress={verMiViaje}
                />
              ) : (
                <Pressable
                  onPress={solicitarCancelacion}
                  disabled={cancelando}
                  style={({ pressed }) => [
                    styles.botonCancelar,
                    {
                      borderColor: colores.error,
                      backgroundColor: colores.superficie,
                      marginTop: 0,
                      marginBottom: 0,
                    },
                    (pressed || cancelando) && {
                      backgroundColor: colores.errorFondo,
                    },
                    cancelando && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.botonCancelarTexto,
                      { color: colores.error },
                    ]}
                  >
                    {cancelando ? "Cancelando..." : "Cancelar viaje"}
                  </Text>
                </Pressable>
              )}
            </View>
          }
        >

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contenido}
          >
            {conductorEncontrado ? (
              <>
                <View
                  style={[
                    styles.avisoEncontrado,
                    {
                      backgroundColor: colores.exitoFondo,
                      borderColor: colores.primario,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colores.exitoTexto}
                  />
                  <Text style={[styles.avisoTexto, { color: colores.texto }]}>
                    ¡Encontramos un conductor para ti!
                  </Text>
                </View>

                {/* Conductor */}
                <Text style={[styles.seccion, { color: colores.texto }]}>
                  Tu conductor
                </Text>
                <TarjetaConductor conductor={conductor} />

                <View style={styles.acciones}>
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Comunicación segura",
                        "Por tu seguridad y privacidad (Ley 29733), comunícate con tu conductor a través del chat de la app.",
                        [{ text: "Entendido" }]
                      );
                    }}
                    style={({ pressed }) => [
                      styles.accion,
                      { backgroundColor: colores.exitoFondo },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Ionicons name="call" size={18} color={colores.exitoTexto} />
                    <Text
                      style={[styles.accionTexto, { color: colores.exitoTexto }]}
                    >
                      Llamar
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => escribirConductor(conductor?.telefono)}
                    style={({ pressed }) => [
                      styles.accion,
                      { backgroundColor: colores.exitoFondo },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={18}
                      color={colores.exitoTexto}
                    />
                    <Text
                      style={[styles.accionTexto, { color: colores.exitoTexto }]}
                    >
                      Mensaje
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : mostrarSinConductor ? (
              <View
                style={[
                  styles.buscando,
                  styles.tarjetaEstado,
                  {
                    backgroundColor: colores.campo,
                    borderColor: colores.linea,
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={42}
                  color={colores.secundario}
                />
                <Text style={[styles.buscandoTitulo, { color: colores.texto }]}>
                  La búsqueda está tardando
                </Text>
                <Text
                  style={[
                    styles.buscandoDetalle,
                    { color: colores.secundario },
                  ]}
                >
                  Nadie aceptó tu viaje todavía. Puedes seguir esperando o cancelar.
                </Text>
                <View style={styles.botonSeguir}>
                  <BotonPrincipal titulo="Seguir buscando" onPress={seguirBuscando} />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.buscando,
                  styles.tarjetaEstado,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.linea,
                  },
                ]}
              >
                <PulsoBusqueda />
                <Text style={[styles.buscandoTitulo, { color: colores.texto }]}>
                  Buscando el mototaxi más cercano
                </Text>
                <Text
                  style={[
                    styles.buscandoDetalle,
                    { color: colores.secundario },
                  ]}
                >
                  Esto puede tardar unos segundos. No cierres la aplicación.
                </Text>
              </View>
            )}

            {/* Contraofertas entrantes en tiempo real */}
            {ofertas.length > 0 && !conductorEncontrado && (
              <View style={styles.seccionOfertas}>
                <Text style={[styles.tituloOfertas, { color: colores.texto }]}>
                  Contraofertas recibidas ({ofertas.length})
                </Text>
                {ofertas.map((of) => (
                  <View
                    key={of.id}
                    style={[
                      styles.tarjetaOferta,
                      {
                        backgroundColor: colores.superficie,
                        borderColor: colores.primario,
                      },
                    ]}
                  >
                    <View style={styles.ofertaInfo}>
                      <Text style={[styles.ofertaMonto, { color: colores.primario }]}>
                        S/ {of.tarifa_ofertada.toFixed(2)}
                      </Text>
                      <Text style={[styles.ofertaTiempo, { color: colores.secundario }]}>
                        Llega en ~{of.tiempo_llegada_min} min
                      </Text>
                    </View>
                    <View style={styles.ofertaBotones}>
                      <Pressable
                        style={[
                          styles.botonRechazarOferta,
                          { borderColor: colores.linea },
                        ]}
                        onPress={() =>
                          setOfertas((prev) => prev.filter((item) => item.id !== of.id))
                        }
                      >
                        <Text style={[styles.botonRechazarOfertaTexto, { color: colores.secundario }]}>
                          Ignorar
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.botonAceptarOferta,
                          { backgroundColor: colores.primario },
                          aceptandoOfertaId === of.id && { opacity: 0.7 },
                        ]}
                        onPress={() => aceptarContraoferta(of.id)}
                        disabled={aceptandoOfertaId === of.id}
                      >
                        {aceptandoOfertaId === of.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.botonAceptarOfertaTexto}>Aceptar oferta</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Resumen del viaje */}
            <Text style={[styles.seccion, { color: colores.texto }]}>
              Resumen del viaje
            </Text>
            <View
              style={[
                styles.tarjetaResumen,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.linea,
                },
              ]}
            >
              <View style={styles.filaLugar}>
                <Ionicons
                  name="radio-button-on"
                  size={18}
                  color={colores.exitoTexto}
                />
                <Text
                  style={[styles.lugarTexto, { color: colores.texto }]}
                  numberOfLines={1}
                >
                  {origenLugar.nombre}
                </Text>
              </View>

              <View style={styles.filaLugar}>
                <Ionicons
                  name="location-sharp"
                  size={18}
                  color={colores.error}
                />
                <Text
                  style={[styles.lugarTexto, { color: colores.texto }]}
                  numberOfLines={1}
                >
                  {destino.nombre}
                </Text>
              </View>

              <View
                style={[styles.separador, { backgroundColor: colores.linea }]}
              />

              <View style={styles.datos}>
                <View style={styles.dato}>
                  <Text
                    style={[styles.datoEtiqueta, { color: colores.secundario }]}
                  >
                    Servicio
                  </Text>
                  <Text
                    style={[styles.datoValor, { color: colores.texto }]}
                  >
                    {servicio === "express" ? "Express" : "Normal"}
                  </Text>
                </View>
                <View style={styles.dato}>
                  <Text
                    style={[styles.datoEtiqueta, { color: colores.secundario }]}
                  >
                    Pago
                  </Text>
                  <Text
                    style={[styles.datoValor, { color: colores.texto }]}
                  >
                    {NOMBRE_METODO_PAGO[metodoPago]}
                  </Text>
                </View>
                <View style={styles.dato}>
                  <Text
                    style={[styles.datoEtiqueta, { color: colores.secundario }]}
                  >
                    Tarifa
                  </Text>
                  <Text
                    style={[styles.datoValor, { color: colores.texto }]}
                  >
                    {formatearSoles(tarifa)}
                  </Text>
                </View>
              </View>
            </View>
          </BottomSheetScrollView>
        </PanelDeslizableViaje>
      </View>

      <ModalCancelarViaje
        visible={modalVisible}
        rol="pasajero"
        onConfirmar={confirmarCancelación}
        onCerrar={cerrarModal}
        cargando={cancelando}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  zonaMapa: {
    flex: 1,
    position: "relative",
  },

  mapaCompleto: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  pieFijo: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },

  contenido: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  buscando: {
    alignItems: "center",
    paddingTop: 8,
  },

  tarjetaEstado: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 6,
  },

  buscandoTitulo: {
    marginTop: 8,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },

  buscandoDetalle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  avisoEncontrado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },

  avisoTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },

  seccion: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "800",
  },

  acciones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  accion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 999,
  },

  accionTexto: {
    fontSize: 14,
    fontWeight: "700",
  },

  tarjetaResumen: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 28,
  },

  lugarTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },

  separador: {
    height: 1,
    marginVertical: 4,
  },

  datos: {
    flexDirection: "row",
    gap: 8,
  },

  dato: {
    flex: 1,
    gap: 5,
  },

  datoEtiqueta: {
    fontSize: 11,
  },

  datoValor: {
    fontSize: 14,
    fontWeight: "800",
  },

  botonCancelar: {
    height: 50,
    marginTop: 22,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
  },

  botonCancelarTexto: {
    fontSize: 15,
    fontWeight: "700",
  },

  botonSeguir: {
    alignSelf: "stretch",
    marginTop: 16,
  },

  seccionOfertas: {
    marginTop: 16,
    gap: 10,
  },

  tituloOfertas: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },

  tarjetaOferta: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  ofertaInfo: {
    flex: 1,
  },

  ofertaMonto: {
    fontSize: 20,
    fontWeight: "800",
  },

  ofertaTiempo: {
    fontSize: 12,
    marginTop: 2,
  },

  ofertaBotones: {
    flexDirection: "row",
    gap: 8,
  },

  botonRechazarOferta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  botonRechazarOfertaTexto: {
    fontSize: 12,
    fontWeight: "600",
  },

  botonAceptarOferta: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  botonAceptarOfertaTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
