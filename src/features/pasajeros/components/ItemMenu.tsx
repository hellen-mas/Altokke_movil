import React from "react";
import {
  FilaOpcionMenu,
  PropsFilaOpcionMenu,
} from "@/shared/components/ui/FilaOpcionMenu";

export type Props = PropsFilaOpcionMenu;

export function ItemMenu(props: Props) {
  return <FilaOpcionMenu {...props} />;
}

export default ItemMenu;
