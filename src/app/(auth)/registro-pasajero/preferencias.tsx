import {
  BarraNavegacionSuperior,
  BotonPrincipal,
  ContenedorPantalla,
  EncabezadoPagina,
  IndicadorPasos,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { supabase } from "@/lib/supabase";
import { paletaColores } from "@/paletaColores";
import { subirFotoAvatar } from "@/utils/avatar";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

interface OpcionPreferenciaProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  value: boolean;
  alCambiar: (valor: boolean) => void;
}

function OpcionPreferencia({
  icono,
  titulo,
  descripcion,
  value,
  alCambiar,
}: OpcionPreferenciaProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.opcionCard,
        value && styles.opcionCardActiva,
        pressed && { opacity: 0.8 },
      ]}
      onPress={() => alCambiar(!value)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View style={[styles.iconContainer, value && styles.iconContainerActivo]}>
        <Ionicons
          name={icono}
          size={22}
          color={value ? paletaColores.textoOscuro : paletaColores.textoSecundario}
        />
      </View>
      <View style={styles.opcionTextos}>
        <Text style={styles.opcionTitulo}>{titulo}</Text>
        <Text style={styles.opcionDescripcion}>{descripcion}</Text>
      </View>
      <Ionicons
        name={value ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={value ? paletaColores.boton : paletaColores.borde}
      />
    </Pressable>
  );
}

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
      "1. Mayoría de edad: Declaras bajo juramento ser mayor de 18 años y contar con plena capacidad para solicitar y pagar servicios de transporte.\n2. Uso responsable: Queda estrictamente prohibido realizar pedidos falsos, bromas o cancelaciones indebidas a los mototaxistas.\n3. Cuentas y Seguridad: Eres responsable de la veracidad de tus datos y del resguardo de tus credenciales.\n4. Sanciones: El mal uso del servicio conllevará el bloqueo permanente de la cuenta.",
      [{ text: "Entendido", style: "default" }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Política de Privacidad",
      "Protegemos tu información:\n\n1. Recopilación: Solo recolectamos los datos necesarios (correo, nombre, viajes) para la prestación del servicio.\n2. Seguridad: Tus credenciales y datos viajan cifrados bajo estándares de alta seguridad.\n3. Derechos: Tienes control total sobre tu cuenta y puedes gestionar tus datos en cualquier momento.",
      [{ text: "Entendido", style: "default" }]
    );
  };

  const opciones: OpcionPreferenciaProps[] = [
    {
      icono: "notifications-outline",
      titulo: "Notificaciones del viaje",
      descripcion: "Avisos sobre el estado del viaje, llegada y mensajes del conductor.",
      value: notificaciones,
      alCambiar: setNotificaciones,
    },
    {
      icono: "location-outline",
      titulo: "Ubicación en tiempo real",
      descripcion: "Permite seguir tu trayecto durante el viaje para mayor seguridad.",
      value: ubicacion,
      alCambiar: setUbicacion,
    },
    {
      icono: "gift-outline",
      titulo: "Novedades y promociones",
      descripcion: "Beneficios exclusivos, descuentos y novedades para ti.",
      value: promociones,
      alCambiar: setPromociones,
    },
  ];

  const handleCrearCuenta = async () => {
    if (loading) return;
    if (!terminos) {
      Alert.alert(
        "Acción requerida",
        "Debes aceptar los términos y condiciones y la política de privacidad para continuar."
      );
      return;
    }

    if (
      !datosPersonales.nombres ||
      !datosPersonales.apellidos ||
      !datosPersonales.telefono ||
      !datosPersonales.dni ||
      !datosPersonales.fechaNacimiento
    ) {
      Alert.alert(
        "Datos incompletos",
        "Faltan datos obligatorios. Por favor regresa a los pasos anteriores y completa tu información."
      );
      return;
    }

    setLoading(true);

    // Si el usuario ingresó correo y contraseña, ejecuto el registro con signUp
    if (datosPersonales.correo && datosPersonales.contrasena) {
      // Cierro cualquier sesión previa residual para que el registro sea limpio
      await supabase.auth.signOut();

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: datosPersonales.correo.trim().toLowerCase(),
        password: datosPersonales.contrasena,
        options: {
          data: {
            nombre: datosPersonales.nombres,
            apellidos: datosPersonales.apellidos,
            telefono: datosPersonales.telefono,
            dni: datosPersonales.dni,
            fecha_nacimiento: datosPersonales.fechaNacimiento,
            notificaciones,
            ubicacion,
            promociones,
            rol: "pasajero",
          },
        },
      });

      setLoading(false);

      if (error) {
        console.log("Error en signUp de Supabase:", error.message);
        Alert.alert(
          "No se pudo crear la cuenta",
          traducirErrorAuth(
            error,
            "No fue posible registrar tu cuenta. Por favor verifica tus datos e inténtalo nuevamente."
          )
        );
        return;
      }

      console.log("Usuario registrado con éxito en Supabase:", signUpData.user?.email);

      // Si el usuario seleccionó una foto de perfil en el registro, la subimos a la Edge Function
      if (signUpData.user?.id && datosPersonales.fotoPerfil) {
        try {
          const resFoto = await subirFotoAvatar(
            datosPersonales.fotoPerfil,
            signUpData.user.id,
            datosPersonales.fotoBase64 || undefined
          );
          console.log("Resultado subida foto registro:", resFoto);
        } catch (fotoErr) {
          console.warn("Aviso al subir foto inicial:", fotoErr);
        }
      }

      Alert.alert(
        "¡Cuenta creada exitosamente!",
        "Tu cuenta ha sido creada con éxito. Ya puedes iniciar sesión con tus credenciales."
      );
      clearRegistro();
      router.replace("/login");
    } else {
      // Si no ingresó contraseña es porque inició sesión con Google OAuth
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const { error } = await supabase.auth.updateUser({
          data: {
            nombre: datosPersonales.nombres,
            apellidos: datosPersonales.apellidos,
            telefono: datosPersonales.telefono,
            dni: datosPersonales.dni,
            fecha_nacimiento: datosPersonales.fechaNacimiento,
            notificaciones,
            ubicacion,
            promociones,
            rol: "pasajero",
          },
        });

        if (sessionData.session.user.id && datosPersonales.fotoPerfil) {
          try {
            await subirFotoAvatar(
              datosPersonales.fotoPerfil,
              sessionData.session.user.id,
              datosPersonales.fotoBase64 || undefined
            );
          } catch (fotoErr) {
            console.warn("Aviso al subir foto inicial OAuth:", fotoErr);
          }
        }

        setLoading(false);

        if (error) {
          Alert.alert(
            "Error de registro",
            traducirErrorAuth(error, "No se pudo actualizar la información de tu cuenta.")
          );
        } else {
          login("pasajero");
          clearRegistro();
          router.replace("/mapa");
        }
      } else {
        setLoading(false);
        Alert.alert("Datos incompletos", "Por favor ingresa tu correo y contraseña para continuar.");
      }
    }
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <BarraNavegacionSuperior titulo="Registro" />

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
          <OpcionPreferencia key={i} {...opcion} />
        ))}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIconWrapper}>
          <Ionicons name="shield-checkmark" size={22} color={paletaColores.boton} />
        </View>
        <View style={styles.infoTextos}>
          <Text style={styles.infoTitulo}>Tu privacidad está protegida</Text>
          <Text style={styles.infoDescripcion}>
            Cuidamos tus datos conforme a ley y los usamos únicamente para brindarte un servicio seguro.
          </Text>
        </View>
      </View>

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
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
  opcionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    borderRadius: 16,
    backgroundColor: paletaColores.input,
  },
  opcionCardActiva: {
    borderColor: paletaColores.boton,
    backgroundColor: "rgba(46, 206, 121, 0.08)",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconContainerActivo: {
    backgroundColor: paletaColores.boton,
  },
  opcionTextos: {
    flex: 1,
    paddingRight: 8,
  },
  opcionTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  opcionDescripcion: {
    fontSize: 14,
    color: "#C2D4CB",
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#13231B",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(46, 206, 121, 0.2)",
    marginBottom: 20,
    gap: 14,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(46, 206, 121, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextos: {
    flex: 1,
  },
  infoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  infoDescripcion: {
    fontSize: 13.5,
    color: "#A8BCB2",
    lineHeight: 19,
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
