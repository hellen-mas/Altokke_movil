import type { Database } from "@/shared/types/database.schema";

export type MovimientoBilletera = Database["public"]["Tables"]["billetera_movimientos"]["Row"];
export interface ResumenBilletera {
    saldo: number;
    movimientos: MovimientoBilletera[];
}