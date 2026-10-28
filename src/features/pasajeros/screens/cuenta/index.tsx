import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarPerfil } from "@/features/pasajeros/components/AvatarPerfil";
import { ItemMenu } from "@/features/pasajeros/components/ItemMenu";
import { COLORES_CUENTA } from "@/features/pasajeros/constants/cuenta";
import { paletaColores } from "@/shared/theme/paletaColores";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import React from "react";

const OPCIONES = [
  {
    icono: "person-outline",
    titulo: "Información personal",
    subtitulo: "Tu perfil y datos de cuenta",
    ruta: "/cuenta/informacion-personal",
  },
  {
    icono: "shield-checkmark-outline",
    titulo: "Seguridad",
    subtitulo: "Protege tu cuenta",
    ruta: "/cuenta/seguridad",
  },
  {
    icono: "card-outline",
    titulo: "Métodos de pago",
    subtitulo: "Efectivo, Yape y Plin",
    ruta: "/cuenta/metodos-pago",
  },
  {
    icono: "location-outline",
    titulo: "Direcciones guardadas",
    subtitulo: "Casa, trabajo y más",
    ruta: "/cuenta/direcciones",
  },
  {
    icono: "notifications-outline",
    titulo: "Notificaciones",
    subtitulo: "Elige qué quieres recibir",
    ruta: "/cuenta/notificaciones",
  },
  {
    icono: "settings-outline",
    titulo: "Configuración",
    subtitulo: "Idioma, apariencia y más",
    ruta: "/cuenta/configuracion",
  },
  {
    icono: "help-circle-outline",
    titulo: "Ayuda",
    subtitulo: "Centro de soporte y preguntas frecuentes",
    ruta: "/ayuda",
  },
] as const;

export default function CuentaPasajero() {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useAltokkeTheme();
  const { logout } = useAuth();
  const { perfil } = usePerfilPasajero();

  const nombre = perfil?.nombreCompleto || perfil?.primerNombre || "Pasajero";
  const foto = perfil?.fotoUrl || null;
  const calificacion = perfil ? perfil.calificacion.toFixed(1) : "5.0";
  const viajesTexto = perfil ? `(${perfil.viajesCount} viajes)` : "(0 viajes)";

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
          }
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const bgCabecera = esOscuro ? colores.superficie : COLORES_CUENTA.cabecera;

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.cabecera, { paddingTop: insets.top + 14, backgroundColor: bgCabecera }]}>
          <Text style={[styles.logo, { color: esOscuro ? colores.texto : "#FFFFFF" }]}>Altokke</Text>
          <Text style={[styles.lema, { color: esOscuro ? colores.secundario : "rgba(255,255,255,0.75)" }]}>
            Tu movilidad en buenas manos
          </Text>

          <View style={styles.perfil}>
            <AvatarPerfil
              nombre={nombre}
              tamano={84}
              enLinea
              conBorde
              uri={foto}
            />

            <View style={styles.perfilTextos}>
              <Text style={[styles.nombre, { color: esOscuro ? colores.texto : "#FFFFFF" }]}>{nombre}</Text>

              <View style={styles.filaInfo}>
                <Ionicons name="star" size={15} color={paletaColores.advertencia} />
                <Text style={[styles.calificacion, { color: esOscuro ? colores.texto : "#FFFFFF" }]}>
                  {calificacion}
                </Text>
                <Text style={[styles.viajes, { color: esOscuro ? colores.secundario : "rgba(255,255,255,0.75)" }]}>
                  {viajesTexto}
                </Text>
              </View>

              <View style={styles.filaInfo}>
                <Text style={[styles.mensaje, { color: colores.exitoTexto }]}>
                  Tu próxima parada está más cerca
                </Text>
                <Ionicons name="heart" size={12} color={colores.exitoTexto} />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.lista, { backgroundColor: colores.fondo }]}>
          {OPCIONES.map((opcion) => (
            <ItemMenu
              key={opcion.titulo}
              variante="tarjeta"
              icono={opcion.icono}
              titulo={opcion.titulo}
              subtitulo={opcion.subtitulo}
              onPress={() => router.push(opcion.ruta)}
            />
          ))}

          <ItemMenu
            variante="tarjeta"
            peligro
            icono="log-out-outline"
            titulo="Cerrar sesión"
            subtitulo="Salir de tu cuenta"
            onPress={cerrarSesion}
          />
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 16,
  },

  cabecera: {
    paddingHorizontal: 20,
    paddingBottom: 44,
  },

  logo: {
    fontSize: 20,
    fontWeight: "800",
  },

  lema: {
    marginTop: 2,
    fontSize: 12,
  },

  perfil: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },

  perfilTextos: {
    flex: 1,
    gap: 4,
  },

  nombre: {
    fontSize: 22,
    fontWeight: "700",
  },

  filaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  calificacion: {
    fontSize: 15,
    fontWeight: "700",
  },

  viajes: {
    fontSize: 13,
  },

  mensaje: {
    fontSize: 12,
  },

  lista: {
    gap: 10,
    marginTop: -24,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
