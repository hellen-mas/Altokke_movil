import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { RESUMEN_GANANCIAS, VIAJES_EJEMPLO } from "@/constants/conductor";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

const ALTURA_MAXIMA_BARRA = 90;

const mostrarRetiroProximamente = () => {
  Alert.alert(
    "Retirar saldo",
    "Más adelante podrás retirar tu saldo disponible a tu cuenta bancaria o billetera digital.",
  );
};

export default function GananciasConductor() {
  const montoMaximo = Math.max(
    ...RESUMEN_GANANCIAS.porDia.map((dia) => dia.monto),
    1,
  );

  const ultimosViajes = VIAJES_EJEMPLO.slice(0, 5);

  return (
    <View style={styles.container}>
      <CabeceraConductor
        titulo="Tus ganancias"
        subtitulo="Esta semana"
        mostrarAtras
        compacta
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Resumen de la semana */}
        <View style={styles.tarjeta}>
          <View style={styles.filaResumen}>
            <Text style={styles.montoGrande}>
              S/ {RESUMEN_GANANCIAS.totalSemana.toFixed(2)}
            </Text>

            <View style={styles.variacion}>
              <Ionicons name="arrow-up" size={13} color={paletaColores.boton} />
              <Text style={styles.variacionTexto}>
                +{RESUMEN_GANANCIAS.variacionSemana}%
              </Text>
            </View>
          </View>

          <View style={styles.filaDatos}>
            <View style={styles.dato}>
              <Text style={styles.datoEtiqueta}>Hoy</Text>
              <Text style={styles.datoValor}>
                S/ {RESUMEN_GANANCIAS.totalHoy.toFixed(2)}
              </Text>
            </View>

            <View style={styles.dato}>
              <Text style={styles.datoEtiqueta}>Viajes completados</Text>
              <Text style={styles.datoValor}>
                {RESUMEN_GANANCIAS.viajesCompletadosHoy}
              </Text>
            </View>

            <View style={styles.dato}>
              <Text style={styles.datoEtiqueta}>Promedio por viaje</Text>
              <Text style={styles.datoValor}>
                S/ {RESUMEN_GANANCIAS.promedioPorViaje.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico de barras */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Esta semana</Text>
          <Text style={styles.subtituloSeccion}>Ganancias por día (S/)</Text>

          <View style={styles.grafico}>
            {RESUMEN_GANANCIAS.porDia.map((dia) => {
              const altura = Math.max(
                6,
                (dia.monto / montoMaximo) * ALTURA_MAXIMA_BARRA,
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
                          dia.monto === montoMaximo
                            ? paletaColores.boton
                            : paletaColores.verde,
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
          <Text style={styles.tituloSeccion}>Últimos viajes</Text>

          {ultimosViajes.map((viaje, index) => (
            <View
              key={viaje.id}
              style={[
                styles.filaViaje,
                index === ultimosViajes.length - 1 && styles.sinBorde,
              ]}
            >
              <View style={styles.iconoViaje}>
                <Ionicons
                  name="navigate"
                  size={16}
                  color={paletaColores.boton}
                />
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
          ))}
        </View>

        {/* Retirar saldo */}
        <View style={styles.bloqueRetiro}>
          <PrimaryButton title="Retirar saldo" onPress={mostrarRetiroProximamente} />
          <Text style={styles.saldoTexto}>
            Saldo disponible: S/ {RESUMEN_GANANCIAS.saldoDisponible.toFixed(2)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  tarjeta: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  filaResumen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  montoGrande: {
    fontSize: 26,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  variacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#E6F5EC",
  },

  variacionTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.boton,
  },

  filaDatos: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
  },

  dato: {
    flex: 1,
  },

  datoEtiqueta: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  datoValor: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  tituloSeccion: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  subtituloSeccion: {
    marginTop: 2,
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
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
    color: paletaColores.textoSecundarioClaro,
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
    color: paletaColores.textoSecundarioClaro,
  },

  filaViaje: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paletaColores.bordeClaro,
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
    backgroundColor: "#E8F4ED",
  },

  textosViaje: {
    flex: 1,
  },

  rutaViaje: {
    fontSize: 13,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  fechaViaje: {
    marginTop: 2,
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  montoViaje: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  bloqueRetiro: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
    gap: 10,
  },

  saldoTexto: {
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },
});