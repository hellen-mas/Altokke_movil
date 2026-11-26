import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { DatoPersonal } from "@/features/conductores/components/DatoPersonal";
import { ContenedorGrupoAjustes } from "@/shared/components/ui";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MapaConductor() {
  const { c } = useColoresConductor();

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.fondo }}>
      <CabeceraConductor titulo="Preferencias de mapa" mostrarAtras compacta />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ContenedorGrupoAjustes>
          <DatoPersonal
            icono="map-outline"
            titulo="Estilo del mapa de viajes"
            valor="Estándar"
            ultimo
          />
        </ContenedorGrupoAjustes>
      </ScrollView>
    </SafeAreaView>
  );
}
