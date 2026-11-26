import { useBilletera } from "../hooks/use-billetera";
import { MovimientoBilletera } from "@/features/finanzas/types/billetera";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import {
  useTemaConductor,
  type ColoresConductor,
} from "@/features/conductores/theme/temaConductor";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useState } from "react";
import RecargaOpenpay from "./recarga-openpay";
import { router, useLocalSearchParams } from "expo-router";

const formatearMonto = (monto: number) => `S/ ${monto.toFixed(2)}`;

const obtenerTipo = (tipo:MovimientoBilletera["tipo"]) => {
    const tipos = {
        recarga: "Recarga de saldo",
        comision_viaje: "Comisión de viaje",
        retiro: "Retiro de saldo",
        ajuste: "Ajuste de saldo",
    };

    return tipos[tipo];
};

const obtenerEstado = (estado: MovimientoBilletera["estado"]) => {
  const estados = {
    completado: "Completado",
    pendiente: "Pendiente",
    fallido: "Fallido",
  };

  return estados[estado];
};

const obtenerIcono = (
  tipo: MovimientoBilletera["tipo"]
): keyof typeof Ionicons.glyphMap => {
  const iconos = {
    recarga: "add-circle-outline",
    comision_viaje: "car-outline",
    retiro: "arrow-up-circle-outline",
    ajuste: "swap-horizontal-outline",
  } as const;

  return iconos[tipo];
};

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function BilleteraScreen() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);

  const { origen } = useLocalSearchParams<{
    origen?: string;
  }>();

  const volver = () => {
    if (origen === "cuenta") {
      router.replace("/cuenta");
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/cuenta");
  };

  const [mostrarRecarga, setMostrarRecarga] = useState(false);

  const {
    saldo,
    movimientos,
    cargando,
    actualizando,
    error,
    refrescar,
  } = useBilletera();

  const solicitarRecarga = () => {
    setMostrarRecarga(true);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "android" && (
        <RecargaOpenpay
          visible={mostrarRecarga}
          onCerrar={() => setMostrarRecarga(false)}
          onRecargaProcesada={async () => {
            await refrescar();
          }}
        />
      )}
      
      <CabeceraConductor
        titulo="Mi billetera"
        subtitulo="Administra tu saldo Altokke"
        mostrarAtras
        compacta
        onAtras={volver}
      />

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => void refrescar()}
            tintColor={c.primario}
          />
        }
      >
        <View style={styles.tarjetaSaldo}>
          <View style={styles.filaSuperior}>
            <Text style={styles.etiquetaSaldo}>
              SALDO DISPONIBLE
            </Text>

            <View style={styles.badgePruebas}>
              <Text style={styles.textoBadge}>
                MODO PRUEBAS
              </Text>
            </View>
          </View>

          <Text style={styles.montoSaldo}>
            {formatearMonto(saldo)}
          </Text>

          <Text style={styles.descripcionSaldo}>
            Dinero disponible en tu billetera virtual.
          </Text>

          {Platform.OS === "android" ? (
            <BotonPrincipal
              titulo="Recargar saldo"
              onPress={solicitarRecarga}
              mostrarIcono
              icono="add-circle-outline"
              estilo={styles.botonRecarga}
            />
          ) : (
            <View style={styles.avisoRecarga}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color="#FFFFFF"
              />
              <Text style={styles.textoAvisoRecarga}>
                Las recargas todavía no están disponibles en iOS.
                Por ahora puedes realizarlas desde un dispositivo Android
              </Text>
            </View>
          )}
        </View>

        <View style={styles.encabezadoHistorial}>
          <Text style={styles.tituloHistorial}>
            Historial de movimientos
          </Text>

          <Text style={styles.subtituloHistorial}>
            Últimos 30 movimientos
          </Text>
        </View>

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color={c.primario} />
            <Text style={styles.textoSecundario}>
              Consultando tu billetera...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.estado}>
            <Ionicons
              name="alert-circle-outline"
              size={38}
              color={c.error}
            />

            <Text style={styles.textoSecundario}>
              {error instanceof Error
                ? error.message
                : "No se pudo consultar la billetera."}
            </Text>

            <Pressable onPress={() => void refrescar()}>
              <Text style={styles.textoReintentar}>
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : movimientos.length === 0 ? (
          <View style={styles.estado}>
            <Ionicons
              name="wallet-outline"
              size={42}
              color={c.textoSec}
            />

            <Text style={styles.textoVacio}>
              Todavía no tienes movimientos.
            </Text>

            <Text style={styles.textoSecundario}>
              Cuando realices una recarga u otra operación,
              aparecerá aquí.
            </Text>
          </View>
        ) : (
          movimientos.map((movimiento) => {
            const esDebito =
              movimiento.tipo === "comision_viaje" ||
              movimiento.tipo === "retiro";

            const signo =
              movimiento.tipo === "recarga"
                ? "+"
                : esDebito
                  ? "−"
                  : "";

            const colorMonto =
              movimiento.estado === "fallido"
                ? c.error
                : esDebito
                  ? c.texto
                  : c.primario;

            return (
              <View
                key={movimiento.id}
                style={styles.tarjetaMovimiento}
              >
                <View style={styles.iconoMovimiento}>
                  <Ionicons
                    name={obtenerIcono(movimiento.tipo)}
                    size={23}
                    color={c.primario}
                  />
                </View>

                <View style={styles.detalleMovimiento}>
                  <Text style={styles.nombreMovimiento}>
                    {obtenerTipo(movimiento.tipo)}
                  </Text>

                  <Text style={styles.descripcionMovimiento}>
                    {movimiento.descripcion || "Operación de billetera"}
                  </Text>

                  <Text style={styles.fechaMovimiento}>
                    {formatearFecha(movimiento.creado_en)}
                  </Text>

                  <Text style={styles.estadoMovimiento}>
                    {obtenerEstado(movimiento.estado)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.montoMovimiento,
                    { color: colorMonto },
                  ]}
                >
                  {signo}{formatearMonto(Number(movimiento.monto))}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    contenido: {
      padding: 18,
      paddingBottom: 35,
    },
    tarjetaSaldo: {
      backgroundColor: c.headerA,
      borderRadius: 22,
      padding: 22,
      marginBottom: 26,
    },
    filaSuperior: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    etiquetaSaldo: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
    },
    badgePruebas: {
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },
    textoBadge: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },
    montoSaldo: {
      color: "#FFFFFF",
      fontSize: 36,
      fontWeight: "800",
      marginTop: 20,
    },
    descripcionSaldo: {
      color: "#D5E9DC",
      fontSize: 13,
      marginTop: 5,
      marginBottom: 18,
    },
    botonRecarga: {
      backgroundColor: c.primario,
    },
    avisoRecarga: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "rgba(255,255,255,0.15)",
      padding: 12,
      borderRadius: 12,
      marginTop: 5,
    },

    textoAvisoRecarga: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
    },
    encabezadoHistorial: {
      marginBottom: 14,
    },
    tituloHistorial: {
      color: c.texto,
      fontSize: 18,
      fontWeight: "800",
    },
    subtituloHistorial: {
      color: c.textoSec,
      fontSize: 12,
      marginTop: 4,
    },
    tarjetaMovimiento: {
      backgroundColor: c.superficie,
      borderRadius: 15,
      padding: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.borde,
      gap: 11,
    },
    iconoMovimiento: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.primarioSuave,
      alignItems: "center",
      justifyContent: "center",
    },
    detalleMovimiento: {
      flex: 1,
    },
    nombreMovimiento: {
      color: c.texto,
      fontSize: 13,
      fontWeight: "700",
    },
    descripcionMovimiento: {
      color: c.textoSec,
      fontSize: 11,
      marginTop: 3,
    },
    fechaMovimiento: {
      color: c.textoSec,
      fontSize: 10,
      marginTop: 4,
    },
    estadoMovimiento: {
      color: c.primario,
      fontSize: 10,
      fontWeight: "700",
      marginTop: 4,
    },
    montoMovimiento: {
      fontSize: 13,
      fontWeight: "800",
    },
    estado: {
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
      gap: 12,
    },
    textoVacio: {
      color: c.texto,
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    textoSecundario: {
      color: c.textoSec,
      fontSize: 12,
      textAlign: "center",
    },
    textoReintentar: {
      color: c.primario,
      fontSize: 14,
      fontWeight: "700",
    },
  });