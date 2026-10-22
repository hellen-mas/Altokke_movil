import {
  AvisoInformativo,
  BotonPrincipal,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
  TarjetaOpcion,
} from "@/shared/components/ui";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { useRegistroPasajero } from "@/features/pasajeros/context/RegistroPasajeroContext";
import { supabase } from "@/shared/api/supabase";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { authService } from "@/features/autenticacion/services/authService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { 
  Alert, 
  Pressable, 
  StyleSheet, 
  Text, 
  View 
} from "react-native";

export default function PasajeroPreferenciasScreen() {
  const { colores } = useAltokkeTheme();
  const [notificaciones, setNotificaciones] = useState(true);
  const [ubicacion, setUbicacion] = useState(true);
  const [promociones, setPromociones] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [loading, setLoading] = useState(false);

  const enviando = useRef(false);
  
  const { datosPersonales, clearRegistro } = useRegistroPasajero();
  
  const { login } = useAuth();

  const handleTerms = () => {
    Alert.alert(
      "Términos y condiciones",
      "1. Mayoría de edad (+18 años).\n" +
        "2. Uso responsable del servicio de mototaxi.\n" +
        "3. Veracidad de los datos proporcionados.\n" +
        "4. El uso indebido puede ocasionar la suspensión de la cuenta.",
      [{ text: "Entendido" }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Política de privacidad",
      "Altokke utiliza la información proporcionada " +
        "para gestionar tu cuenta y prestar el servicio " +
        "de transporte. Consulta la política completa " +
        "para conocer el tratamiento de tus datos.",
      [{ text: "Entendido" }]
    );
  };

  const opciones = [
    {
      icono: "notifications-outline" as const,
      titulo: "Notificaciones",
      descripcion: "Avisos sobre el estado del viaje y más",
      activa: notificaciones,
      alCambiar: setNotificaciones,
    },
    {
      icono: "location-outline" as const,
      titulo: "Ubicación en tiempo real",
      descripcion: "Seguridad durante el viaje",
      activa: ubicacion,
      alCambiar: setUbicacion,
    },
    {
      icono: "gift-outline" as const,
      titulo: "Novedades y promociones",
      descripcion: "Beneficios, descuentos y novedades",
      activa: promociones,
      alCambiar: setPromociones,
    },
  ];

  const handleCrearCuenta = async () => {
    if (enviando.current || !terminos) return;

    const {
      nombres, 
      apellidos, 
      telefono, 
      dni, 
      fechaNacimiento, 
      correo, 
      contrasena, 
      fotoPerfil, 
      fotoBase64 
    } = datosPersonales;

    if (!nombres || !apellidos || !telefono || !dni || !fechaNacimiento || !fotoPerfil) {
      return Alert.alert("Datos incompletos", "Faltan datos obligatorios (incluyendo tu fotografía de perfil). Regresa a los pasos anteriores para completarlos.");
    }

    enviando.current= true;
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

        clearRegistro();

        Alert.alert(
          "¡Cuenta creada!",
          "Tu registro se completó correctamente. Ya puedes iniciar sesión.",
          [
            {
              text: "Ir a iniciar sesión",
              onPress: () => router.replace("/login"),
            },
          ],
          { cancelable: false }
        );

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
      enviando.current = false;
      setLoading(false);
    }
  };

  return (
      <ContenedorPantalla 
        estilo={[
          styles.pantalla,
          { backgroundColor: colores.fondo },
        ]}
        estiloContenedorContenido={[
          styles.scrollContent,
          { backgroundColor: colores.fondo },
        ]}
      >
        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Preferencias\n"}
            tituloDestacado="y seguridad"
            descripcion="Personaliza tu experiencia."
            variante="claro"
          />
        </View>

        <IndicadorPasos pasoActual={3} totalPasos={3} variante="claro" />

        <View style={styles.seccionPreferencias}>
          <View style={styles.opcionesContainer}>
            {opciones.map((opcion) => (
              <TarjetaOpcion key={opcion.titulo} {...opcion} variante="claro" />
            ))}
          </View>
        </View>

        <AvisoInformativo
          texto="Tus datos están protegidos"
          icono="shield-checkmark-outline"
          variante="claro"
          style={styles.infoCard}
        />

        <View 
          style={[
            styles.terminosContainer,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <Pressable
            style={styles.filaTerminos}
            onPress={() => setTerminos((valor) => !valor)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: terminos }}
            accessibilityLabel="He leído y acepto los términos y la política de privacidad"
          >
            <Ionicons
              name={terminos ? "checkbox" : "square-outline"}
              size={26}
              color={
                terminos
                  ? colores.exitoTexto
                  : colores.secundario
              }
            />
            <Text style={[styles.checkboxText, { color: colores.texto },]}>
              He leído y acepto los términos y condiciones
              y la política de privacidad.
            </Text>
          </Pressable>

          <View style={styles.enlacesContainer}>
            <Pressable
              onPress={handleTerms}
              accessibilityRole="link"
              hitSlop={6}
            >
              <Text style={[styles.linkText, { color: colores.exitoTexto },]}>
                Leer términos y condiciones
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePrivacy}
              accessibilityRole="link"
              hitSlop={6}
            >
              <Text style={[styles.linkText, { color: colores.exitoTexto },]}>
                Leer política de privacidad
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <BotonPrincipal
            titulo={loading ? "Creando cuenta..." : "Crear cuenta"}
            mostrarIcono={!loading}
            icono="arrow-forward"
            cargando={loading}
            disabled={!terminos || loading}
            onPress={handleCrearCuenta}
            estilo={styles.botonFinal}
          />
        </View>
      </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
   pantalla: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  seccionPreferencias: {
    marginTop: 14,
    gap: 10,
  },
  encabezadoSeccion: {
    gap: 5,
  },
  tituloSeccion: {
    fontSize: 17,
    fontWeight: "700",
  },
  descripcionSeccion: {
    fontSize: 13,
    lineHeight: 19,
  },
  opcionesContainer: {
    gap: 10,
  },
  infoCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  terminosContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  filaTerminos: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: 44,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  enlacesContainer: {
    marginLeft: 38,
    gap: 10,
    alignItems: "flex-start",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  bottomContainer: {
    marginTop: 20,
    gap: 8,
  },
  botonFinal: {
    minHeight: 58,
  },
  mensajeFinal: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
