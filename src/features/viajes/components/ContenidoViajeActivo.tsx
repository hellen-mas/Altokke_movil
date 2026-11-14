import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { TarjetaConductor } from "./TarjetaConductor";
import type { ConductorViaje } from "../hooks/use-conductor-viaje";

export interface ContenidoViajeActivoProps {
  conectado: boolean;
  terminado: boolean;
  ubicacionReal: boolean;
  conductor: ConductorViaje | null;
  origenLugar: { nombre: string };
  destino: { nombre: string };
  horaSalida: Date;
  horaLlegada: Date;
  tarifa: number;
  esCancelable: boolean;
  cancelando: boolean;
  colores: {
    errorFondo: string;
    error: string;
    exitoFondo: string;
    exitoTexto: string;
    texto: string;
    secundario: string;
    campo: string;
    linea: string;
  };
  onLlamarConductor: () => void;
  onEscribirConductor: () => void;
  onCompartirViaje: () => void;
  onSolicitarCancelacion: () => void;
  formatearHora: (fecha: Date) => string;
  formatearSoles: (monto: number) => string;
}

export const ContenidoViajeActivo: React.FC<ContenidoViajeActivoProps> = ({
  conectado,
  terminado,
  ubicacionReal,
  conductor,
  origenLugar,
  destino,
  horaSalida,
  horaLlegada,
  tarifa,
  esCancelable,
  cancelando,
  colores,
  onLlamarConductor,
  onEscribirConductor,
  onCompartirViaje,
  onSolicitarCancelacion,
  formatearHora,
  formatearSoles,
}) => {
  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contenido}
    >
      {!conectado && (
        <View style={[styles.avisoSinConexion, { backgroundColor: colores.errorFondo }]}>
          <Ionicons name="cloud-offline-outline" size={18} color={colores.error} />
          <Text style={[styles.avisoSinConexionTexto, { color: colores.error }]}>
            Sin conexión. Reintentando...
          </Text>
        </View>
      )}

      {terminado && (
        <View style={[styles.avisoLlegada, { backgroundColor: colores.exitoFondo }]}>
          <Ionicons name="flag" size={20} color={colores.exitoTexto} />
          <Text style={[styles.avisoTexto, { color: colores.texto }]}>
            ¡Llegaste a tu destino!
          </Text>
        </View>
      )}

      {!ubicacionReal && !terminado && (
        <View style={styles.avisoAproximado}>
          <Ionicons name="information-circle-outline" size={16} color={colores.secundario} />
          <Text style={[styles.avisoAproximadoTexto, { color: colores.secundario }]}>
            Ubicación aproximada del conductor
          </Text>
        </View>
      )}

      <Text style={[styles.seccion, { color: colores.texto }]}>Tu conductor</Text>
      <TarjetaConductor conductor={conductor} />

      <View style={styles.acciones}>
        <Pressable
          onPress={onLlamarConductor}
          style={({ pressed }) => [
            styles.accion,
            { backgroundColor: colores.exitoFondo },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="call" size={18} color={colores.exitoTexto} />
          <Text style={[styles.accionTexto, { color: colores.exitoTexto }]}>Llamar</Text>
        </Pressable>
        <Pressable
          onPress={onEscribirConductor}
          style={({ pressed }) => [
            styles.accion,
            { backgroundColor: colores.exitoFondo },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color={colores.exitoTexto} />
          <Text style={[styles.accionTexto, { color: colores.exitoTexto }]}>Mensaje</Text>
        </Pressable>
        <Pressable
          onPress={onCompartirViaje}
          style={({ pressed }) => [
            styles.accion,
            { backgroundColor: colores.exitoFondo },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="share-social" size={18} color={colores.exitoTexto} />
          <Text style={[styles.accionTexto, { color: colores.exitoTexto }]}>Compartir</Text>
        </Pressable>
      </View>

      <View style={[styles.tarjetaRecorrido, { backgroundColor: colores.campo }]}>
        <View style={styles.filaLugar}>
          <Ionicons name="radio-button-on" size={20} color={colores.exitoTexto} />
          <View style={styles.lugarTextos}>
            <Text style={[styles.etiqueta, { color: colores.secundario }]}>Origen</Text>
            <Text style={[styles.lugarNombre, { color: colores.texto }]} numberOfLines={1}>
              {origenLugar.nombre}
            </Text>
          </View>
          <Text style={[styles.hora, { color: colores.texto }]}>{formatearHora(horaSalida)}</Text>
        </View>

        <View style={[styles.separador, { backgroundColor: colores.linea }]} />

        <View style={styles.filaLugar}>
          <Ionicons name="location-sharp" size={20} color={colores.error} />
          <View style={styles.lugarTextos}>
            <Text style={[styles.etiqueta, { color: colores.secundario }]}>Destino</Text>
            <Text style={[styles.lugarNombre, { color: colores.texto }]} numberOfLines={1}>
              {destino.nombre}
            </Text>
          </View>
          <View style={styles.llegada}>
            <Text style={[styles.etiqueta, { color: colores.secundario }]}>Llegada estimada</Text>
            <Text style={[styles.hora, { color: colores.texto }]}>{formatearHora(horaLlegada)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.tarifa, { backgroundColor: colores.exitoFondo }]}>
        <View style={styles.tarifaMonto}>
          <Ionicons name="ticket-outline" size={24} color={colores.exitoTexto} />
          <View>
            <Text style={[styles.etiqueta, { color: colores.secundario }]}>Tarifa estimada</Text>
            <Text style={[styles.tarifaValor, { color: colores.texto }]}>{formatearSoles(tarifa)}</Text>
          </View>
        </View>

        <View style={styles.seguridad}>
          <Ionicons name="shield-checkmark" size={22} color={colores.exitoTexto} />
          <View style={styles.seguridadTextos}>
            <Text style={[styles.seguridadTitulo, { color: colores.texto }]}>
              Tu seguridad es primero
            </Text>
            <Text style={[styles.etiqueta, { color: colores.secundario }]}>¿Necesitas ayuda?</Text>
          </View>
        </View>
      </View>

      {esCancelable && (
        <Pressable
          onPress={onSolicitarCancelacion}
          disabled={cancelando}
          style={({ pressed }) => [
            styles.botonCancelar,
            { borderColor: colores.error },
            (pressed || cancelando) && { backgroundColor: colores.errorFondo },
            cancelando && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="close-circle-outline" size={20} color={colores.error} />
          <Text style={[styles.botonCancelarTexto, { color: colores.error }]}>
            {cancelando ? "Cancelando viaje..." : "Cancelar viaje"}
          </Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.reportar,
          { backgroundColor: colores.errorFondo },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name="warning-outline" size={20} color={colores.error} />
        <Text style={[styles.reportarTexto, { color: colores.error }]}>Reportar un problema</Text>
        <Ionicons name="chevron-forward" size={18} color={colores.error} />
      </Pressable>
    </BottomSheetScrollView>
  );
};

const styles = StyleSheet.create({
  contenido: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  avisoLlegada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
  },
  avisoTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  seccion: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
  },
  acciones: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  accion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  accionTexto: {
    fontSize: 13,
    fontWeight: "700",
  },
  tarjetaRecorrido: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
  },
  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lugarTextos: {
    flex: 1,
  },
  etiqueta: {
    fontSize: 11,
  },
  lugarNombre: {
    fontSize: 14,
    fontWeight: "700",
  },
  hora: {
    fontSize: 13,
    fontWeight: "700",
  },
  llegada: {
    alignItems: "flex-end",
  },
  separador: {
    height: 1,
    marginVertical: 8,
    marginLeft: 30,
  },
  tarifa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
  },
  tarifaMonto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tarifaValor: {
    fontSize: 20,
    fontWeight: "800",
  },
  seguridad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  seguridadTextos: {
    flexShrink: 1,
  },
  seguridadTitulo: {
    fontSize: 12,
    fontWeight: "700",
  },
  reportar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
  },
  reportarTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  botonCancelar: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  botonCancelarTexto: {
    fontSize: 16,
    fontWeight: "700",
  },
  avisoAproximado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  avisoAproximadoTexto: {
    fontSize: 12,
  },
  avisoSinConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
  },
  avisoSinConexionTexto: {
    fontSize: 13,
    fontWeight: "700",
  },
});
