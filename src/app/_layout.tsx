import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/context/AuthContext";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

// Evita que la pantalla de carga inicial desaparezca antes que la app esté completamente lista
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  // Detecta el tema del celular
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* Cualquier pantalla pueda saber si el usuario inició sesión */}
      <AuthProvider>
        {/*Dibuja la animacion de la pantalla de carga mientras cargan los datos*/}
        <AnimatedSplashOverlay />
        <Slot />
      </AuthProvider>
    </ThemeProvider>
  );
}
