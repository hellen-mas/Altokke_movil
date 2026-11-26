
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
    _monto: number,
    _tarjeta: unknown
  ): Promise<RespuestaRecargaOpenpay> {
    throw new Error(
      "Las recargas con tarjeta todavía no están disponibles en iOS. Por ahora puedes realizarlas desde un dispositivo Android."
    );
  },
};
