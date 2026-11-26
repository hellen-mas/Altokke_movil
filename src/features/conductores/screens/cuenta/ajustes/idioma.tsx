import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { DatoPersonal } from "@/features/conductores/components/DatoPersonal";
import { ContenedorGrupoAjustes } from "@/shared/components/ui";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IdiomaConductor() {
  const { c } = useColoresConductor();

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.fondo }}>
      <CabeceraConductor titulo="Idioma" mostrarAtras compacta />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ContenedorGrupoAjustes>
          <DatoPersonal
            icono="globe-outline"
            titulo="Idioma de la aplicación"
            valor="Español (Perú)"
            ultimo
          />
        </ContenedorGrupoAjustes>
      </ScrollView>
    </SafeAreaView>
  );
}
