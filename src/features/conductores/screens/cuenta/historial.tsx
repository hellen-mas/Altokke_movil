import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { conductorService } from "@/features/conductores/services/conductorService";
import type { EstadoViaje } from "@/features/conductores/types/conductor";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export type ViajeReal = {
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
  const { colores } = useAltokkeTheme();
  const completado = viaje.estado === "Completado";

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.linea,
        },
      ]}
    >
      <View style={styles.filaHeader}>
        <Text style={[styles.fecha, { color: colores.secundario }]}>
          {viaje.fecha}, {viaje.hora}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: completado
                ? `${colores.exitoTexto}20`
                : `${colores.error}20`,
            },
          ]}
        >
          <Ionicons
            name={completado ? "checkmark-circle" : "close-circle"}
            size={13}
            color={completado ? colores.exitoTexto : colores.error}
          />
          <Text
            style={[
              styles.badgeText,
              {
                color: completado ? colores.exitoTexto : colores.error,
              },
            ]}
          >
            {viaje.estado}
          </Text>
        </View>
      </View>

      <View style={styles.rutaBox}>
        <View
          style={[
            styles.puntoOrigen,
            { backgroundColor: colores.exitoTexto },
          ]}
        />
        <Text
          style={[styles.rutaTexto, { color: colores.texto }]}
          numberOfLines={1}
        >
          {viaje.origen}
        </Text>
      </View>
      <View
        style={[styles.rutaLinea, { backgroundColor: colores.linea }]}
      />
      <View style={styles.rutaBox}>
        <View
          style={[
            styles.puntoDestino,
            { backgroundColor: colores.primario },
          ]}
        />
        <Text
          style={[styles.rutaTexto, { color: colores.texto }]}
          numberOfLines={1}
        >
          {viaje.destino}
        </Text>
      </View>

      <View
        style={[styles.filaFooter, { borderTopColor: colores.linea }]}
      >
        <Text style={[styles.monto, { color: colores.texto }]}>
          S/ {viaje.monto.toFixed(2)}
        </Text>
      </View>
    </View>
  );
});

export default function HistorialConductor() {
  const { colores } = useAltokkeTheme();
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

      // Consumo del método de servicio del Integrante 1 (sin Supabase en pantalla)
      const servicio = conductorService as typeof conductorService & {
        obtenerHistorialConductor?: (id: string) => Promise<ViajeReal[]>;
      };

      let lista: ViajeReal[] = [];
      if (typeof servicio.obtenerHistorialConductor === "function") {
        lista = await servicio.obtenerHistorialConductor(perfil.id);
      }

      setViajes(lista);
      setTotales({
        totalViajes: lista.length,
        totalGanado: resumen?.totalSemana ?? 0,
      });
    } catch {
      // Fallback silencioso con estado local seguro
    } finally {
      setCargando(false);
    }
  }, [perfil.id]);

  useEffect(() => {
    let montado = true;
    const inicializar = async () => {
      if (!perfil.id || perfil.id === "conductor-local") return;
      try {
        const resumen = await conductorService.obtenerResumenGanancias(perfil.id);
        const servicio = conductorService as typeof conductorService & {
          obtenerHistorialConductor?: (id: string) => Promise<ViajeReal[]>;
        };

        let lista: ViajeReal[] = [];
        if (typeof servicio.obtenerHistorialConductor === "function") {
          lista = await servicio.obtenerHistorialConductor(perfil.id);
        }

        if (montado) {
          setViajes(lista);
          setTotales({
            totalViajes: lista.length,
            totalGanado: resumen?.totalSemana ?? 0,
          });
        }
      } catch {
        // Fallback silencioso
      }
    };

    void inicializar();
    return () => {
      montado = false;
    };
  }, [perfil.id]);

  const filtrados = useMemo(() => {
    return viajes.filter((v) => filtro === "todos" || v.estado === filtro);
  }, [viajes, filtro]);

  const renderItem = useCallback(
    ({ item }: { item: ViajeReal }) => (
      <TarjetaHistorialConductor viaje={item} />
    ),
    []
  );

  const keyExtractor = useCallback((item: ViajeReal) => item.id, []);

  const renderEmpty = useMemo(
    () => (
      <View style={styles.vacio}>
        <Ionicons
          name="car-outline"
          size={48}
          color={colores.secundario}
        />
        <Text style={[styles.vacioTexto, { color: colores.secundario }]}>
          No hay viajes registrados en esta sección.
        </Text>
      </View>
    ),
    [colores.secundario]
  );

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <CabeceraConductor
        titulo="Historial"
        subtitulo="Tus viajes y carreras completadas"
        mostrarAtras
        compacta
      />

      <View
        style={[
          styles.resumen,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        <View style={styles.resumenDato}>
          <Text style={[styles.resumenValor, { color: colores.texto }]}>
            {totales.totalViajes}
          </Text>
          <Text
            style={[styles.resumenEtiqueta, { color: colores.secundario }]}
          >
            Total de viajes
          </Text>
        </View>
        <View
          style={[styles.separador, { backgroundColor: colores.linea }]}
        />
        <View style={styles.resumenDato}>
          <Text
            style={[styles.resumenValor, { color: colores.exitoTexto }]}
          >
            S/ {totales.totalGanado.toFixed(2)}
          </Text>
          <Text
            style={[styles.resumenEtiqueta, { color: colores.secundario }]}
          >
            Total ganado
          </Text>
        </View>
      </View>

      <View style={styles.filtros}>
        {FILTROS.map((op) => {
          const activo = op.id === filtro;
          return (
            <Pressable
              key={op.id}
              style={[
                styles.filtro,
                {
                  backgroundColor: activo
                    ? colores.primario
                    : colores.superficie,
                  borderColor: activo
                    ? colores.primario
                    : colores.linea,
                },
              ]}
              onPress={() => setFiltro(op.id)}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  {
                    color: activo
                      ? colores.textoBoton
                      : colores.secundario,
                  },
                ]}
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
              tintColor={colores.primario}
              colors={[colores.primario]}
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
  },
  resumen: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  resumenDato: {
    flex: 1,
    alignItems: "center",
  },
  resumenValor: {
    fontSize: 20,
    fontWeight: "800",
  },
  resumenEtiqueta: {
    fontSize: 13,
    marginTop: 2,
  },
  separador: {
    width: 1,
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
    borderWidth: 1,
  },
  filtroTexto: {
    fontSize: 13,
    fontWeight: "600",
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
  },
  tarjeta: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  filaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fecha: {
    fontSize: 13,
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
  },
  puntoDestino: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rutaLinea: {
    width: 2,
    height: 12,
    marginLeft: 3,
  },
  rutaTexto: {
    fontSize: 14,
    flex: 1,
  },
  filaFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
    alignItems: "flex-end",
  },
  monto: {
    fontSize: 18,
    fontWeight: "800",
  },
});
