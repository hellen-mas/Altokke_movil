import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { conductorService } from "@/features/conductores/services/conductorService";
import {
  useTemaConductor,
  type ColoresConductor,
} from "@/features/conductores/theme/temaConductor";
import { BarraProgresoViaje } from "@/features/viajes/components/BarraProgresoViaje";
import { IconoMototaxi } from "@/features/viajes/components/IconoMototaxi";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { ModalCancelarViaje } from "@/features/viajes/components/ModalCancelarViaje";
import { CENTRO_BAGUA } from "@/features/viajes/constants/pasajero";
import { formatearSoles } from "@/shared/utils/formato";

// El tipo del viaje sale directo de lo que devuelve el servicio 
type ViajeConductor = NonNullable<
  Awaited<ReturnType<typeof conductorService.obtenerViajeActivoConductor>>
>;

type EstadoIntermedio = "en_camino_origen" | "esperando_pasajero" | "en_viaje";

// Columnas del "vuelto inteligente" (migración de Juan); aún no están en los tipos generados
type DatosVuelto = { paga_con?: number | null; vuelto_estimado?: number | null };

/** Saca el texto de un error, venga de JavaScript o de Supabase (que NO es instancia de Error) */
function mensajeDeError(error: unknown, porDefecto: string): string {
  return (error as { message?: string } | null)?.message ?? porDefecto;
}

/** Qué botón mostrar en cada estado y a qué estado lleva */
const ACCION_POR_ESTADO: Record<
  string,
  { texto: string; icono: keyof typeof Ionicons.glyphMap; siguiente: EstadoIntermedio | "finalizado" }
> = {
  aceptado: { texto: "Voy en camino al pasajero", icono: "navigate", siguiente: "en_camino_origen" },
  en_camino_origen: { texto: "Llegué al punto de encuentro", icono: "location", siguiente: "esperando_pasajero" },
  esperando_pasajero: { texto: "Iniciar viaje", icono: "play", siguiente: "en_viaje" },
  en_viaje: { texto: "Finalizar carrera", icono: "flag", siguiente: "finalizado" },
};

/** Posición de cada estado en la barra de progreso */
const ETAPA_POR_ESTADO: Record<string, number> = {
  aceptado: 0,
  en_camino_origen: 1,
  esperando_pasajero: 2,
  en_viaje: 3,
  finalizado: 4,
};

const ETAPAS_CONDUCTOR = ["Aceptado", "En camino", "Esperando", "En viaje", "Llegó"];

/** Texto del encabezado según la etapa */
const TITULO_POR_ESTADO: Record<string, { titulo: string; descripcion: string }> = {
  aceptado: { titulo: "Viaje aceptado", descripcion: "Avisa cuando salgas a recoger al pasajero" },
  en_camino_origen: { titulo: "En camino al pasajero", descripcion: "Dirígete al punto de recogida" },
  esperando_pasajero: { titulo: "Esperando al pasajero", descripcion: "Ya estás en el punto de encuentro" },
  en_viaje: { titulo: "En ruta al destino", descripcion: "Lleva al pasajero a su destino" },
  finalizado: { titulo: "Viaje finalizado", descripcion: "Cobra al pasajero y cierra el viaje" },
};

const ESTADOS_CANCELABLES = ["aceptado", "en_camino_origen", "esperando_pasajero"];

