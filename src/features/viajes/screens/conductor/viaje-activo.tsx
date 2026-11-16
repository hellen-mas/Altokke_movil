import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { conductorService } from "@/features/conductores/services/conductorService";
import { formatearSoles } from "@/features/viajes/utils/viaje";
import { CENTRO_BAGUA } from "@/features/viajes/constants/pasajero";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { ModalCancelarViaje } from "@/features/viajes/components/ModalCancelarViaje";
import { supabase } from "@/shared/api/supabase";

type EtapaViaje = "en_camino_origen" | "esperando_pasajero" | "en_viaje";

interface ViajeActivoConductor {
  id: string;
  estado: EtapaViaje;
  origenTexto: string;
  destinoTexto: string;
  tarifaEstimada: number;
  metodoPago: string;
  pagaCon: number | null;
  vueltoEstimado: number | null;
  pasajeroNombre: string;
  pasajeroCalificacion: number;
}

export default function ViajeActivoConductorScreen() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const { userId } = useAuth();
  const [viaje, setViaje] = useState<ViajeActivoConductor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [actualizandoFsm, setActualizandoFsm] = useState(false);

  const cargarDatos = async () => {
    if (!userId) return;
    try {
      const { data: viajeDb } = await supabase
        .from("viajes")
        .select("id, estado, origen_texto, destino_texto, tarifa_estimada, metodo_pago, pasajero_id")
        .eq("conductor_id", userId)
        .in("estado", ["aceptado", "en_camino_origen", "esperando_pasajero", "en_viaje"])
        .order("creado_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!viajeDb) {
        setViaje(null);
        return;
      }

      let nombrePasajero = "Pasajero Altokke";
      let calificacionPasajero = 5.0;
      if (viajeDb.pasajero_id) {
        const { data: usuarioP } = await supabase
          .from("usuarios")
          .select("nombre, apellidos")
          .eq("id", viajeDb.pasajero_id)
          .maybeSingle();
        const { data: perfilP } = await supabase
          .from("pasajeros_perfil")
          .select("calificacion_promedio")
          .eq("usuario_id", viajeDb.pasajero_id)
          .maybeSingle();
        if (usuarioP) {
          nombrePasajero = `${usuarioP.nombre || ""} ${usuarioP.apellidos || ""}`.trim() || nombrePasajero;
        }
        if (perfilP) {
          calificacionPasajero = perfilP.calificacion_promedio ?? 5.0;
        }
      }

      const estadoNormalizado: EtapaViaje =
        viajeDb.estado === "esperando_pasajero" || viajeDb.estado === "en_viaje"
          ? viajeDb.estado
          : "en_camino_origen";

      setViaje({
        id: viajeDb.id,
        estado: estadoNormalizado,
        origenTexto: viajeDb.origen_texto,
        destinoTexto: viajeDb.destino_texto,
        tarifaEstimada: Number(viajeDb.tarifa_estimada),
        metodoPago: viajeDb.metodo_pago ?? "efectivo",
        pagaCon: null,
        vueltoEstimado: null,
        pasajeroNombre: nombrePasajero,
        pasajeroCalificacion: calificacionPasajero,
      });
    } catch (error: unknown) {
      console.warn("Aviso al cargar viaje activo de conductor:", error);
      setViaje(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void cargarDatos());
    if (!userId) return;
    const canal = supabase
      .channel(`conductor_viaje_canal_${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "viajes" }, () => void cargarDatos())
      .subscribe();
    return () => { void supabase.removeChannel(canal); };
  }, [userId]);

  const cambiarEtapaFsm = async (nuevoEstado: EtapaViaje) => {
    if (!viaje?.id || actualizandoFsm) return;
    setActualizandoFsm(true);
    try {
      await conductorService.cambiarEstadoViaje(viaje.id, nuevoEstado);
      setViaje((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el estado";
      Alert.alert("Aviso", msg);
    } finally {
      setActualizandoFsm(false);
    }
  };

  const ejecutarFinalizarViaje = () => {
    if (!viaje?.id || finalizando) return;
    Alert.alert("Finalizar carrera", "¿Confirmas que el pasajero llegó a su destino y recibiste el pago?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, finalizar carrera",
        onPress: async () => {
          setFinalizando(true);
          try {
            await conductorService.finalizarViaje(viaje.id);
            Alert.alert("¡Carrera completada!", "El viaje ha sido registrado como finalizado.", [
              { text: "Aceptar", onPress: () => router.replace("/(conductor)/solicitudes") },
            ]);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al finalizar el viaje";
            Alert.alert("Aviso", msg);
          } finally {
            setFinalizando(false);
          }
        },
      },
    ]);
  };

  const confirmarCancelacionConductor = async (motivo: string) => {
    if (!viaje?.id || cancelando) return;
    setCancelando(true);
    try {
      const res = await conductorService.cancelarViajeConductor(viaje.id, motivo.trim());
      setModalCancelarVisible(false);
      setViaje(null);
      Alert.alert("Viaje cancelado", res.reabierto ? "Solicitud reabierta." : "Viaje cancelado.", [
        { text: "Aceptar", onPress: () => router.replace("/(conductor)/solicitudes") },
      ]);
    } catch (error: unknown) {
      Alert.alert("Error", error instanceof Error ? error.message : "Error al cancelar");
    } finally {
      setCancelando(false);
    }
  };

  const abrirNavegacionGps = () => {
    if (!viaje) return;
    const destinoEncoded = encodeURIComponent(`${viaje.destinoTexto}, Bagua, Amazonas, Peru`);
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destinoEncoded}`);
  };

  if (cargando) {
    return (
      <View style={[styles.pantalla, styles.centro]}>
        <ActivityIndicator size="large" color={c.primario} />
        <Text style={styles.textoCargando}>Cargando viaje activo...</Text>
      </View>
    );
  }

  if (!viaje) {
    return (
      <View style={[styles.pantalla, styles.centro]}>
        <Ionicons name="car-outline" size={64} color={c.textoSec} />
        <Text style={styles.sinViajeTitulo}>Sin viaje activo</Text>
        <Text style={styles.sinViajeDesc}>No tienes ninguna carrera en curso en este momento.</Text>
        <Pressable style={styles.botonIrSolicitudes} onPress={() => router.replace("/(conductor)/solicitudes")}>
          <Text style={styles.botonIrSolicitudesTexto}>Ver solicitudes disponibles</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <CabeceraConductor titulo="Viaje en curso" mostrarMarca mostrarAtras={false} compacta />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mapaContainer}>
          <MapaBase centro={CENTRO_BAGUA} interactivo={false} style={styles.mapa} />
        </View>

        <View style={styles.estadoBanner}>
          <View style={styles.puntoPulso} />
          <Text style={styles.estadoBannerTexto}>
            {viaje.estado === "en_camino_origen"
              ? "EN CAMINO AL RECOJO"
              : viaje.estado === "esperando_pasajero"
                ? "ESPERANDO AL PASAJERO"
                : "EN VIAJE HACIA EL DESTINO"}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.pasajeroHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{viaje.pasajeroNombre.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pasajeroNombre}>{viaje.pasajeroNombre}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Ionicons name="star" size={15} color={c.ambar} />
                <Text style={{ fontSize: 13, color: c.textoSec, fontWeight: "600" }}>{viaje.pasajeroCalificacion.toFixed(1)}</Text>
              </View>
            </View>
            <Pressable style={styles.botonGps} onPress={abrirNavegacionGps}>
              <Ionicons name="navigate-circle" size={32} color={c.primario} />
              <Text style={{ fontSize: 10, fontWeight: "800", color: c.primario }}>GPS</Text>
            </Pressable>
          </View>

          <View style={styles.divisor} />
          <Text style={styles.rutaEtiqueta}>Recojo</Text>
          <Text style={styles.rutaNombre}>{viaje.origenTexto}</Text>
          <View style={{ height: 8 }} />
          <Text style={styles.rutaEtiqueta}>Destino</Text>
          <Text style={styles.rutaNombre}>{viaje.destinoTexto}</Text>

          <View style={styles.divisor} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={styles.rutaEtiqueta}>Total a cobrar</Text>
              <Text style={styles.tarifaMonto}>{formatearSoles(viaje.tarifaEstimada)}</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: c.texto }}>{viaje.metodoPago.toUpperCase()}</Text>
          </View>
        </View>

        {viaje.estado === "en_camino_origen" && (
          <Pressable
            style={[styles.botonFsm, actualizandoFsm && { opacity: 0.6 }]}
            onPress={() => void cambiarEtapaFsm("esperando_pasajero")}
            disabled={actualizandoFsm}
          >
            <Text style={styles.botonFsmTexto}>Ya llegué al punto de recojo</Text>
          </Pressable>
        )}

        {viaje.estado === "esperando_pasajero" && (
          <Pressable
            style={[styles.botonFsm, actualizandoFsm && { opacity: 0.6 }]}
            onPress={() => void cambiarEtapaFsm("en_viaje")}
            disabled={actualizandoFsm}
          >
            <Text style={styles.botonFsmTexto}>Iniciar viaje con pasajero a bordo</Text>
          </Pressable>
        )}

        {viaje.estado === "en_viaje" && (
          <Pressable
            style={[styles.botonFinalizar, finalizando && { opacity: 0.6 }]}
            onPress={ejecutarFinalizarViaje}
            disabled={finalizando}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.botonFinalizarTexto}>{finalizando ? "Finalizando..." : "Finalizar carrera"}</Text>
          </Pressable>
        )}

        <Pressable style={styles.botonCancelar} onPress={() => setModalCancelarVisible(true)}>
          <Text style={styles.botonCancelarTexto}>Cancelar carrera</Text>
        </Pressable>
      </ScrollView>

      <ModalCancelarViaje
        visible={modalCancelarVisible}
        rol="conductor"
        onConfirmar={confirmarCancelacionConductor}
        onCerrar={() => setModalCancelarVisible(false)}
        cargando={cancelando}
      />
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    centro: { alignItems: "center", justifyContent: "center", padding: 24 },
    textoCargando: { marginTop: 16, fontSize: 15, color: c.textoSec },
    sinViajeTitulo: { fontSize: 20, fontWeight: "700", color: c.texto, marginTop: 16, marginBottom: 8 },
    sinViajeDesc: { fontSize: 14, color: c.textoSec, textAlign: "center", marginBottom: 24 },
    botonIrSolicitudes: { backgroundColor: c.primario, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    botonIrSolicitudesTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 36 },
    mapaContainer: { height: 180, borderRadius: 14, overflow: "hidden", marginBottom: 14 },
    mapa: { flex: 1 },
    estadoBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.superficie,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.borde,
    },
    puntoPulso: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primario },
    estadoBannerTexto: { fontSize: 12, fontWeight: "800", color: c.primario, letterSpacing: 0.5 },
    card: { backgroundColor: c.superficie, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: c.borde },
    pasajeroHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primarioSuave, alignItems: "center", justifyContent: "center" },
    avatarTexto: { fontSize: 16, fontWeight: "700", color: c.primario },
    pasajeroNombre: { fontSize: 16, fontWeight: "700", color: c.texto },
    botonGps: { alignItems: "center" },
    divisor: { height: StyleSheet.hairlineWidth, backgroundColor: c.borde, marginVertical: 12 },
    rutaEtiqueta: { fontSize: 11, textTransform: "uppercase", fontWeight: "600", color: c.textoSec },
    rutaNombre: { fontSize: 14, fontWeight: "600", color: c.texto, marginTop: 2 },
    tarifaMonto: { fontSize: 22, fontWeight: "800", color: c.texto, fontVariant: ["tabular-nums"] },
    botonFsm: { backgroundColor: c.primario, paddingVertical: 14, borderRadius: 10, alignItems: "center", marginBottom: 12 },
    botonFsmTexto: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
    botonFinalizar: { backgroundColor: c.primario, paddingVertical: 14, borderRadius: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
    botonFinalizarTexto: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
    botonCancelar: { paddingVertical: 10, alignItems: "center" },
    botonCancelarTexto: { color: c.error, fontSize: 14, fontWeight: "600" },
  });
