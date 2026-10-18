import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { paletaColores } from "@/paletaColores";
import { authService } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

type EstadoSolicitud = "PENDIENTE" | "APROBADA" | "RECHAZADA";

const ESTADOS_MAP: Record<
  EstadoSolicitud,
  {
    titulo: string;
    descripcion: string;
    estadoTexto: string;
    informacion: string;
    textoBoton: string;
    icono: keyof typeof Ionicons.glyphMap;
    iconoInfo: keyof typeof Ionicons.glyphMap;
    color: string;
    fondoIcono: string;
  }
> = {
  APROBADA: {
    titulo: "¡Cuenta aprobada!",
    descripcion: "Tu registro como conductor fue aprobado correctamente.",
    estadoTexto: "Cuenta activa",
    informacion: "Ya puedes comenzar a utilizar Altokke como conductor.",
    textoBoton: "Ir al inicio",
    icono: "checkmark-circle",
    iconoInfo: "car-sport-outline",
    color: paletaColores.verde,
    fondoIcono: "#E5F8EF",
  },
  RECHAZADA: {
    titulo: "Necesitamos una corrección",
    descripcion: "Encontramos información que necesita ser revisada antes de activar tu cuenta.",
    estadoTexto: "Requiere corrección",
    informacion: "Revisa las observaciones y actualiza la información solicitada.",
    textoBoton: "Corregir información",
    icono: "alert-circle",
    iconoInfo: "information-circle-outline",
    color: "#EF4444",
    fondoIcono: "#FDECEC",
  },
  PENDIENTE: {
    titulo: "Solicitud enviada",
    descripcion: "Hemos recibido correctamente tu información.",
    estadoTexto: "Pendiente de revisión",
    informacion: "Tu registro está siendo revisado por el equipo de Altokke.",
    textoBoton: "Entendido",
    icono: "checkmark-circle",
    iconoInfo: "time-outline",
    color: "#D69B22",
    fondoIcono: "#FFF6DB",
  },
};

const PASOS_PROCESO = [
  { icono: "document-text-outline" as const, titulo: "Revisión de información", desc: "Revisaremos tus datos personales y documentos." },
  { icono: "shield-checkmark-outline" as const, titulo: "Validación", desc: "Comprobaremos que toda la información sea válida." },
  { icono: "notifications-outline" as const, titulo: "Te notificaremos", desc: "Recibirás un aviso cuando tu cuenta sea aprobada." },
];

export default function SolicitudEnviada() {
  const [estado] = useState<EstadoSolicitud>("PENDIENTE");
  const config = ESTADOS_MAP[estado];

  const irAlLogin = async () => {
    try {
      await authService.cerrarSesion();
    } catch {
      Alert.alert("Aviso", "No se pudo cerrar la sesión.");
    }
    router.replace("/login");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contenido}>
        <View style={[styles.iconoPrincipal, { backgroundColor: config.fondoIcono }]}>
          <Ionicons name={config.icono} size={46} color={config.color} />
        </View>

        <Text style={styles.titulo}>{config.titulo}</Text>
        <Text style={styles.descripcion}>{config.descripcion}</Text>

        <View style={styles.estadoCard}>
          <Text style={styles.estadoLabel}>Estado de tu solicitud</Text>
          <View style={styles.estadoFila}>
            <View style={[styles.estadoPunto, { backgroundColor: config.color }]} />
            <Text style={[styles.estadoTexto, { color: config.color }]}>{config.estadoTexto}</Text>
          </View>
        </View>

        <View style={styles.informacionCard}>
          <View style={[styles.informacionIcono, { backgroundColor: config.fondoIcono }]}>
            <Ionicons name={config.iconoInfo} size={21} color={config.color} />
          </View>
          <Text style={styles.informacionTexto}>{config.informacion}</Text>
        </View>

        {estado === "PENDIENTE" && (
          <View style={styles.procesoContainer}>
            <Text style={styles.procesoTitulo}>¿Qué sigue ahora?</Text>
            {PASOS_PROCESO.map((paso, index) => (
              <React.Fragment key={paso.titulo}>
                <View style={styles.procesoItem}>
                  <View style={styles.procesoIcono}>
                    <Ionicons name={paso.icono} size={20} color={paletaColores.verde} />
                  </View>
                  <View style={styles.procesoInformacion}>
                    <Text style={styles.procesoItemTitulo}>{paso.titulo}</Text>
                    <Text style={styles.procesoDescripcion}>{paso.desc}</Text>
                  </View>
                </View>
                {index < PASOS_PROCESO.length - 1 && <View style={styles.lineaProceso} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      <View style={styles.acciones}>
        <BotonPrincipal titulo={config.textoBoton} onPress={irAlLogin} />
        {estado === "PENDIENTE" && (
          <Text style={styles.textoInferior}>
            Puedes cerrar la aplicación. Tu solicitud permanecerá registrada.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 38,
  },
  contenido: {
    flex: 1,
    alignItems: "center",
    paddingTop: 36,
  },
  iconoPrincipal: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    color: paletaColores.textoClaro,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  descripcion: {
    maxWidth: 320,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  estadoCard: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
    marginBottom: 12,
  },
  estadoLabel: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },
  estadoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  estadoPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  informacionCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F3F6F4",
  },
  informacionIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  informacionTexto: {
    flex: 1,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12.5,
    lineHeight: 18,
  },
  procesoContainer: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },
  procesoTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  procesoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  procesoIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F7F0",
  },
  procesoInformacion: {
    flex: 1,
  },
  procesoItemTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 13,
    fontWeight: "700",
  },
  procesoDescripcion: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  lineaProceso: {
    width: 1,
    height: 14,
    marginLeft: 18,
    marginVertical: 3,
    backgroundColor: paletaColores.bordeClaro,
  },
  acciones: {
    width: "100%",
    marginTop: 24,
  },
  textoInferior: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },
});
