import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/shared/api/supabase";
import { obtenerEstadoConductor } from "@/features/conductores/services/conductorService";
import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { useAlertaConductor } from "@/features/notificaciones/hooks/useAlertaConductor";

export default function ConductorLayout() {
  const { c } = useColoresConductor();
  const insets = useSafeAreaInsets();
  const [verificando, setVerificando] = useState(true);
  const [esConductor, setEsConductor] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [errorRed, setErrorRed] = useState<string | null>(null);

  useAlertaConductor({
    habilitado: autorizado && !verificando,
    radioKm: 3,
  });

  const verificarAcceso = useCallback(async () => {
    setErrorRed(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setEsConductor(false);
        setAutorizado(false);
        return;
      }

      // Comprobar rol en metadata o en la base de datos
      const rol = user.user_metadata?.rol;
      if (rol !== "conductor") {
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id", user.id)
          .maybeSingle();

        if (perfil?.rol !== "conductor") {
          setEsConductor(false);
          setAutorizado(false);
          return;
        }
      }

      setEsConductor(true);

      const estado = await obtenerEstadoConductor(user.id);
      setAutorizado(estado === "aprobado");
    } catch (error) {
      console.warn("Aviso verificando rol/estado de conductor:", error);
      setErrorRed("No se pudo conectar con el servidor para verificar tu cuenta. Comprueba tu red.");
    } finally {
      setVerificando(false);
    }
  }, []);

  // Se verifica al iniciar o al cambiar la sesión (sin reiniciar verificando en cada tab switch)
  useEffect(() => {
    // onAuthStateChange dispara INITIAL_SESSION inmediatamente al suscribirse,
    // cubriendo la verificación inicial sin llamar setState sincronamente en el effect body
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "USER_UPDATED" ||
        event === "SIGNED_OUT"
      ) {
        void verificarAcceso();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- verificarAcceso es estable (useCallback con deps=[])
  }, []);

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

  if (errorRed) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: c.fondo,
        padding: 24,
      }}>
        <Ionicons name="cloud-offline-outline" size={54} color={c.primario} />
        <Text style={{
          fontSize: 16,
          color: c.texto,
          textAlign: "center",
          marginTop: 16,
          marginBottom: 20,
          lineHeight: 22,
        }}>
          {errorRed}
        </Text>
        <Pressable
          onPress={() => {
            setVerificando(true);
            void verificarAcceso();
          }}
          style={{
            backgroundColor: c.primario,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          accessibilityRole="button"
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Reintentar conexión</Text>
        </Pressable>
      </View>
    );
  }

  if (!esConductor) {
    // Si no es conductor (ej. pasajero intentando entrar), redirige a su mapa
    return <Redirect href="/mapa" />;
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
