import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { obtenerEstadoConductor } from "@/features/conductores/services/estadoConductor";

import { paletaColores } from "@/shared/theme/paletaColores";

export default function ConductorLayout() {
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

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
        alignItems: "center"
      }}>
        <ActivityIndicator
          size="large"
          color={paletaColores.verde}
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

        tabBarActiveTintColor: paletaColores.verde,
        tabBarInactiveTintColor: paletaColores.textoSecundarioClaro,

        tabBarStyle: {
            backgroundColor: paletaColores.superficieClara,
            borderTopColor: paletaColores.bordeClaro,
            borderTopWidth: 1,
            height: 70,
            paddingTop: 7,
            paddingBottom: 8,
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
              color={color}
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
              color={color}
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
              color={color}
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
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="viaje-activo"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: {
            display: "none",
          },
        }}
      />
    </Tabs>
  );
}
