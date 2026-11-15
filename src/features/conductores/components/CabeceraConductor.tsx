import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNode } from "react";
import {
  useTemaConductor,
  type ColoresConductor,
} from "@/features/conductores/theme/temaConductor";

interface CabeceraConductorProps {
  titulo: string;
  subtitulo?: string;
  mostrarAtras?: boolean;
  mostrarMarca?: boolean;
  compacta?: boolean;
  children?: ReactNode;
}

export function CabeceraConductor({
  titulo,
  subtitulo,
  mostrarAtras = false,
  mostrarMarca = false,
  compacta = false,
  children,
}: CabeceraConductorProps) {
  const { c, estilos } = useTemaConductor(crearEstilos);

  return (
    <>
      <StatusBar style="light" />

      <LinearGradient
        colors={[c.headerA, c.headerB, c.headerC]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.header, compacta && estilos.headerCompacto]}
      >
        {/* Firma visual: aro y ruta punteada de mototaxi */}
        <View style={estilos.aro} />
        <View style={estilos.ruta}>
          <View style={estilos.punto} />
          <View style={estilos.punto} />
          <View style={estilos.punto} />
          <View style={[estilos.punto, estilos.puntoMeta]} />
        </View>

        <SafeAreaView edges={["top"]} style={estilos.safeArea}>
          {mostrarMarca && (
            <View style={estilos.marcaFila}>
              <View style={estilos.marca}>
                <Image
                  source={require("@/assets/images/logo-altokke-v2.png")}
                  style={estilos.logo}
                  resizeMode="contain"
                />
                <Text style={estilos.logoTexto}>Altokke</Text>
              </View>

              <View style={estilos.avatar}>
                <Ionicons name="person" size={17} color={c.sobreHeader} />
                <View style={estilos.online} />
              </View>
            </View>
          )}

          <View style={estilos.fila}>
            {mostrarAtras && (
              <Pressable
                style={estilos.botonAtras}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <Ionicons name="arrow-back" size={20} color={c.sobreHeader} />
              </Pressable>
            )}

            <View style={estilos.textos}>
              <Text
                style={[estilos.titulo, compacta && estilos.tituloCompacto]}
                numberOfLines={1}
              >
                {titulo}
              </Text>
              {subtitulo ? (
                <Text style={estilos.subtitulo} numberOfLines={2}>
                  {subtitulo}
                </Text>
              ) : null}
            </View>
          </View>

          {children ? <View style={estilos.extra}>{children}</View> : null}
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const crearEstilos = (c: ColoresConductor) =>
  StyleSheet.create({
    header: {
      width: "100%",
      paddingHorizontal: 20,
      paddingBottom: 22,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 8,
      overflow: "hidden",
    },
    headerCompacto: { paddingBottom: 18 },
    safeArea: { width: "100%" },

    aro: {
      position: "absolute",
      width: 210,
      height: 210,
      borderRadius: 105,
      right: -70,
      top: -80,
      borderWidth: 26,
      borderColor: "rgba(255,255,255,0.045)",
    },
    ruta: {
      position: "absolute",
      right: 22,
      bottom: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    punto: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.28)",
    },
    puntoMeta: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primario,
    },

    marcaFila: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      marginBottom: 14,
    },
    marca: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { width: 30, height: 30 },
    logoTexto: {
      color: c.sobreHeader,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    online: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#35E982",
      borderWidth: 2,
      borderColor: c.headerB,
    },

    fila: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 },
    botonAtras: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    textos: { flex: 1 },
    titulo: {
      color: c.sobreHeader,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    tituloCompacto: { fontSize: 24 },
    subtitulo: {
      marginTop: 3,
      color: "rgba(255,255,255,0.72)",
      fontSize: 14,
      lineHeight: 18,
    },
    extra: { marginTop: 16 },
  });
