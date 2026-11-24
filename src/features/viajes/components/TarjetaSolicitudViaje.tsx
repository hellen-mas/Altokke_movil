import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import type { SolicitudViajeItem } from "../hooks/use-solicitudes-conductor";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { type ColoresConductor, useTemaConductor } from "@/features/conductores/theme/temaConductor";
import { formatearSoles } from "@/shared/utils/formato";
import { contraofertaService } from "@/features/viajes/services/contraofertaService";
import { emitirNotificacionPush } from "@/features/notificaciones/services/notificacionesService";

//Se reexporta para que quien use la tarjeta pueda usar el tipo de dato de la solicitud de viaje desde aqui
export type { SolicitudViajeItem }

export interface TarjetaSolicitudViajeProps {
  solicitud: SolicitudViajeItem;
  onAceptar: (viajeId: string) => Promise<void> | void;
  onRechazar: (viajeId: string) => void;
  aceptando?: boolean;
}

//Hace cuanto se creó la solicitud de viaje "ahora", "hace ... minutos", etc.

function tiempoTranscurrido(fechaCreacion: string): string {
    const minutos = Math.floor((Date.now() - new Date(fechaCreacion).getTime()) / 60000);
    if (!Number.isFinite(minutos) || minutos < 1) return "Ahora";
    return `Hace ${minutos} min`;
}


/** "efectivo" → "Efectivo"; si no viene, se asume efectivo */
function textoMetodoPago(metodo: string | null): string {
  if (!metodo) return "Efectivo";
  return metodo.charAt(0).toUpperCase() + metodo.slice(1);
}

