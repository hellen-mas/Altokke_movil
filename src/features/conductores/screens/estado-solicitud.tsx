import { authService } from "@/features/autenticacion/services/authService";
import {
  EstadoConductor,
  obtenerEstadoConductor,
} from "@/features/conductores/services/conductorService";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Icono = keyof typeof Ionicons.glyphMap;

const ESTADOS: Record<
  EstadoConductor,
  { 
    titulo: string; 
    descripcion: string; 
    etiqueta: string;
    icono: Icono;
  }
> = {
  pendiente: {
    titulo: "Solicitud en revisión",
    descripcion:
      "Estamos verificando tu información y documentos. Te informaremos cuando termine la revisión.",
    etiqueta: "En revisión",
    icono: "time-outline",
  },
  aprobado: {
    titulo: "¡Todo está listo!",
    descripcion:
      "Tu solicitud fue aprobada. Ya puedes comenzar a recibir viajes con Altokke.",
    etiqueta: "Aprobada",
    icono: "checkmark-outline",
  },
  rechazado: {
    titulo: "Solicitud observada",
    descripcion:
      "Encontramos observaciones en tu solicitud. Comunícate con soporte para conocer los detalles.",
    etiqueta: "Requiere atención",
    icono: "alert-outline",
  },
  suspendido: {
    titulo: "Cuenta suspendida",
    descripcion:
      "Tu acceso como conductor está suspendido. Comunícate con soporte para recibir ayuda.",
    etiqueta: "Suspendida",
    icono: "lock-closed-outline",
  },
};

export default function EstadoSolicitudScreen() {
  const { colores } = useAltokkeTheme();

  const {
    data: estado,
    isFetching: cargando,
    error,
    refetch,
  } = useQuery({
    queryKey: ["estado-solicitud-conductor"],
    queryFn: async () => {
      const user = await authService.obtenerUsuarioActual();

      if (!user) {
        router.replace("/login");
        return null;
      }

      return obtenerEstadoConductor(user.id);
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (error) {
      Alert.alert(
        "No se pudo consultar",
        error.message || "Inténtalo nuevamente."
      );
    }
  }, [error]);

  const cerrarSesion = async () => {
    try {
      await authService.cerrarSesion();
      router.replace("/login");
    } catch {
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    }
  };

  const configuracion = estado ? ESTADOS[estado] : null;
  const esAprobado = estado === "aprobado";

  const colorEstado =
    estado === "rechazado" || estado === "suspendido"
      ? colores.error
      : colores.exitoTexto;

  const fondoIcono =
    estado === "rechazado" || estado === "suspendido"
      ? colores.errorFondo
      : colores.exitoFondo;

  return (
    <SafeAreaView
      style={[
        styles.pantalla,
        { backgroundColor: colores.fondo },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contenido}>
          {cargando ? (
            <View style={styles.centro}>
              <ActivityIndicator
                size="large"
                color={colores.exitoTexto}
              />
              <Text
                style={[
                  styles.descripcion,
                  { color: colores.secundario },
                ]}
              >
                Consultando tu solicitud...
              </Text>
            </View>
          ) : configuracion ? (
            <>
              <View
                style={[
                  styles.iconoContenedor,
                  { backgroundColor: fondoIcono },
                ]}
              >
                <Ionicons
                  name={configuracion.icono}
                  size={34}
                  color={colorEstado}
                />
              </View>

              <Text
                style={[
                  styles.titulo,
                  { color: colores.texto },
                ]}
              >
                {configuracion.titulo}
              </Text>

              <Text
                style={[
                  styles.descripcion,
                  { color: colores.secundario },
                ]}
              >
                {configuracion.descripcion}
              </Text>

              <View
                style={[
                  styles.tarjeta,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.linea,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.etiqueta,
                    { color: colores.secundario },
                  ]}
                >
                  ESTADO ACTUAL
                </Text>

                <View style={styles.filaEstado}>
                  <Ionicons
                    name="ellipse"
                    size={11}
                    color={colorEstado}
                  />

                  <Text
                    style={[
                      styles.valorEstado,
                      { color: colores.texto },
                    ]}
                  >
                    {configuracion.etiqueta}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View
                style={[
                  styles.iconoContenedor,
                  { backgroundColor: colores.campo },
                ]}
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={32}
                  color={colores.secundario}
                />
              </View>

              <Text
                style={[
                  styles.titulo,
                  { color: colores.texto },
                ]}
              >
                No pudimos cargar tu solicitud
              </Text>

              <Text
                style={[
                  styles.descripcion,
                  { color: colores.secundario },
                ]}
              >
                Comprueba tu conexión e inténtalo nuevamente.
              </Text>
            </>
          )}
        </View>

        <View style={styles.acciones}>
          <Pressable
            disabled={cargando}
            onPress={
              esAprobado
                ? () => router.replace("/inicio")
                : () => void refetch()
            }
            style={({ pressed }) => [
              styles.botonPrincipal,
              {
                backgroundColor: colores.primario,
                opacity: cargando ? 0.55 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.textoPrincipal,
                { color: colores.textoBoton },
              ]}
            >
              {esAprobado
                ? "Empezar a conducir"
                : "Actualizar estado"}
            </Text>

            <Ionicons
              name={
                esAprobado
                  ? "arrow-forward"
                  : "refresh-outline"
              }
              size={18}
              color={colores.textoBoton}
            />
          </Pressable>

          <Pressable
            onPress={() => void cerrarSesion()}
            style={styles.botonSecundario}
          >
            <Text
              style={[
                styles.textoSecundario,
                { color: colores.secundario },
              ]}
            >
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 30,
  },
  marca: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  contenido: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  centro: {
    alignItems: "center",
    gap: 18,
  },
  iconoContenedor: {
    width: 76,
    height: 76,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  titulo: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
    marginBottom: 14,
  },
  descripcion: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 330,
  },
  tarjeta: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 36,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  filaEstado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  valorEstado: {
    fontSize: 16,
    fontWeight: "700",
  },
  acciones: {
    gap: 10,
  },
  botonPrincipal: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 18,
  },
  textoPrincipal: {
    fontSize: 15,
    fontWeight: "700",
  },
  botonSecundario: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  textoSecundario: {
    fontSize: 14,
    fontWeight: "600",
  },
});

