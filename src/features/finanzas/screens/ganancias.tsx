import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import {
  useTemaConductor,
  type ColoresConductor,
} from "@/features/conductores/theme/temaConductor";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { supabase } from "@/shared/api/supabase";
import { mapearErrorDatabase } from "@/shared/utils/erroresDatabase";

const ALTURA_MAXIMA_BARRA = 90;

const ETIQUETAS_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface ViajeResumen {
  id: string;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  monto: number;
}

interface DiaGanancia {
  dia: string;
  monto: number;
}

export default function GananciasConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const { userId } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSemana, setTotalSemana] = useState(0);
  const [totalHoy, setTotalHoy] = useState(0);
  const [viajesCompletadosHoy, setViajesCompletadosHoy] = useState(0);
  const [promedioPorViaje, setPromedioPorViaje] = useState(0);
  const [porDia, setPorDia] = useState<DiaGanancia[]>(
    ETIQUETAS_DIAS.map((dia) => ({ dia, monto: 0 }))
  );
  const [ultimosViajes, setUltimosViajes] = useState<ViajeResumen[]>([]);
  const [saldoBilletera, setSaldoBilletera] = useState(0);

  const cargarDatosFinancieros = useCallback(async () => {
    if (!userId) {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      // 1. Obtener viajes finalizados del conductor
      const { data: viajes, error: errorViajes } = await supabase
        .from("viajes")
        .select("id, origen_texto, destino_texto, tarifa_final, tarifa_estimada, creado_en")
        .eq("conductor_id", userId)
        .eq("estado", "finalizado")
        .order("creado_en", { ascending: false })
        .limit(60);

      if (errorViajes) throw errorViajes;

      // 2. Obtener saldo de billetera
      try {
        const { data: perfilCond } = await supabase
          .from("conductores_perfil")
          .select("saldo_billetera")
          .eq("usuario_id", userId)
          .maybeSingle();

        if (perfilCond?.saldo_billetera != null) {
          setSaldoBilletera(Number(perfilCond.saldo_billetera));
        }
      } catch {
        setSaldoBilletera(0);
      }

      const lista = viajes || [];

      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

      // Lunes de la semana actual
      const diaSemanaActual = (ahora.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
      const inicioSemana = new Date(inicioHoy);
      inicioSemana.setDate(inicioHoy.getDate() - diaSemanaActual);

      let sumaSemana = 0;
      let sumaHoy = 0;
      let conteoHoy = 0;
      let conteoSemana = 0;

      const montosPorDia: number[] = [0, 0, 0, 0, 0, 0, 0];

      const formateados: ViajeResumen[] = [];

      for (const v of lista) {
        const fechaViaje = new Date(v.creado_en);
        const monto = Number(v.tarifa_final ?? v.tarifa_estimada ?? 0);

        if (formateados.length < 5) {
          formateados.push({
            id: v.id,
            origen: v.origen_texto,
            destino: v.destino_texto,
            fecha: fechaViaje.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
            hora: fechaViaje.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
            monto,
          });
        }

        if (fechaViaje >= inicioSemana) {
          sumaSemana += monto;
          conteoSemana += 1;

          const diaIndice = (fechaViaje.getDay() + 6) % 7;
          montosPorDia[diaIndice] += monto;
        }

        if (fechaViaje >= inicioHoy) {
          sumaHoy += monto;
          conteoHoy += 1;
        }
      }

      setTotalSemana(sumaSemana);
      setTotalHoy(sumaHoy);
      setViajesCompletadosHoy(conteoHoy);
      setPromedioPorViaje(conteoSemana > 0 ? sumaSemana / conteoSemana : 0);
      setPorDia(
        ETIQUETAS_DIAS.map((dia, idx) => ({
          dia,
          monto: montosPorDia[idx],
        }))
      );
      setUltimosViajes(formateados);
    } catch (err: unknown) {
      console.warn("Aviso al cargar ganancias del conductor:", err);
      setError(mapearErrorDatabase(err, "No se pudieron cargar los datos de ganancias. Verifica tu conexión."));
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      cargarDatosFinancieros();
    }, [cargarDatosFinancieros])
  );

  const montoMaximo = Math.max(
    ...porDia.map((d) => d.monto),
    1
  );

  return (
    <View style={styles.container}>
      <CabeceraConductor
        titulo="Ganancias"
        subtitulo="Resumen de actividad"
        mostrarMarca
        mostrarAtras={false}
        compacta
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cargando ? (
          <View style={styles.cargandoContenedor}>
            <ActivityIndicator size="large" color={c.primario} />
            <Text style={styles.cargandoTexto}>Cargando resumen de ganancias...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContenedor}>
            <Ionicons name="alert-circle-outline" size={36} color={c.error} />
            <Text style={styles.errorTexto}>{error}</Text>
            <Pressable style={styles.botonReintentar} onPress={cargarDatosFinancieros}>
              <Text style={styles.botonReintentarTexto}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Resumen de la semana */}
            <View style={styles.tarjeta}>
              <View style={styles.filaResumen}>
                <Text style={styles.montoGrande}>
                  S/ {totalSemana.toFixed(2)}
                </Text>

                <View style={styles.variacion}>
                  <Ionicons name="trending-up" size={14} color={c.primario} />
                  <Text style={styles.variacionTexto}>Esta semana</Text>
                </View>
              </View>

              <View style={styles.filaDatos}>
                <View style={styles.dato}>
                  <Text style={styles.datoEtiqueta}>Hoy</Text>
                  <Text style={styles.datoValor}>S/ {totalHoy.toFixed(2)}</Text>
                </View>

                <View style={styles.dato}>
                  <Text style={styles.datoEtiqueta}>Viajes hoy</Text>
                  <Text style={styles.datoValor}>{viajesCompletadosHoy}</Text>
                </View>

                <View style={styles.dato}>
                  <Text style={styles.datoEtiqueta}>Promedio/viaje</Text>
                  <Text style={styles.datoValor}>S/ {promedioPorViaje.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Gráfico de barras */}
            <View style={styles.tarjeta}>
              <Text style={styles.tituloSeccion}>Esta semana</Text>
              <Text style={styles.subtituloSeccion}>Ganancias por día (S/)</Text>

              <View style={styles.grafico}>
                {porDia.map((dia) => {
                  const altura = Math.max(
                    6,
                    (dia.monto / montoMaximo) * ALTURA_MAXIMA_BARRA
                  );

                  return (
                    <View key={dia.dia} style={styles.columnaBarra}>
                      <Text style={styles.montoBarra}>
                        {dia.monto > 0 ? dia.monto.toFixed(0) : ""}
                      </Text>

                      <View
                        style={[
                          styles.barra,
                          {
                            height: altura,
                            backgroundColor:
                              dia.monto > 0 ? c.primario : c.borde,
                          },
                        ]}
                      />

                      <Text style={styles.diaEtiqueta}>{dia.dia}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Últimos viajes */}
            <View style={styles.tarjeta}>
              <Text style={styles.tituloSeccion}>Últimos viajes completados</Text>

              {ultimosViajes.length === 0 ? (
                <View style={styles.vacioContenedor}>
                  <Ionicons name="navigate-outline" size={32} color={c.textoSec} />
                  <Text style={styles.vacioTexto}>
                    Aún no registras carreras completadas en este período.
                  </Text>
                </View>
              ) : (
                ultimosViajes.map((viaje, index) => (
                  <View
                    key={viaje.id}
                    style={[
                      styles.filaViaje,
                      index === ultimosViajes.length - 1 && styles.sinBorde,
                    ]}
                  >
                    <View style={styles.iconoViaje}>
                      <Ionicons name="navigate" size={16} color={c.primario} />
                    </View>

                    <View style={styles.textosViaje}>
                      <Text style={styles.rutaViaje} numberOfLines={1}>
                        {viaje.origen} → {viaje.destino}
                      </Text>
                      <Text style={styles.fechaViaje}>
                        {viaje.fecha}, {viaje.hora}
                      </Text>
                    </View>

                    <Text style={styles.montoViaje}>
                      S/ {viaje.monto.toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Saldo de Billetera Digital */}
            <View style={styles.tarjetaBilletera}>
              <Ionicons name="wallet-outline" size={22} color={c.primario} />
              <View style={{ flex: 1 }}>
                <Text style={styles.saldoTitulo}>Saldo operativo en billetera</Text>
                <Text style={styles.saldoTexto}>
                  S/ {saldoBilletera.toFixed(2)}
                </Text>
              </View>
            </View>
          </>
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
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 30,
    },
    cargandoContenedor: {
      paddingVertical: 60,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    cargandoTexto: {
      fontSize: 14,
      color: c.textoSec,
    },
    errorContenedor: {
      paddingVertical: 40,
      alignItems: "center",
      gap: 12,
    },
    errorTexto: {
      fontSize: 14,
      color: c.error,
      textAlign: "center",
    },
    botonReintentar: {
      backgroundColor: c.primario,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      marginTop: 8,
    },
    botonReintentarTexto: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },
    tarjeta: {
      marginBottom: 16,
      padding: 18,
      borderRadius: 18,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    filaResumen: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    montoGrande: {
      fontSize: 26,
      fontWeight: "800",
      color: c.texto,
    },
    variacion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: c.primarioSuave,
    },
    variacionTexto: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    filaDatos: {
      flexDirection: "row",
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: c.borde,
    },
    dato: {
      flex: 1,
    },
    datoEtiqueta: {
      fontSize: 11,
      color: c.textoSec,
    },
    datoValor: {
      marginTop: 4,
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    tituloSeccion: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloSeccion: {
      marginTop: 2,
      fontSize: 11,
      color: c.textoSec,
    },
    grafico: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginTop: 18,
      height: ALTURA_MAXIMA_BARRA + 36,
    },
    columnaBarra: {
      flex: 1,
      alignItems: "center",
    },
    montoBarra: {
      fontSize: 10,
      color: c.textoSec,
      marginBottom: 4,
      height: 12,
    },
    barra: {
      width: 14,
      borderRadius: 7,
    },
    diaEtiqueta: {
      marginTop: 6,
      fontSize: 11,
      color: c.textoSec,
    },
    filaViaje: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borde,
    },
    sinBorde: {
      borderBottomWidth: 0,
    },
    iconoViaje: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarioSuave,
    },
    textosViaje: {
      flex: 1,
    },
    rutaViaje: {
      fontSize: 13,
      fontWeight: "600",
      color: c.texto,
    },
    fechaViaje: {
      marginTop: 2,
      fontSize: 11,
      color: c.textoSec,
    },
    montoViaje: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    vacioContenedor: {
      paddingVertical: 24,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    vacioTexto: {
      fontSize: 13,
      color: c.textoSec,
      textAlign: "center",
    },
    tarjetaBilletera: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 20,
    },
    saldoTitulo: {
      fontSize: 12,
      color: c.textoSec,
    },
    saldoTexto: {
      fontSize: 16,
      fontWeight: "800",
      color: c.texto,
      marginTop: 2,
    },
  });