export default function ViajeActivoConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const { userId } = useAuth();
  const [viaje, setViaje] = useState<ViajeConductor | null>(null);
  const [pasajeroCargado, setPasajeroCargado] = useState<{ viajeId: string; nombre: string | null } | null>(null);
  const [cargandoViaje, setCargandoViaje] = useState(true);
  const [avanzando, setAvanzando] = useState(false);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  // 1. Cargar el viaje activo CADA VEZ que se entra a la pantalla.
  //    Es una pestaña: queda montada, así que un useEffect normal solo cargaría la primera vez
  //    y al aceptar un segundo viaje se vería el anterior.
  useFocusEffect(
    useCallback(() => {
      let componenteActivo = true;

      const cargarViajeActivo = async () => {
        if (!userId) {
          setViaje(null);
          setCargandoViaje(false);
          return;
        }
        try {
          const datos = await conductorService.obtenerViajeActivoConductor(userId);
          // Si ya se muestra la tarjeta de cobro, no se borra al volver a la pantalla
          if (componenteActivo) {
            setViaje((anterior) => (anterior?.estado === "finalizado" && !datos ? anterior : datos));
          }
        } catch (error) {
          console.error("Error al recuperar el viaje del conductor:", error);
          if (componenteActivo) setViaje(null);
        } finally {
          if (componenteActivo) setCargandoViaje(false);
        }
      };

      void cargarViajeActivo();
      return () => {
        componenteActivo = false;
      };
    }, [userId])
  );

  // 2. Nombre del pasajero (RPC obtener_pasajero_viaje de Juan; si falla, se muestra "Pasajero")
  //    Se guarda junto con el id del viaje: así nunca se muestra el nombre de un viaje anterior.
  const viajeId = viaje?.id ?? null;
  useEffect(() => {
    if (!viajeId) return;
    let activo = true;
    void conductorService.obtenerPasajeroViaje(viajeId).then((pasajero) => {
      if (activo) setPasajeroCargado({ viajeId, nombre: pasajero?.nombreCompleto || null });
    });
    return () => {
      activo = false;
    };
  }, [viajeId]);
  const nombrePasajero = pasajeroCargado?.viajeId === viajeId ? pasajeroCargado.nombre : null;

  // 3. Avanzar a la siguiente etapa con los RPC
  const ejecutarAvance = async () => {
    if (!viaje) return;
    const accion = ACCION_POR_ESTADO[viaje.estado ?? ""];
    if (!accion) return;

    setAvanzando(true);
    try {
      if (accion.siguiente === "finalizado") {
        // La tarifa final la fija el servidor; aquí no se envía ningún monto
        await conductorService.finalizarViaje(viaje.id);
        setViaje({ ...viaje, estado: "finalizado" });
      } else {
        const resultado = await conductorService.cambiarEstadoViaje(viaje.id, accion.siguiente);
        setViaje({ ...viaje, estado: resultado.estado_nuevo as ViajeConductor["estado"] });
      }
    } catch (error) {
      console.error("Error al avanzar la etapa del viaje:", error);
      Alert.alert("No se pudo actualizar el viaje", mensajeDeError(error, "Inténtalo de nuevo."));
    } finally {
      setAvanzando(false);
    }
  };

  const avanzarEtapa = () => {
    if (!viaje || avanzando) return;
    // Finalizar no tiene vuelta atrás: se pide confirmación
    if (viaje.estado === "en_viaje") {
      Alert.alert("Finalizar carrera", "¿Confirmas que llegaste al destino?", [
        { text: "Todavía no", style: "cancel" },
        { text: "Finalizar", onPress: () => void ejecutarAvance() },
      ]);
      return;
    }
    void ejecutarAvance();
  };

  // 4. Cancelación con motivo
  const puedeCancelar = Boolean(viaje) && ESTADOS_CANCELABLES.includes(viaje?.estado ?? "");

  const confirmarCancelacionConductor = async (motivo: string) => {
    if (!viaje || cancelando) return;
    if (!motivo.trim()) {
      Alert.alert("Motivo requerido", "Debes seleccionar un motivo de cancelación.");
      return;
    }
    setCancelando(true);
    try {
      const resultado = await conductorService.cancelarViajeConductor(viaje.id, motivo.trim());
      setModalCancelarVisible(false);
      setViaje(null);
      Alert.alert(
        "Viaje cancelado",
        resultado.reabierto
          ? "La solicitud volvió a estar disponible para otros conductores."
          : "El viaje fue cancelado correctamente.",
        [{ text: "Aceptar", onPress: () => router.replace("/solicitudes") }]
      );
    } catch (error) {
      console.error("Error al cancelar el viaje del conductor:", error);
      Alert.alert(
        "No se pudo cancelar",
        mensajeDeError(error, "Ocurrió un problema al cancelar el viaje.")
      );
    } finally {
      setCancelando(false);
    }
  };

  // ESTADO: cargando
  if (cargandoViaje) {
    return (
      <View style={styles.pantalla}>
        <CabeceraConductor titulo="Viaje activo" mostrarMarca mostrarAtras={false} compacta />
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={c.primario} />
          <Text style={styles.centroTexto}>Verificando tu viaje...</Text>
        </View>
      </View>
    );
  }

  // ESTADO: no hay viaje activo
  if (!viaje) {
    return (
      <View style={styles.pantalla}>
        <CabeceraConductor titulo="Viaje activo" mostrarMarca mostrarAtras={false} compacta />
        <View style={styles.centro}>
          <IconoMototaxi size={52} color={c.textoSec} />
          <Text style={styles.centroTitulo}>No tienes un viaje activo</Text>
          <Text style={styles.centroTexto}>Acepta una solicitud para empezar un viaje.</Text>
          <Pressable style={styles.botonEtapa} onPress={() => router.replace("/solicitudes")}>
            <Text style={styles.botonEtapaTexto}>Ver solicitudes</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ESTADO: viaje en curso
  const accion = ACCION_POR_ESTADO[viaje.estado ?? ""];
  const encabezado = TITULO_POR_ESTADO[viaje.estado ?? ""] ?? TITULO_POR_ESTADO.aceptado;
  const origen = { latitude: viaje.origen_lat, longitude: viaje.origen_lng };
  const destino = { latitude: viaje.destino_lat, longitude: viaje.destino_lng };
  const distancia = viaje.distancia_km != null ? `${Number(viaje.distancia_km).toFixed(1)} km` : "—";
  const metodoPago = viaje.metodo_pago === "efectivo" || !viaje.metodo_pago ? "Pago en efectivo" : viaje.metodo_pago;

  // Datos para la tarjeta de cobro (HU-7.2): la tarifa final la fija el servidor al finalizar
  const montoCobro = Number(viaje.tarifa_final ?? viaje.tarifa_estimada);
  const { paga_con: pagaCon, vuelto_estimado: vueltoEstimado } = viaje as ViajeConductor & DatosVuelto;
  const vuelto =
    vueltoEstimado != null
      ? Number(vueltoEstimado)
      : pagaCon != null
        ? Math.max(Number(pagaCon) - montoCobro, 0)
        : null;

  const confirmarEfectivoRecibido = () => {
    Alert.alert(
      "Confirmar cobro",
      `¿Recibiste ${formatearSoles(montoCobro)} en efectivo?`,
      [
        { text: "Todavía no", style: "cancel" },
        {
          text: "Sí, recibido",
          onPress: () => {
            setViaje(null);
            router.replace("/solicitudes");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.pantalla}>
      <CabeceraConductor titulo="Viaje activo" mostrarMarca mostrarAtras={false} compacta />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO DE LA ETAPA */}
        <View style={styles.estadoRuta}>
          <View style={styles.estadoIcono}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.estadoInformacion}>
            <Text style={styles.estadoTitulo}>{encabezado.titulo}</Text>
            <Text style={styles.estadoDescripcion}>{encabezado.descripcion}</Text>
          </View>
        </View>

        {/* BARRA DE PROGRESO */}
        <BarraProgresoViaje
          etapaActual={ETAPA_POR_ESTADO[viaje.estado ?? ""] ?? 0}
          etapas={ETAPAS_CONDUCTOR}
        />

        {/* MAPA */}
        <View style={styles.mapaContainer}>
          <MapaBase
            centro={CENTRO_BAGUA}
            origen={origen}
            destino={destino}
            interactivo={false}
            style={styles.mapa}
          />
        </View>

        {/* DETALLES */}
        <Text style={styles.seccionTitulo}>Detalles del viaje</Text>

        <View style={styles.detalles}>
          <View style={styles.pasajeroFila}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={c.primario} />
            </View>
            <View style={styles.pasajeroInformacion}>
              <Text style={styles.pasajeroNombre}>{nombrePasajero ?? "Pasajero"}</Text>
              <Text style={styles.calificacionTexto}>{metodoPago}</Text>
            </View>
          </View>

          <View style={styles.divisor} />

          <View style={styles.ubicacionFila}>
            <View style={styles.iconoVerde}>
              <Ionicons name="radio-button-on" size={18} color={c.primario} />
            </View>
            <View style={styles.ubicacionTexto}>
              <Text style={styles.etiqueta}>Recogida</Text>
              <Text style={styles.valorUbicacion}>{viaje.origen_texto}</Text>
            </View>
          </View>

          <View style={styles.ubicacionFila}>
            <View style={styles.iconoRojo}>
              <Ionicons name="location" size={18} color={c.error} />
            </View>
            <View style={styles.ubicacionTexto}>
              <Text style={styles.etiqueta}>Destino</Text>
              <Text style={styles.valorUbicacion}>{viaje.destino_texto}</Text>
            </View>
          </View>

          <View style={styles.divisor} />

          <View style={styles.resumenViaje}>
            <View style={styles.resumenItem}>
              <Ionicons name="cash-outline" size={20} color={c.primario} />
              <Text style={styles.resumenEtiqueta}>Tarifa</Text>
              <Text style={styles.resumenValor}>{formatearSoles(Number(viaje.tarifa_estimada))}</Text>
            </View>
            <View style={styles.separadorVertical} />
            <View style={styles.resumenItem}>
              <Ionicons name="navigate-outline" size={20} color={c.primario} />
              <Text style={styles.resumenEtiqueta}>Distancia</Text>
              <Text style={styles.resumenValor}>{distancia}</Text>
            </View>
          </View>
        </View>

        {/* ACCIONES */}
        <View style={styles.acciones}>
          {/* Botón de la siguiente etapa (no aparece cuando ya está finalizado) */}
          {accion && (
            <Pressable
              style={[styles.botonEtapa, avanzando && { opacity: 0.7 }]}
              onPress={avanzarEtapa}
              disabled={avanzando}
            >
              {avanzando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name={accion.icono} size={18} color="#FFFFFF" />
                  <Text style={styles.botonEtapaTexto}>{accion.texto}</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Viaje finalizado: tarjeta de cobro en efectivo (HU-7.2) */}
          {viaje.estado === "finalizado" && (
            <View style={styles.cobroTarjeta}>
              <View style={styles.cobroIcono}>
                <Ionicons name="cash" size={26} color={c.primario} />
              </View>
              <Text style={styles.cobroEtiqueta}>Cobra al pasajero</Text>
              <Text style={styles.cobroMonto}>{formatearSoles(montoCobro)}</Text>

              <View style={styles.cobroDesglose}>
                <View style={styles.cobroFila}>
                  <Text style={styles.cobroFilaTexto}>Tarifa del viaje</Text>
                  <Text style={styles.cobroFilaValor}>{formatearSoles(montoCobro)}</Text>
                </View>
                <View style={styles.cobroFila}>
                  <Text style={styles.cobroFilaTexto}>Distancia recorrida</Text>
                  <Text style={styles.cobroFilaValor}>{distancia}</Text>
                </View>
                <View style={styles.cobroFila}>
                  <Text style={styles.cobroFilaTexto}>Método de pago</Text>
                  <Text style={styles.cobroFilaValor}>Efectivo</Text>
                </View>
                {pagaCon != null && (
                  <View style={styles.cobroFila}>
                    <Text style={styles.cobroFilaTexto}>Paga con</Text>
                    <Text style={styles.cobroFilaValor}>{formatearSoles(Number(pagaCon))}</Text>
                  </View>
                )}
                {vuelto != null && (
                  <View style={[styles.cobroFila, styles.cobroFilaDestacada]}>
                    <Text style={styles.cobroVueltoTexto}>Vuelto a entregar</Text>
                    <Text style={styles.cobroVueltoValor}>{formatearSoles(vuelto)}</Text>
                  </View>
                )}
              </View>

              <Pressable style={[styles.botonEtapa, styles.cobroBoton]} onPress={confirmarEfectivoRecibido}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.botonEtapaTexto}>Efectivo recibido</Text>
              </Pressable>
            </View>
          )}

          {puedeCancelar && (
            <Pressable
              style={[styles.botonCancelar, cancelando && { opacity: 0.5 }]}
              disabled={cancelando || avanzando}
              onPress={() => setModalCancelarVisible(true)}
            >
              <Ionicons name="close-circle-outline" size={19} color={c.error} />
              <Text style={styles.botonCancelarTexto}>Cancelar viaje</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <ModalCancelarViaje
        visible={modalCancelarVisible}
        rol="conductor"
        onConfirmar={confirmarCancelacionConductor}
        onCerrar={() => {
          if (!cancelando) setModalCancelarVisible(false);
        }}
        cargando={cancelando}
      />
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: c.fondo,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },

  /* Estado */

  estadoRuta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 14,
    backgroundColor: c.botonOscuro,
    marginBottom: 14,
  },

  estadoIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginRight: 11,
  },

  estadoInformacion: {
    flex: 1,
  },

  estadoTitulo: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  estadoDescripcion: {
    marginTop: 2,
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
  },

  tiempoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: c.superficie,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },

  tiempoTexto: {
    color: c.primario,
    fontSize: 12,
    fontWeight: "800",
  },

  /* Mapa */

  mapaContainer: {
    height: 270,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.borde,
    marginBottom: 20,
  },

  mapa: {
    width: "100%",
    height: "100%",
  },

  /* Sección */

  seccionTitulo: {
    color: c.texto,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 12,
  },

  detalles: {
    backgroundColor: c.superficie,
    borderWidth: 1,
    borderColor: c.borde,
    borderRadius: 14,
    padding: 16,
  },

  /* Pasajero */

  pasajeroFila: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primarioSuave,
    marginRight: 11,
  },

  avatarTexto: {
    color: c.primario,
    fontSize: 14,
    fontWeight: "800",
  },

  pasajeroInformacion: {
    flex: 1,
  },

  pasajeroNombre: {
    color: c.texto,
    fontSize: 16,
    fontWeight: "800",
  },

  calificacionFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },

  calificacionTexto: {
    color: c.textoSec,
    fontSize: 12,
  },

  accionesPasajero: {
    flexDirection: "row",
    gap: 7,
  },

  accionCircular: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primarioSuave,
  },

  divisor: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.borde,
    marginVertical: 15,
  },

  /* Ubicaciones */

  ubicacionFila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  iconoVerde: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primarioSuave,
    marginRight: 11,
  },

  iconoRojo: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.errorSuave,
    marginRight: 11,
  },

  ubicacionTexto: {
    flex: 1,
  },

  etiqueta: {
    color: c.textoSec,
    fontSize: 11,
  },

  valorUbicacion: {
    color: c.texto,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },

  /* Datos */

  resumenViaje: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  resumenItem: {
    flex: 1,
  },

  resumenEtiqueta: {
    marginTop: 5,
    fontSize: 10,
    color: c.textoSec,
  },

  resumenValor: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: c.texto,
  },

  resumenDetalle: {
    marginTop: 2,
    fontSize: 9,
    color: c.textoSec,
  },

  separadorVertical: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
    backgroundColor: c.borde,
  },

  /* Botones */

  botones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  botonRuta: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borde,
    backgroundColor: c.superficie,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  botonRutaTexto: {
    color: c.texto,
    fontSize: 14,
    fontWeight: "700",
  },

  botonFinalizar: {
    flex: 1.35,
    height: 52,
    borderRadius: 12,
    backgroundColor: c.primario,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  botonFinalizarTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  botonCancelar: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borde,
    backgroundColor: c.errorSuave,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  botonCancelarTexto: {
    color: c.error,
    fontSize: 14,
    fontWeight: "700",
  },

  acciones: {
    marginTop: 16,
    gap: 10,
  },

  botonEtapa: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 20,
    backgroundColor: c.primario,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  botonEtapaTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },

  centroTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: c.texto,
  },

  centroTexto: {
    fontSize: 13,
    textAlign: "center",
    color: c.textoSec,
    marginBottom: 8,
  },

  cobroTarjeta: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: c.superficie,
    borderWidth: 1,
    borderColor: c.borde,
  },

  cobroIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primarioSuave,
    marginBottom: 10,
  },

  cobroEtiqueta: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textoSec,
  },

  cobroMonto: {
    marginTop: 4,
    fontSize: 36,
    fontWeight: "800",
    color: c.texto,
  },

  cobroDesglose: {
    width: "100%",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.borde,
    gap: 10,
  },

  cobroFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cobroFilaTexto: {
    fontSize: 13,
    color: c.textoSec,
  },

  cobroFilaValor: {
    fontSize: 13,
    fontWeight: "700",
    color: c.texto,
  },

  cobroFilaDestacada: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: c.ambarSuave,
  },

  cobroVueltoTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: c.ambar,
  },

  cobroVueltoValor: {
    fontSize: 15,
    fontWeight: "800",
    color: c.ambar,
  },

  cobroBoton: {
    alignSelf: "stretch",
    marginTop: 18,
  },
});
