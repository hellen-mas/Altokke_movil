import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { conductorService } from "@/features/conductores/services/conductorService";
import type { EstadoViaje } from "@/features/conductores/types/conductor";
import { supabase } from "@/shared/api/supabase";
import { paletaColores } from "@/shared/theme/paletaColores";

type ViajeReal = {
  id: string;
  fecha: string;
  hora: string;
  origen: string;
  destino: string;
  monto: number;
  estado: EstadoViaje;
};

type Filtro = "todos" | EstadoViaje;

const FILTROS: { id: Filtro; titulo: string }[] = [
  { id: "todos", titulo: "Todos" },
  { id: "Completado", titulo: "Completados" },
  { id: "Cancelado", titulo: "Cancelados" },
];

const Separador = () => <View style={styles.separadorItem} />;

const TarjetaHistorialConductor = React.memo(function TarjetaHistorialConductor({
  viaje,
}: {
  viaje: ViajeReal;
}) {
  const completado = viaje.estado === "Completado";

  return (
    <View style={styles.tarjeta}>
      <View style={styles.filaHeader}>
        <Text style={styles.fecha}>
          {viaje.fecha}, {viaje.hora}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: completado ? "#E5F6ED" : "#FDE8E8" },
          ]}
        >
          <Ionicons
            name={completado ? "checkmark-circle" : "close-circle"}
            size={13}
            color={completado ? paletaColores.verde : paletaColores.error}
          />
          <Text
            style={[
              styles.badgeText,
              { color: completado ? paletaColores.verde : paletaColores.error },
            ]}
          >
            {viaje.estado}
          </Text>
        </View>
      </View>

      <View style={styles.rutaBox}>
        <View style={styles.puntoOrigen} />
        <Text style={styles.rutaTexto} numberOfLines={1}>
          {viaje.origen}
        </Text>
      </View>
      <View style={styles.rutaLinea} />
      <View style={styles.rutaBox}>
        <View style={styles.puntoDestino} />
        <Text style={styles.rutaTexto} numberOfLines={1}>
          {viaje.destino}
        </Text>
      </View>

      <View style={styles.filaFooter}>
        <Text style={styles.monto}>S/ {viaje.monto.toFixed(2)}</Text>
      </View>
    </View>
  );
});

export default function HistorialConductor() {
  const { perfil } = usePerfilConductor();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [viajes, setViajes] = useState<ViajeReal[]>([]);
  const [cargando, setCargando] = useState(false);
  const [totales, setTotales] = useState({ totalViajes: 0, totalGanado: 0 });

  const cargarHistorial = useCallback(async () => {
    if (!perfil.id || perfil.id === "conductor-local") return;
    setCargando(true);
    try {
      const resumen = await conductorService.obtenerResumenGanancias(perfil.id);
      const { data: rows } = await supabase
        .from("viajes")
        .select("id, creado_en, origen_texto, destino_texto, tarifa_final, tarifa_estimada, estado")
        .eq("conductor_id", perfil.id)
        .order("creado_en", { ascending: false })
        .limit(50);

      if (rows) {
        const mapeados: ViajeReal[] = rows.map((v) => {
          const fecha = new Date(v.creado_en);
          const estado: EstadoViaje = v.estado === "finalizado" ? "Completado" : "Cancelado";
          return {
            id: v.id,
            fecha: fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
            hora: fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
            origen: v.origen_texto,
            destino: v.destino_texto,
            monto: Number(v.tarifa_final ?? v.tarifa_estimada ?? 0),
            estado,
          };
        });
        setViajes(mapeados);
        setTotales({ totalViajes: mapeados.length, totalGanado: resumen.totalSemana });
      }
    } catch {
      // Fallback silencioso con estado local
    } finally {
      setCargando(false);
    }
  }, [perfil.id]);

  useEffect(() => {
    void cargarHistorial();
  }, [cargarHistorial]);

  const filtrados = useMemo(() => {
    return viajes.filter((v) => filtro === "todos" || v.estado === filtro);
  }, [viajes, filtro]);

  const renderItem = useCallback(
    ({ item }: { item: ViajeReal }) => <TarjetaHistorialConductor viaje={item} />,
    []
  );

  const keyExtractor = useCallback((item: ViajeReal) => item.id, []);

  const renderEmpty = useMemo(
    () => (
      <View style={styles.vacio}>
        <Ionicons
          name="car-outline"
          size={48}
          color={paletaColores.textoSecundarioClaro}
        />
        <Text style={styles.vacioTexto}>
          No hay viajes registrados en esta sección.
        </Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <CabeceraConductor
        titulo="Historial"
        subtitulo="Tus viajes y carreras completadas"
        mostrarAtras
        compacta
      />

      <View style={styles.resumen}>
        <View style={styles.resumenDato}>
          <Text style={styles.resumenValor}>{totales.totalViajes}</Text>
          <Text style={styles.resumenEtiqueta}>Total de viajes</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.resumenDato}>
          <Text style={[styles.resumenValor, { color: paletaColores.verde }]}>
            S/ {totales.totalGanado.toFixed(2)}
          </Text>
          <Text style={styles.resumenEtiqueta}>Total ganado</Text>
        </View>
      </View>

      <View style={styles.filtros}>
        {FILTROS.map((op) => {
          const activo = op.id === filtro;
          return (
            <Pressable
              key={op.id}
              style={[styles.filtro, activo && styles.filtroActivo]}
              onPress={() => setFiltro(op.id)}
            >
              <Text
                style={[styles.filtroTexto, activo && styles.filtroTextoActivo]}
              >
                {op.titulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.listaContenedor}>
        <FlashList
          data={filtrados}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={Separador}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={cargando}
              onRefresh={cargarHistorial}
              tintColor={paletaColores.verde}
              colors={[paletaColores.verde]}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  resumen: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },
  resumenDato: {
    flex: 1,
    alignItems: "center",
  },
  resumenValor: {
    fontSize: 20,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },
  resumenEtiqueta: {
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
    marginTop: 2,
  },
  separador: {
    width: 1,
    backgroundColor: paletaColores.bordeClaro,
  },
  filtros: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
  },
  filtro: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },
  filtroActivo: {
    backgroundColor: paletaColores.verde,
    borderColor: paletaColores.verde,
  },
  filtroTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: paletaColores.textoSecundarioClaro,
  },
  filtroTextoActivo: {
    color: "#FFFFFF",
  },
  listaContenedor: {
    flex: 1,
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  separadorItem: {
    height: 12,
  },
  vacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  vacioTexto: {
    fontSize: 15,
    color: paletaColores.textoSecundarioClaro,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    gap: 8,
  },
  filaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fecha: {
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
    fontWeight: "500",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  rutaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  puntoOrigen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: paletaColores.verde,
  },
  puntoDestino: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: paletaColores.primary,
  },
  rutaLinea: {
    width: 2,
    height: 12,
    backgroundColor: paletaColores.bordeClaro,
    marginLeft: 3,
  },
  rutaTexto: {
    fontSize: 14,
    color: paletaColores.textoClaro,
    flex: 1,
  },
  filaFooter: {
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
    paddingTop: 10,
    marginTop: 4,
    alignItems: "flex-end",
  },
  monto: {
    fontSize: 18,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },
});
