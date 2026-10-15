
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { supabase } from "@/lib/supabase";
import {
  obtenerEstadoConductor,
  EstadoConductor,
} from "@/services/estadoConductor";

export default function EstadoSolicitudScreen() {
  const [estado, setEstado] = useState<EstadoConductor | null>(null);
  const [cargando, setCargando] = useState(true);

  const consultarEstado = useCallback(async () => {
    setCargando(true);

    try {
      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const estadoActual =
        await obtenerEstadoConductor(user.id);

      setEstado(estadoActual);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo consultar tu solicitud."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    consultarEstado();
  }, [consultarEstado]);

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.replace("/login");
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#168451" />
        <Text>Consultando tu solicitud...</Text>
      </View>
    );
  }

  if (!estado) {
    return (
      <View style={styles.centro}>
        <Text>No se pudo cargar tu solicitud.</Text>
        <BotonPrincipal
          titulo="Reintentar"
          onPress={consultarEstado}
        />
        <BotonPrincipal
          titulo="Cerrar sesión"
          onPress={cerrarSesion}
        />
      </View>
    );
  }

  const aprobado = estado === "aprobado";
  const pendiente = estado === "pendiente";
  const rechazado = estado === "rechazado";

  const titulo = aprobado
    ? "¡Solicitud aprobada!"
    : pendiente
      ? "Tu solicitud está en revisión"
      : rechazado
        ? "Tu solicitud tiene observaciones"
        : "Tu cuenta está suspendida";

  const descripcion = aprobado
    ? "Tu cuenta fue aprobada. Ya puedes comenzar a conducir con Altokke."
    : pendiente
      ? "Estamos revisando tus datos y documentos. Por ahora no puedes recibir viajes."
      : rechazado
        ? "Encontramos observaciones en tu solicitud. Debes corregirlas antes de comenzar."
        : "Tu acceso como conductor está suspendido.";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons
        name={
          aprobado
            ? "checkmark-circle"
            : pendiente
              ? "time-outline"
              : "alert-circle-outline"
        }
        size={76}
        color={aprobado ? "#168451" : "#D69B22"}
      />

      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>
          Estado de tu solicitud
        </Text>
        <Text style={styles.estado}>
          {estado.toUpperCase()}
        </Text>
      </View>

      {aprobado ? (
        <BotonPrincipal
          titulo="Empezar a conducir"
          onPress={() => router.replace("/inicio")}
        />
      ) : (
        <BotonPrincipal
          titulo="Actualizar estado"
          onPress={consultarEstado}
        />
      )}

      <View style={styles.separador} />

      <BotonPrincipal
        titulo="Cerrar sesión"
        onPress={cerrarSesion}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 40,
    alignItems: "center",
    gap: 20,
  },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 24,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#172D25",
  },
  descripcion: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    color: "#64748B",
  },
  tarjeta: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 20,
    marginVertical: 20,
  },
  etiqueta: {
    fontSize: 13,
    color: "#64748B",
  },
  estado: {
    fontSize: 17,
    fontWeight: "700",
    color: "#168451",
    marginTop: 8,
  },
  separador: {
    height: 1,
    width: "100%",
    backgroundColor: "#E2E8F0",
  },
});
