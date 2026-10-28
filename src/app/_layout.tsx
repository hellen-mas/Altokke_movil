import { AnimatedSplashOverlay } from "@/shared/components/animated/animated-icon";
import { AuthProvider } from "@/features/autenticacion/context/AuthContext";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

SplashScreen.preventAutoHideAsync();

import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";

export default function TabLayout() {
  const { esOscuro, colores } = useAltokkeTheme();
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={esOscuro ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <StatusBar 
            barStyle={esOscuro ? "light-content" : "dark-content"}
            backgroundColor={colores.fondo}
          />
          <AnimatedSplashOverlay />
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

