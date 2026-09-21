import { paletaColores } from "@/paletaColores";
import { StyleSheet, View } from "react-native";
import { OtpInput } from "react-native-otp-entry";

export interface OTPCodeFieldProps {
  onTextChange?: (text: string) => void;
  onFilled?: (text: string) => void;
  numberOfDigits?: number;
}

export function OTPCodeField({
  onTextChange,
  onFilled,
  numberOfDigits = 6,
}: OTPCodeFieldProps) {
  return (
    <View style={styles.container}>
      <OtpInput
        numberOfDigits={numberOfDigits}
        focusColor={paletaColores.boton}
        focusStickBlinkingDuration={500}
        onTextChange={onTextChange}
        onFilled={onFilled}
        theme={{
          containerStyle: styles.otpContainer,
          pinCodeContainerStyle: styles.pinCodeContainer,
          pinCodeTextStyle: styles.pinCodeText,
          focusStickStyle: styles.focusStick,
          focusedPinCodeContainerStyle: styles.activePinCodeContainer,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 16,
  },
  otpContainer: {
    width: "100%",
    justifyContent: "space-between",
  },
  pinCodeContainer: {
    width: 50,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    backgroundColor: paletaColores.input,
  },
  activePinCodeContainer: {
    borderColor: paletaColores.boton,
  },
  pinCodeText: {
    color: paletaColores.texto,
    fontSize: 22,
    fontWeight: "bold",
  },
  focusStick: {
    backgroundColor: paletaColores.boton,
  },
});
