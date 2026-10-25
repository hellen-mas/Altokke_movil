import { AnimatedSplashOverlay } from "@/shared/components/animated/animated-icon";
import { AuthProvider } from "@/features/autenticacion/context/AuthContext";
import { paletaColores } from "@/shared/theme/paletaColores";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, useColorScheme } from "react-native";
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
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor={paletaColores.fondo} />
          <AnimatedSplashOverlay />
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

