import { BotonPrincipal, ContenedorPantalla } from "@/shared/components/ui";
import { paletaColores } from "@/shared/theme/paletaColores";
import { authService } from "@/features/autenticacion/services/authService";
import { EstadoConductor, obtenerEstadoConductor } from "@/features/conductores/services/estadoConductor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

const CONFIG_ESTADOS: Record<
  EstadoConductor,
  { titulo: string; descripcion: string; icono: keyof typeof Ionicons.glyphMap; color: string }
> = {
  aprobado: {
    titulo: "¡Solicitud aprobada!",
    descripcion: "Tu cuenta fue aprobada. Ya puedes comenzar a conducir con Altokke.",
    icono: "checkmark-circle",
    color: paletaColores.boton,
  },
  pendiente: {
    titulo: "Tu solicitud está en revisión",
    descripcion: "Estamos revisando tus datos y documentos. Por ahora no puedes recibir viajes.",
    icono: "time-outline",
    color: "#F59E0B",
  },
  rechazado: {
    titulo: "Tu solicitud tiene observaciones",
    descripcion: "Encontramos observaciones en tu solicitud. Debes corregirlas antes de comenzar.",
    icono: "alert-circle-outline",
    color: "#EF4444",
  },
  suspendido: {
    titulo: "Tu cuenta está suspendida",
    descripcion: "Tu acceso como conductor está temporalmente suspendido.",
    icono: "alert-circle-outline",
    color: "#EF4444",
  },
};

export default function EstadoSolicitudScreen() {
  const [estado, setEstado] = useState<EstadoConductor | null>(null);
  const [cargando, setCargando] = useState(true);

  const consultarEstado = useCallback(async () => {
    setCargando(true);
    try {
      const user = await authService.obtenerUsuarioActual();
      if (!user) {
        router.replace("/login");
        return;
      }
      const estadoActual = await obtenerEstadoConductor(user.id);
      setEstado(estadoActual);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo consultar tu solicitud.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    consultarEstado();
  }, [consultarEstado]);

  const cerrarSesion = async () => {
    await authService.cerrarSesion();
    router.replace("/login");
  };


  const pantallaFondo = (contenido: React.ReactNode) => (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <ContenedorPantalla estiloContenedorContenido={styles.container}>{contenido}</ContenedorPantalla>
    </LinearGradient>
  );

  if (cargando) {
    return pantallaFondo(
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={paletaColores.boton} />
        <Text style={styles.textoCargando}>Consultando tu solicitud...</Text>
      </View>
    );
  }

  if (!estado || !CONFIG_ESTADOS[estado]) {
    return pantallaFondo(
      <View style={styles.centro}>
        <Text style={styles.descripcion}>No se pudo cargar tu solicitud.</Text>
        <BotonPrincipal titulo="Reintentar" onPress={consultarEstado} />
        <BotonPrincipal titulo="Cerrar sesión" onPress={cerrarSesion} />
      </View>
    );
  }

  const { titulo, descripcion, icono, color } = CONFIG_ESTADOS[estado];
  const esAprobado = estado === "aprobado";

  return pantallaFondo(
    <View style={styles.contenido}>
      <Ionicons name={icono} size={80} color={color} />
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>Estado de tu solicitud</Text>
        <Text style={[styles.estado, { color }]}>{estado.toUpperCase()}</Text>
      </View>

      <View style={styles.acciones}>
        {esAprobado ? (
          <BotonPrincipal titulo="Empezar a conducir" onPress={() => router.replace("/inicio")} />
        ) : (
          <BotonPrincipal titulo="Actualizar estado" onPress={consultarEstado} />
        )}
        <BotonPrincipal titulo="Cerrar sesión" onPress={cerrarSesion} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  contenido: {
    alignItems: "center",
    gap: 18,
  },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  textoCargando: {
    color: "#C2D4CB",
    fontSize: 16,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#FFFFFF",
  },
  descripcion: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    color: "#C2D4CB",
  },
  tarjeta: {
    width: "100%",
    backgroundColor: paletaColores.input,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    alignItems: "center",
  },
  etiqueta: {
    fontSize: 13,
    color: paletaColores.textoSecundario,
  },
  estado: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: 1,
  },
  acciones: {
    width: "100%",
    gap: 14,
    marginTop: 10,
  },
});

