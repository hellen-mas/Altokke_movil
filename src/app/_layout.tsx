import { useAuthStore } from "@/features/autenticacion/store/authStore";
import { AnimatedSplashOverlay } from "@/shared/components/animated/animated-icon";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { esOscuro, colores } = useAltokkeTheme();
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  useEffect(() => {
    return useAuthStore.getState().init();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={esOscuro ? DarkTheme : DefaultTheme}>
        <StatusBar 
           barStyle={esOscuro ? "light-content" : "dark-content"}
        />
        <AnimatedSplashOverlay />
        <Slot />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

