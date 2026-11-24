import { ReactNode, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { AvisoInformativo } from "@/shared/components/ui";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { router } from "expo-router";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

interface FilaProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  estado?: string;
  onPress?: () => void;
  controlDerecho?: ReactNode;
}

function FilaSeguridad({ icono, titulo, descripcion, estado, onPress, controlDerecho }: FilaProps) {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const contenido = (
    <View style={styles.fila}>
      <View style={styles.iconoBox}>
        <Ionicons name={icono} size={20} color={c.primario} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        <Text style={styles.filaSubtitulo}>{descripcion}</Text>
      </View>
      {estado && (
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{estado}</Text>
        </View>
      )}
      {controlDerecho}
      {onPress && <Ionicons name="chevron-forward" size={18} color={c.textoSec} />}
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
      {contenido}
    </Pressable>
  ) : (
    contenido
  );
}

export default function SeguridadConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const { perfil } = usePerfilConductor();
  const seguridad = perfil.seguridad;
  const [compartirViaje, setCompartirViaje] = useState(seguridad.compartirViaje);

  return (
    <View style={styles.container}>
      <CabeceraConductor titulo="Seguridad" mostrarAtras compacta />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark" size={26} color={c.primario} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardHeaderTitulo}>Conduce con confianza</Text>
            <Text style={styles.cardHeaderSubtitulo}>Herramientas de seguridad activas para protegerte mientras conduces.</Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Seguridad de tu cuenta</Text>
          <View style={styles.card}>
            <FilaSeguridad
              icono="person-circle-outline"
              titulo="Verificación de identidad"
              descripcion="Tu identidad ha sido validada."
              estado={seguridad.identidadVerificada ? "Verificado" : "Pendiente"}
            />
            <FilaSeguridad
              icono="people-outline"
              titulo="Contacto de emergencia"
              descripcion="Persona de confianza para emergencias."
              estado={seguridad.contactoEmergenciaConfigurado ? "Configurado" : "Pendiente"}
            />
            <FilaSeguridad
              icono="navigate-circle-outline"
              titulo="Compartir viaje en tiempo real"
              descripcion="Permite compartir tu ubicación durante un viaje."
              controlDerecho={
                <Switch
                  value={compartirViaje}
                  onValueChange={setCompartirViaje}
                  trackColor={{ false: c.superficieSuave, true: c.primarioSuave }}
                  thumbColor={compartirViaje ? c.primario : "#FFFFFF"}
                />
              }
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Ayuda y soporte</Text>
          <View style={styles.card}>
            <FilaSeguridad
              icono="help-circle-outline"
              titulo="Centro de ayuda"
              descripcion="Preguntas frecuentes y soporte directo."
              onPress={() => router.push("/conductor/cuenta/centro-ayuda")}
            />
            <FilaSeguridad
              icono="alert-circle-outline"
              titulo="Reportar incidente"
              descripcion="Informa cualquier situación ocurrida."
              onPress={() => router.push("/conductor/cuenta/reportar-incidente")}
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Acceso</Text>
          <View style={styles.card}>
            <FilaSeguridad
              icono="lock-closed-outline"
              titulo="Cambiar contraseña"
              descripcion="Actualiza tus credenciales de acceso."
              onPress={() => router.push("/conductor/cuenta/cambiar-contrasena")}
            />
          </View>
        </View>

        <AvisoInformativo
          icono="shield-checkmark"
          texto="Tu información y viajes se encuentran protegidos y monitoreados por la central."
          variante="claro"
        />
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.fondo,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.superficie,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  cardHeaderTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: c.texto,
  },
  cardHeaderSubtitulo: {
    fontSize: 13,
    color: c.textoSec,
    marginTop: 2,
  },
  seccion: {
    gap: 8,
  },
  tituloSeccion: {
    fontSize: 14,
    fontWeight: "700",
    color: c.textoSec,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: c.superficie,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  iconoBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primarioSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  filaTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: c.texto,
  },
  filaSubtitulo: {
    fontSize: 12,
    color: c.textoSec,
    marginTop: 1,
  },
  badge: {
    backgroundColor: c.primarioSuave,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: c.primario,
  },
});
