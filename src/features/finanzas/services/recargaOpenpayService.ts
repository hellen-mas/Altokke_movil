
import * as Crypto from "expo-crypto";
import { invocarEdgeFunction } from "@/shared/api/supabase";
import {
  tokenizarTarjetaOpenpay,
  type DatosTarjetaOpenpay,
} from "../../../../modules/openpay-native/src";

export interface RespuestaRecargaOpenpay {
  ok: boolean;
  estado: string;
  order_id?: string;
  charge_id?: string;
  mensaje?: string;
  duplicada?: boolean;
}

export const recargaOpenpayService = {
  async recargar(
    monto: number,
    tarjeta: DatosTarjetaOpenpay
  ): Promise<RespuestaRecargaOpenpay> {
    if (
      !Number.isFinite(monto) ||
      monto < 1 ||
      monto > 99999 ||
      Math.round(monto * 100) !== monto * 100
    ) {
      throw new Error("Ingresa un monto válido desde S/ 1.00.");
    }

    if (process.env.EXPO_PUBLIC_OPENPAY_SANDBOX !== "true") {
      throw new Error(
        "Las recargas están habilitadas únicamente en modo de pruebas."
      );
    }

    const { tokenId, deviceSessionId } =
      await tokenizarTarjetaOpenpay(tarjeta);

    if (!tokenId || !deviceSessionId) {
      throw new Error("Openpay no pudo tokenizar la tarjeta.");
    }

    const orderId = `altokke_${Crypto.randomUUID().replace(/-/g, "")}`;

    return invocarEdgeFunction<RespuestaRecargaOpenpay>(
      "openpay-charge",
      {
        token_id: tokenId,
        device_session_id: deviceSessionId,
        amount: monto,
        order_id: orderId,
      },
      60000
    );
  },
};
