import { Fragment } from "react";
import { paletaColores } from "@/paletaColores";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface PropsIndicadorPasos {
  pasoActual: number;
  totalPasos: number;
  estilo?: StyleProp<ViewStyle>;
}

export function IndicadorPasos({ pasoActual, totalPasos, estilo }: PropsIndicadorPasos) {
  const pasos = Array.from({ length: totalPasos }, (_, i) => i + 1);

  return (
    <View style={[estilos.contenedor, estilo]}>
      <View style={estilos.progreso}>
        {pasos.map((paso) => {
          const completado = paso < pasoActual;
          const activo = paso === pasoActual;

          return (
            <Fragment key={paso}>
              <View
                style={[
                  estilos.circulo,
                  completado && estilos.circuloCompletado,
                  activo && estilos.circuloActivo,
                ]}
              >
                <Text
                  style={[
                    estilos.numero,
                    completado && estilos.numeroCompletado,
                    activo && estilos.numeroActivo,
                  ]}
                >
                  {paso}
                </Text>
              </View>

              {paso < totalPasos && (
                <View
                  style={[
                    estilos.linea,
                    paso < pasoActual && estilos.lineaCompletada,
                  ]}
                />
              )}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: "100%",
    marginVertical: 10,
  },
  progreso: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  circulo: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: paletaColores.borde,
    backgroundColor: paletaColores.input,
  },
  circuloCompletado: {
    backgroundColor: paletaColores.boton,
    borderColor: paletaColores.boton,
  },
  circuloActivo: {
    borderWidth: 2,
    borderColor: paletaColores.boton,
    backgroundColor: "rgba(53, 233, 130, 0.15)",
  },
  numero: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    fontWeight: "600",
  },
  numeroCompletado: {
    color: paletaColores.textoOscuro,
    fontWeight: "700",
  },
  numeroActivo: {
    color: paletaColores.verde,
    fontWeight: "800",
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: paletaColores.borde,
  },
  lineaCompletada: {
    height: 2,
    backgroundColor: paletaColores.boton,
  },
});
