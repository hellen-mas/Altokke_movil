import { ReactNode, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { CONDUCTOR_EJEMPLO } from "@/constants/conductor";
import { paletaColores } from "@/paletaColores";
import { router } from "expo-router";

interface FilaSeguridadProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  estado?: string;
  onPress?: () => void;
  controlDerecho?: ReactNode;
  ultimo?: boolean;
}

function FilaSeguridad({
  icono,
  titulo,
  descripcion,
  estado,
  onPress,
  controlDerecho,
  ultimo = false,
}: FilaSeguridadProps) {
  const contenido = (
    <>
      <View style={styles.iconoContainer}>
        <Ionicons
          name={icono}
          size={20}
          color={paletaColores.verde}
        />
      </View>

      <View style={styles.filaInformacion}>
        <Text style={styles.filaTitulo}>
          {titulo}
        </Text>

        <Text style={styles.filaDescripcion}>
          {descripcion}
        </Text>
      </View>

      {estado && (
        <View style={styles.estadoContainer}>
          <Text style={styles.estadoTexto}>
            {estado}
          </Text>
        </View>
      )}

      {controlDerecho}

      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={paletaColores.textoSecundarioClaro}
        />
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.fila,
          ultimo && styles.ultimaFila,
          pressed && styles.filaPresionada,
        ]}
      >
        {contenido}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.fila,
        ultimo && styles.ultimaFila,
      ]}
    >
      {contenido}
    </View>
  );
}

export default function SeguridadConductor() {
  const seguridad = CONDUCTOR_EJEMPLO.seguridad;

  const [compartirViaje, setCompartirViaje] = useState(
    seguridad.compartirViaje
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cabecera */}
        <CabeceraConductor
          titulo="Seguridad"
          subtitulo="Tu seguridad es nuestra prioridad"
          mostrarAtras
          compacta
        />

        {/* Tarjeta principal */}
        <View style={styles.confianzaCard}>
          <View style={styles.confianzaIcono}>
            <Ionicons
              name="shield-checkmark"
              size={26}
              color={paletaColores.verde}
            />
          </View>

          <View style={styles.confianzaInformacion}>
            <Text style={styles.confianzaTitulo}>
              Conduce con confianza
            </Text>

            <Text style={styles.confianzaDescripcion}>
              Tu cuenta cuenta con herramientas de seguridad
              para protegerte mientras conduces con Altokke.
            </Text>
          </View>
        </View>

        {/* Seguridad de la cuenta */}
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Seguridad de tu cuenta
          </Text>

          <View style={styles.opcionesCard}>
            <FilaSeguridad
              icono="person-circle-outline"
              titulo="Verificación de identidad"
              descripcion="Tu identidad ha sido validada."
              estado={
                seguridad.identidadVerificada
                  ? "Verificado"
                  : "Pendiente"
              }
            />

            <FilaSeguridad
              icono="people-outline"
              titulo="Contacto de emergencia"
              descripcion="Persona de confianza para situaciones de emergencia."
              estado={
                seguridad.contactoEmergenciaConfigurado
                  ? "Configurado"
                  : "Pendiente"
              }
            />

            <FilaSeguridad
              icono="navigate-circle-outline"
              titulo="Compartir viaje en tiempo real"
              descripcion="Permite compartir tu ubicación durante un viaje."
              controlDerecho={
                <Switch
                  value={compartirViaje}
                  onValueChange={setCompartirViaje}
                  trackColor={{
                    false: "#CBD5D0",
                    true: "#A7DFC1",
                  }}
                  thumbColor={
                    compartirViaje
                      ? paletaColores.verde
                      : "#FFFFFF"
                  }
                />
              }
            />
          </View>
        </View>

        {/* Ayuda */}
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Ayuda y soporte
          </Text>

          <View style={styles.opcionesCard}>
            <FilaSeguridad
              icono="help-circle-outline"
              titulo="Centro de ayuda y soporte"
              descripcion="Encuentra respuestas y recibe asistencia."
              onPress={() => router.push("/cuenta/centro-ayuda")}
            />

            <FilaSeguridad
              icono="alert-circle-outline"
              titulo="Reportar incidente"
              descripcion="Informa cualquier situación o problema ocurrido."
              onPress={() => router.push("/cuenta/reportar-indicente")}
              ultimo
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Acceso a tu cuenta
          </Text>

          <View style={styles.opcionesCard}>
            <FilaSeguridad
              icono="lock-closed-outline"
              titulo="Cambiar contraseña o PIN"
              descripcion="Actualiza tus credenciales de acceso."
              onPress={() => router.push("/cuenta/cambiar-contrasena")}
              ultimo
            />
          </View>
        </View>

        {/* Aviso final */}
        <View style={styles.avisoContainer}>
          <AvisoInformativo
            icono="shield-checkmark-outline"
            titulo="Información segura"
            texto="Protegemos la información de tu cuenta y utilizamos medidas de seguridad para mantener tus datos protegidos."
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  confianzaCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    marginTop: 16,
    padding: 15,
    gap: 12,
    borderRadius: 17,
    backgroundColor: "#E8F4ED",
    borderWidth: 1,
    borderColor: "#D6EADF",
  },

  confianzaIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
  },

  confianzaInformacion: {
    flex: 1,
  },

  confianzaTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 14,
    fontWeight: "800",
  },

  confianzaDescripcion: {
    marginTop: 3,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 10,
    lineHeight: 15,
  },

  seccion: {
    marginHorizontal: 18,
    marginTop: 18,
  },

  tituloSeccion: {
    marginBottom: 8,
    color: paletaColores.textoClaro,
    fontSize: 13,
    fontWeight: "800",
  },

  opcionesCard: {
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 17,
    backgroundColor: paletaColores.superficieClara,
    overflow: "hidden",
  },

  fila: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1EF",
  },

  ultimaFila: {
    borderBottomWidth: 0,
  },

  filaPresionada: {
    backgroundColor: "#F5F8F6",
  },

  iconoContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4ED",
  },

  filaInformacion: {
    flex: 1,
  },

  filaTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 12,
    fontWeight: "700",
  },

  filaDescripcion: {
    marginTop: 2,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 9,
    lineHeight: 13,
  },

  estadoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#E8F4ED",
  },

  estadoTexto: {
    color: paletaColores.verde,
    fontSize: 8,
    fontWeight: "700",
  },

  avisoContainer: {
    marginHorizontal: 18,
    marginTop: 4,
  },
});