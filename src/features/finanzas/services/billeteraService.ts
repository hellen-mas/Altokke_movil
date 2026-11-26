import { supabase } from "@/shared/api/supabase";
import type { ResumenBilletera } from "../types/billetera";

export const billeteraService = {
    async obtenerResumen(conductorId: string): Promise<ResumenBilletera> {
        if (!conductorId) {
            throw new Error("No se encontró una sesión de conductor activa.");
        }

        const [perfilResult, movimientosResult] = await Promise.all([
            supabase
                .from("conductores_perfil")
                .select("saldo_billetera")
                .eq("usuario_id", conductorId)
                .single(),

            supabase
                .from("billetera_movimientos")
                .select(
                    "id, conductor_id, monto, tipo, descripcion, referencia_pago, estado, creado_en"
                )
                .eq("conductor_id", conductorId)
                .order("creado_en", { ascending: false })
                .limit(30),
        ]);

        if (perfilResult.error) {
            throw new Error (
                `No se pudo consultar el saldo: ${perfilResult.error.message}`
            );
        }

        if (movimientosResult.error) {
            throw new Error (
                `No se pudo consultar el historial: ${movimientosResult.error.message}`
            );
        }

        return {
            saldo: Number(perfilResult.data.saldo_billetera ?? 0),
            movimientos: movimientosResult.data ?? [],
        };
    },
};