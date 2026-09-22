import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { paletaColores } from "@/paletaColores";

export default function ConductorLayout() {
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
    </Tabs>
  );
}