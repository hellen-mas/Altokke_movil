
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export default function PasajeroTabsLayout() {
  const { colores } = useAltokkeTheme();

  return (
    <Tabs
      initialRouteName="mapa"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.exitoTexto,
        tabBarInactiveTintColor: colores.secundario,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          backgroundColor: colores.superficie,
          borderTopColor: colores.linea,
          borderTopWidth: 1,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="actividad"
        options={{
          title: "Actividad",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ayuda"
        options={{
          title: "Ayuda",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused
                  ? "help-circle"
                  : "help-circle-outline"
              }
              color={color}
              size={size}
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
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
