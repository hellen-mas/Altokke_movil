import { paletaColores } from "@/shared/theme/paletaColores";
import { StyleSheet, View } from "react-native";
import { OtpInput } from "react-native-otp-entry";

export interface PropsCampoCodigoVerificacion {
  onChangeText?: (texto: string) => void;
  alLlenar?: (texto: string) => void;
  numeroDigitos?: number;
}

export function CampoCodigoVerificacion({
  onChangeText,
  alLlenar,
  numeroDigitos = 6,
}: PropsCampoCodigoVerificacion) {
  return (
    <View style={estilos.contenedor}>
      <OtpInput
        numberOfDigits={numeroDigitos}
        focusColor={paletaColores.boton}
        focusStickBlinkingDuration={500}
        onTextChange={onChangeText}
        onFilled={alLlenar}
        theme={{
          containerStyle: estilos.contenedorOtp,
          pinCodeContainerStyle: estilos.contenedorCodigoPin,
          pinCodeTextStyle: estilos.textoCodigoPin,
          focusStickStyle: estilos.paloEnfoque,
          focusedPinCodeContainerStyle: estilos.contenedorCodigoPinActivo,
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: "100%",
    marginVertical: 16,
  },
  contenedorOtp: {
    width: "100%",
    justifyContent: "space-between",
  },
  contenedorCodigoPin: {
    width: 50,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    backgroundColor: paletaColores.input,
  },
  contenedorCodigoPinActivo: {
    borderColor: paletaColores.boton,
  },
  textoCodigoPin: {
    color: paletaColores.texto,
    fontSize: 22,
    fontWeight: "bold",
  },
  paloEnfoque: {
    backgroundColor: paletaColores.boton,
  },
});
