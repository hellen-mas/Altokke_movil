import { paletaColores } from "@/paletaColores";
import { StyleSheet, View } from "react-native";

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {steps.map((step) => (
        <View
          key={step}
          style={[
            styles.step,
            step <= currentStep ? styles.activeStep : styles.inactiveStep,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 20,
  },
  step: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    maxWidth: 40,
  },
  activeStep: {
    backgroundColor: paletaColores.boton,
  },
  inactiveStep: {
    backgroundColor: paletaColores.borde,
  },
});
