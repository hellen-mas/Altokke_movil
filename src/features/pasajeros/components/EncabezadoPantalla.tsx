import {
  BarraSuperiorNavegacion,
  PropsBarraSuperiorNavegacion,
} from "@/shared/components/ui/BarraSuperiorNavegacion";

export type Props = PropsBarraSuperiorNavegacion;

export function EncabezadoPantalla(props: Props) {
  return <BarraSuperiorNavegacion {...props} />;
}

export default EncabezadoPantalla;
