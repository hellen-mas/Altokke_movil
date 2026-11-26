import { requireNativeModule } from "expo-modules-core";

export interface DatosTarjetaOpenpay {
  holderName: string;
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv2: string;
}

export interface ResultadoTokenOpenpay {
  tokenId: string;
  deviceSessionId: string;
}

interface OpenpayNativeModuleInterface {
  tokenizeCard(
    merchantId: string,
    publicKey: string,
    holderName: string,
    cardNumber: string,
    expirationMonth: string,
    expirationYear: string,
    cvv2: string
  ): Promise<ResultadoTokenOpenpay>;
}

const OpenpayNative =
  requireNativeModule<OpenpayNativeModuleInterface>("OpenpayNative");

export async function tokenizarTarjetaOpenpay(
  tarjeta: DatosTarjetaOpenpay
): Promise<ResultadoTokenOpenpay> {

  const merchantId =
    process.env.EXPO_PUBLIC_OPENPAY_MERCHANT_ID;

  const publicKey =
    process.env.EXPO_PUBLIC_OPENPAY_PUBLIC_KEY;

  if (!merchantId || !publicKey) {
    throw new Error(
      "Faltan las credenciales públicas de Openpay en el archivo .env."
    );
  }

  return OpenpayNative.tokenizeCard(
    merchantId,
    publicKey,
    tarjeta.holderName,
    tarjeta.cardNumber.replace(/\s/g, ""),
    tarjeta.expirationMonth,
    tarjeta.expirationYear,
    tarjeta.cvv2
  );
}