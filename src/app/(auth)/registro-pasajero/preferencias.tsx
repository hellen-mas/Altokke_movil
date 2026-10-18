import {
  AvisoInformativo,
  BotonPrincipal,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
  TarjetaOpcion,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { supabase } from "@/lib/supabase";
import { paletaColores } from "@/paletaColores";
import { authService } from "@/services/authService";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function PasajeroPreferenciasScreen() {
  const [notificaciones, setNotificaciones] = useState(true);
  const [ubicacion, setUbicacion] = useState(true);
  const [promociones, setPromociones] = useState(false);
  const [terminos, setTerminos] = useState(false);

  const { datosPersonales, clearRegistro } = useRegistroPasajero();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleTerms = () => {
    Alert.alert(
      "Términos y Condiciones",
      "1. Mayoría de edad (+18 años).\n2. Uso responsable del servicio de mototaxi.\n3. Veracidad de tus datos.\n4. El mal uso conlleva suspensión de la cuenta."
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Política de Privacidad",
      "Cuidamos tu información. Solo recopilamos los datos esenciales para tus viajes bajo estrictos estándares de seguridad cifrada."
    );
  };

  const opciones = [
    {
      icono: "notifications-outline" as const,
      titulo: "Notificaciones del viaje",
      descripcion: "Avisos sobre el estado del viaje, llegada y mensajes del conductor.",
      activa: notificaciones,
      alCambiar: setNotificaciones,
    },
    {
      icono: "location-outline" as const,
      titulo: "Ubicación en tiempo real",
      descripcion: "Permite seguir tu trayecto durante el viaje para mayor seguridad.",
      activa: ubicacion,
      alCambiar: setUbicacion,
    },
    {
      icono: "gift-outline" as const,
      titulo: "Novedades y promociones",
      descripcion: "Beneficios exclusivos, descuentos y novedades para ti.",
      activa: promociones,
      alCambiar: setPromociones,
    },
  ];

  const handleCrearCuenta = async () => {
    if (loading) return;
    if (!terminos) {
      return Alert.alert("Acción requerida", "Debes aceptar los términos y condiciones y la política de privacidad.");
    }

    const { nombres, apellidos, telefono, dni, fechaNacimiento, correo, contrasena, fotoPerfil, fotoBase64 } = datosPersonales;
    if (!nombres || !apellidos || !telefono || !dni || !fechaNacimiento) {
      return Alert.alert("Datos incompletos", "Faltan datos obligatorios. Regresa a los pasos anteriores para completarlos.");
    }

    setLoading(true);
    try {
      if (correo && contrasena) {
        await authService.registrarPasajero({
          correo,
          contrasena,
          nombres,
          apellidos,
          telefono,
          dni,
          fechaNacimiento,
          notificaciones,
          ubicacion,
          promociones,
          fotoPerfil,
          fotoBase64,
        });

        Alert.alert("¡Cuenta creada exitosamente!", "Ya puedes iniciar sesión con tus credenciales.");
        clearRegistro();
        router.replace("/login");
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          throw new Error("No hay una sesión activa para completar el registro.");
        }

        await authService.actualizarPerfilOAuth(sessionData.session.user.id, {
          nombres,
          apellidos,
          telefono,
          dni,
          fechaNacimiento,
          notificaciones,
          ubicacion,
          promociones,
          fotoPerfil,
          fotoBase64,
        });

        login("pasajero");
        clearRegistro();
        router.replace("/mapa");
      }
    } catch (error: any) {
      Alert.alert("No se pudo crear la cuenta", traducirErrorAuth(error, "No fue posible registrar tu cuenta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Preferencias\n"}
            tituloDestacado="y seguridad"
            descripcion="Ajusta tu experiencia antes de empezar a viajar."
          />
        </View>

        <IndicadorPasos pasoActual={3} totalPasos={3} />

        <View style={styles.opcionesContainer}>
          {opciones.map((opcion, i) => (
            <TarjetaOpcion key={i} {...opcion} />
          ))}
        </View>

        <AvisoInformativo
          titulo="Tu privacidad está protegida"
          texto="Cuidamos tus datos conforme a ley y los usamos únicamente para brindarte un servicio seguro."
          variante="oscuro"
          style={styles.infoCard}
        />

        <Pressable
          style={styles.checkboxContainer}
          onPress={() => setTerminos(!terminos)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={terminos ? "checkbox" : "square-outline"}
            size={24}
            color={terminos ? paletaColores.boton : paletaColores.textoSecundario}
          />
          <Text style={styles.checkboxText}>
            Acepto los{" "}
            <Text onPress={handleTerms} style={styles.linkText}>
              términos y condiciones
            </Text>{" "}
            y la{" "}
            <Text onPress={handlePrivacy} style={styles.linkText}>
              política de privacidad
            </Text>
            .
          </Text>
        </Pressable>

        <View style={styles.bottomContainer}>
          <BotonPrincipal
            titulo="Crear cuenta"
            cargando={loading}
            disabled={!terminos || loading}
            onPress={handleCrearCuenta}
          />
        </View>
      </ContenedorPantalla>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 8,
  },
  opcionesContainer: {
    gap: 12,
    marginTop: 18,
    marginBottom: 18,
  },
  infoCard: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
    gap: 10,
  },
  checkboxText: {
    flex: 1,
    fontSize: 15,
    color: "#EDF5F0",
    lineHeight: 22,
  },
  linkText: {
    color: paletaColores.boton,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  bottomContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
});
