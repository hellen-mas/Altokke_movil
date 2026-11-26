import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { TarjetaOpcion } from "@/shared/components/ui/TarjetaOpcion";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const opciones = [
  { modo: "claro", titulo: "Claro", descripcion: "Usar siempre el tema claro.", icono: "sunny-outline" },
  { modo: "oscuro", titulo: "Oscuro", descripcion: "Usar siempre el tema oscuro.", icono: "moon-outline" },
  { modo: "automatico", titulo: "Automático", descripcion: "Seguir el tema del dispositivo.", icono: "phone-portrait-outline" },
] as const;

export default function AparienciaConductor() {
  const { c } = useColoresConductor();
  const { modoPreferido, setModoPreferido } = useAltokkeTheme();

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.fondo }}>
      <CabeceraConductor titulo="Apariencia" mostrarAtras compacta />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {opciones.map(({ modo, titulo, descripcion, icono }) => (
          <TarjetaOpcion
            key={modo}
            titulo={titulo}
            descripcion={descripcion}
            icono={icono}
            activa={modoPreferido === modo}
            alCambiar={() => setModoPreferido(modo)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
