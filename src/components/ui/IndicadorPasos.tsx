import { Fragment } from "react";
import { paletaColores } from "@/paletaColores";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  style?: StyleProp<ViewStyle>;
}

export function IndicadorPasos({ currentStep, totalSteps, style }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.progreso}>
        {steps.map((paso) => {
          const completado = paso < currentStep;
          const activo = paso === currentStep;

          return (
            <Fragment key={paso}>
              <View
                style={[
                  styles.circulo,
                  completado && styles.circuloCompletado,
                  activo && styles.circuloActivo,
                ]}
              >
                <Text
                  style={[
                    styles.numero,
                    completado && styles.numeroCompletado,
                    activo && styles.numeroActivo,
                  ]}
                >
                  {paso}
                </Text>
              </View>

              {paso < totalSteps && (
                <View
                  style={[
                    styles.linea,
                    paso < currentStep && styles.lineaCompletada,
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

const styles = StyleSheet.create({
  container: {
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
