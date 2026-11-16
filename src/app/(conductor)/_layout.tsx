import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/shared/api/supabase";
import { obtenerEstadoConductor } from "@/features/conductores/services/conductorService";

import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { useAlertaConductor } from "@/features/notificaciones/hooks/useAlertaConductor";

export default function ConductorLayout() {
  const { c } = useColoresConductor();
  const insets = useSafeAreaInsets();
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  useAlertaConductor({
    habilitado: autorizado && !verificando,
    radioKm: 3,
  });

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const verificarAcceso = async () => {
        if (activo) {
          setVerificando(true);
          setAutorizado(false);
        }

        try {
          const { data: { user } } =
            await supabase.auth.getUser();

          if (!user || user.user_metadata?.rol !== "conductor") {
            if (activo) setAutorizado(false);
            return;
          }

          const estado =
            await obtenerEstadoConductor(user.id);

          if (activo) {
            setAutorizado(estado === "aprobado");
          }
        } catch (error) {
          console.error("Error verificando conductor:", error);
          if (activo) setAutorizado(false);
        } finally {
          if (activo) setVerificando(false);
        }
      };

      verificarAcceso();

      return () => {
        activo = false;
      };
    }, [])
  );

  if (verificando) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: c.fondo,
      }}>
        <ActivityIndicator
          size="large"
          color={c.primario}
        />
      </View>
    );
  }

  if (!autorizado) {
    return <Redirect href="/(auth)/estado-solicitud" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: c.primario,
        tabBarInactiveTintColor: c.textoSec,

        tabBarStyle: {
            backgroundColor: c.barra,
            borderTopColor: c.borde,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: 60 + Math.max(insets.bottom, 10),
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 10),
        },

        tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
        },

        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Inicio",

          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={
                typeof color === "string"
                  ? color
                  : focused
                    ? c.primario
                    : c.textoSec
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="solicitudes"
        options={{
          title: "Solicitudes",

          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused
                  ? "file-tray-full"
                  : "file-tray-full-outline"
              }
              size={size}
              color={
                typeof color === "string"
                  ? color
                  : focused
                    ? c.primario
                    : c.textoSec
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ganancias"
        options={{
          title: "Ganancias",

          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={size}
              color={
                typeof color === "string"
                  ? color
                  : focused
                    ? c.primario
                    : c.textoSec
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cuenta"
        options={{
          title: "Cuenta",

          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={
                typeof color === "string"
                  ? color
                  : focused
                    ? c.primario
                    : c.textoSec
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="viaje-activo"
        options={{
          // En Expo Router 58, `href: null` oculta la pestaña Y redirige a Inicio al navegar a ella.
          // Con tabBarButton nulo solo se oculta el botón y la pantalla sigue siendo accesible.
          tabBarButton: () => null,
          // Quita también el hueco que deja el botón, para que los 4 íconos queden centrados como antes
          tabBarItemStyle: { display: "none" },
          headerShown: false,
          tabBarStyle: {
            display: "none",
          },
        }}
      />
    </Tabs>
  );
}
