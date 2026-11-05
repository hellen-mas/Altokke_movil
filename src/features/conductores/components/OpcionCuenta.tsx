import React from "react";
import {
  FilaOpcionMenu,
  PropsFilaOpcionMenu,
} from "@/shared/components/ui/FilaOpcionMenu";

export type OpcionCuentaProps = PropsFilaOpcionMenu;

export function OpcionCuenta(props: OpcionCuentaProps) {
  return <FilaOpcionMenu {...props} />;
}

export default OpcionCuenta;