/** Tarjeta de una solicitud de viaje para el conductor (HU-3.1) */
export function TarjetaSolicitudViaje({
  solicitud,
  onAceptar,
  onRechazar,
  aceptando = false,
}: TarjetaSolicitudViajeProps) {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);

  const [mostrarContraoferta, setMostrarContraoferta] = useState(false);
  const [tarifaOfertada, setTarifaOfertada] = useState<number>(() =>
    Math.round(solicitud.tarifaEstimada + 1)
  );
  const [enviandoOferta, setEnviandoOferta] = useState(false);

  const enviarContraoferta = async () => {
    const validacion = contraofertaService.validarLimitesContraoferta(
      tarifaOfertada,
      solicitud.tarifaEstimada
    );

    if (!validacion.valido) {
      Alert.alert("Límite regulado", validacion.razon || "Tarifa no permitida");
      return;
    }

    try {
      setEnviandoOferta(true);
      const res = await contraofertaService.crearContraoferta({
        viajeId: solicitud.id,
        tarifaOfertada,
      });

      if (res.success) {
        void emitirNotificacionPush({
          evento: "contraoferta",
          viajeId: solicitud.id,
          mensaje: `Un conductor te propuso S/ ${tarifaOfertada.toFixed(2)}`,
        });
        Alert.alert(
          "Contraoferta enviada",
          `Ofreciste S/ ${tarifaOfertada.toFixed(2)}. El pasajero decidirá si acepta.`
        );
        setMostrarContraoferta(false);
      } else {
        Alert.alert("Aviso", res.mensaje || "No se pudo registrar la contraoferta.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo enviar la contraoferta.");
    } finally {
      setEnviandoOferta(false);
    }
  };

  const distancia =
    solicitud.distanciaKm != null ? `${solicitud.distanciaKm.toFixed(1)} km` : "—";

  return (
    <View style={styles.tarjeta}>
      {/* CABECERA */}
      <View style={styles.cabecera}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={c.primario} />
        </View>
        <View style={styles.cabeceraTextos}>
          <Text style={styles.titulo}>Nueva solicitud</Text>
          <Text style={styles.subtitulo}>{tiempoTranscurrido(solicitud.creadoEn)}</Text>
        </View>
        <Text style={styles.tarifa}>{formatearSoles(solicitud.tarifaEstimada)}</Text>
      </View>

      <View style={styles.divisor} />

      {/* RECOGIDA */}
      <View style={styles.ubicacionFila}>
        <View style={[styles.iconoUbicacion, { backgroundColor: c.primarioSuave }]}>
          <Ionicons name="radio-button-on" size={16} color={c.primario} />
        </View>
        <View style={styles.ubicacionContenido}>
          <Text style={styles.ubicacionEtiqueta}>Recogida</Text>
          <Text style={styles.ubicacionValor} numberOfLines={2}>
            {solicitud.origenTexto}
          </Text>
        </View>
      </View>

      {/* DESTINO */}
      <View style={styles.ubicacionFila}>
        <View style={[styles.iconoUbicacion, { backgroundColor: c.errorSuave }]}>
          <Ionicons name="location" size={16} color={c.error} />
        </View>
        <View style={styles.ubicacionContenido}>
          <Text style={styles.ubicacionEtiqueta}>Destino</Text>
          <Text style={styles.ubicacionValor} numberOfLines={2}>
            {solicitud.destinoTexto}
          </Text>
        </View>
      </View>

      {/* DATOS */}
      <View style={styles.datosFila}>
        <View style={styles.dato}>
          <Ionicons name="navigate-outline" size={16} color={c.primario} />
          <Text style={styles.datoTexto}>{distancia}</Text>
        </View>
        <View style={styles.dato}>
          <Ionicons name="cash-outline" size={16} color={c.primario} />
          <Text style={styles.datoTexto}>{textoMetodoPago(solicitud.metodoPago)}</Text>
        </View>
      </View>

      {/* CONTRAOFERTA EXPANDIBLE */}
      {mostrarContraoferta && (
        <View style={styles.seccionContraoferta}>
          <Text style={styles.etiquetaContraoferta}>Proponer tarifa al pasajero:</Text>
          <View style={styles.stepperFila}>
            <Pressable
              style={styles.botonPaso}
              onPress={() => setTarifaOfertada((t) => Math.max(2.5, t - 0.5))}
            >
              <Ionicons name="remove" size={18} color={c.texto} />
            </Pressable>
            <Text style={styles.textoTarifaOfertada}>S/ {tarifaOfertada.toFixed(2)}</Text>
            <Pressable
              style={styles.botonPaso}
              onPress={() => setTarifaOfertada((t) => t + 0.5)}
            >
              <Ionicons name="add" size={18} color={c.texto} />
            </Pressable>
            <Pressable
              style={[styles.botonEnviarOferta, enviandoOferta && { opacity: 0.6 }]}
              onPress={enviarContraoferta}
              disabled={enviandoOferta}
            >
              {enviandoOferta ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.botonEnviarOfertaTexto}>Enviar</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* BOTONES */}
      <View style={styles.botones}>
        <Pressable
          style={({ pressed }) => [
            styles.botonRechazar,
            pressed && { backgroundColor: c.superficieSuave },
          ]}
          onPress={() => onRechazar(solicitud.id)}
          disabled={aceptando || enviandoOferta}
        >
          <Ionicons name="close" size={18} color={c.texto} />
          <Text style={styles.botonRechazarTexto}>Rechazar</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.botonContraoferta,
            mostrarContraoferta && styles.botonContraofertaActivo,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => setMostrarContraoferta((v) => !v)}
          disabled={aceptando || enviandoOferta}
        >
          <Ionicons
            name="pricetag-outline"
            size={16}
            color={mostrarContraoferta ? "#FFFFFF" : c.primario}
          />
          <Text
            style={[
              styles.botonContraofertaTexto,
              mostrarContraoferta && { color: "#FFFFFF" },
            ]}
          >
            Contraofertar
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.botonAceptar,
            pressed && { backgroundColor: c.primarioPresionado },
            aceptando && { opacity: 0.7 },
          ]}
          onPress={() => onAceptar(solicitud.id)}
          disabled={aceptando || enviandoOferta}
        >
          {aceptando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.botonAceptarTexto}>Aceptar</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) =>
  StyleSheet.create({
    tarjeta: {
      padding: 16,
      borderRadius: 18,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 14,
    },
    cabecera: { flexDirection: "row", alignItems: "center" },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarioSuave,
      marginRight: 11,
    },
    cabeceraTextos: { flex: 1 },
    titulo: { fontSize: 15, fontWeight: "800", color: c.texto },
    subtitulo: { marginTop: 2, fontSize: 11, color: c.textoSec },
    tarifa: { fontSize: 18, fontWeight: "800", color: c.primario },
    divisor: { height: 1, backgroundColor: c.borde, marginVertical: 14 },
    ubicacionFila: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    iconoUbicacion: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    ubicacionContenido: { flex: 1 },
    ubicacionEtiqueta: { fontSize: 10, color: c.textoSec, marginBottom: 2 },
    ubicacionValor: { fontSize: 13, fontWeight: "700", color: c.texto },
    datosFila: { flexDirection: "row", gap: 8, marginTop: 2 },
    dato: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 10,
      borderRadius: 12,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
    },
    datoTexto: { fontSize: 12, fontWeight: "700", color: c.texto },
    botones: { flexDirection: "row", gap: 8, marginTop: 16 },
    botonRechazar: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: c.fondo,
    },
    botonRechazarTexto: { fontSize: 13, fontWeight: "700", color: c.texto },
    botonContraoferta: {
      flex: 1.3,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primario,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: c.superficie,
    },
    botonContraofertaActivo: {
      backgroundColor: c.primario,
    },
    botonContraofertaTexto: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    botonAceptar: {
      flex: 1.2,
      height: 48,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: c.primario,
    },
    botonAceptarTexto: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
    seccionContraoferta: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      gap: 8,
    },
    etiquetaContraoferta: {
      fontSize: 12,
      fontWeight: "600",
      color: c.textoSec,
    },
    stepperFila: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    botonPaso: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: "center",
      justifyContent: "center",
    },
    textoTarifaOfertada: {
      fontSize: 16,
      fontWeight: "800",
      color: c.primario,
      minWidth: 70,
      textAlign: "center",
    },
    botonEnviarOferta: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
    },
    botonEnviarOfertaTexto: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
