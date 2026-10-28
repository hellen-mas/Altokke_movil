
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { TituloAltokke } from "@/shared/components/ui/TituloAltokke";

export default function Accesibilidad() {
  const { colores } = useAltokkeTheme();
  const { perfil, cargando, guardarPreferencias } =
    usePerfilPasajero();

  const [guardando, setGuardando] = useState(false);

  const modoSimple = perfil?.preferencias?.modoSimple === true;

  const cambiarModoSimple = async (nuevoValor: boolean) => {
    if (guardando) return;

    try {
      setGuardando(true);

      await guardarPreferencias({
        modoSimple: nuevoValor,
      });
    } catch {
      Alert.alert(
        "No se pudo guardar",
        "Comprueba tu conexión e inténtalo nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View
      style={[
        styles.pantalla,
        { backgroundColor: colores.fondo },
      ]}
    >
      <EncabezadoPantalla titulo="Accesibilidad" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <View
          style={[
            styles.presentacion,
            { backgroundColor: colores.exitoFondo },
          ]}
        >
          <Ionicons
            name="accessibility-outline"
            size={30}
            color={colores.exitoTexto}
          />

          <TituloAltokke
            texto="Para todos"
            style={styles.titulo}
          />

            <Text
            style={[
                styles.descripcion,
                { color: colores.secundario },
            ]}
            >
                Altokke busca ofrecer una experiencia más sencilla
                y accesible, especialmente para adultos mayores
                y personas que prefieren una navegación más clara,
                con textos grandes y controles fáciles de utilizar.
            </Text>
        </View>

        <Text
          style={[
            styles.etiqueta,
            { color: colores.secundario },
          ]}
        >
          EXPERIENCIA DE USO
        </Text>

        <View
          style={[
            styles.tarjeta,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <View style={styles.fila}>
            <View
              style={[
                styles.icono,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={23}
                color={colores.exitoTexto}
              />
            </View>

            <View style={styles.textos}>
              <Text
                style={[
                  styles.nombre,
                  { color: colores.texto },
                ]}
              >
                Modo simple
              </Text>

              <Text
                style={[
                    styles.detalle,
                    { color: colores.secundario },
                ]}
               >
                    Diseñado especialmente para adultos mayores.
                    Amplía los textos y controles compatibles
                    para facilitar la solicitud de viajes.
                </Text>
            </View>

            {guardando ? (
              <ActivityIndicator
                color={colores.exitoTexto}
              />
            ) : (
              <Switch
                value={modoSimple}
                onValueChange={cambiarModoSimple}
                disabled={cargando || !perfil}
                trackColor={{
                  false: colores.linea,
                  true: colores.primario,
                }}
                thumbColor={
                  modoSimple
                    ? colores.textoBoton
                    : colores.superficie
                }
                accessibilityLabel="Activar modo simple"
              />
            )}
          </View>
        </View>

        <View style={styles.seccionInformativa}>
            <Text
                style={[
                styles.subtitulo,
                { color: colores.texto },
                ]}
            >
                Pensado para adultos mayores
            </Text>

            <Text
                style={[
                styles.descripcionInformativa,
                { color: colores.secundario },
                ]}
            >
                Sabemos que utilizar una aplicación de transporte
                puede resultar complicado para algunas personas.
                Por eso, el modo simple busca facilitar las tareas
                más importantes, como seleccionar un destino
                y solicitar un mototaxi, mediante elementos
                visuales más grandes y fáciles de reconocer.
            </Text>

            <View
                style={[
                styles.beneficios,
                {
                    backgroundColor: colores.superficie,
                    borderColor: colores.linea,
                },
                ]}
            >
                {[
                {
                    icono: "text-outline" as const,
                    texto: "Textos más grandes para facilitar la lectura.",
                },
                {
                    icono: "hand-left-outline" as const,
                    texto: "Controles más amplios y fáciles de tocar.",
                },
                {
                    icono: "navigate-outline" as const,
                    texto: "Una experiencia de navegación más cómoda.",
                },
                ].map((beneficio, index) => (
                <View key={index} style={styles.filaBeneficio}>
                    <Ionicons
                    name={beneficio.icono}
                    size={20}
                    color={colores.exitoTexto}
                    />

                    <Text
                    style={[
                        styles.textoBeneficio,
                        { color: colores.texto },
                    ]}
                    >
                    {beneficio.texto}
                    </Text>
                </View>
                ))}
            </View>
        </View>

        <Text
          style={[
            styles.etiqueta,
            { color: colores.secundario },
          ]}
        >
          VISTA PREVIA
        </Text>

        <View
          style={[
            styles.tarjeta,
            styles.vistaPrevia,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <Text
            style={[
              styles.textoPrevia,
              {
                color: colores.texto,
                fontSize: modoSimple ? 24 : 19,
              },
            ]}
          >
            ¿A dónde vamos?
          </Text>

          <View
            style={[
              styles.campoPrevia,
              {
                backgroundColor: colores.campo,
                minHeight: modoSimple ? 64 : 48,
              },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={modoSimple ? 24 : 20}
              color={colores.secundario}
            />

            <Text
              style={{
                color: colores.textoCampo,
                fontSize: modoSimple ? 18 : 14,
              }}
            >
              Seleccionar destino
            </Text>
          </View>

          <View
            style={[
              styles.botonPrevia,
              {
                backgroundColor: colores.primario,
                minHeight: modoSimple ? 60 : 48,
              },
            ]}
          >
            <Text
              style={{
                color: colores.textoBoton,
                fontSize: modoSimple ? 18 : 14,
                fontWeight: "700",
              }}
            >
              Solicitar mototaxi
            </Text>
          </View>

          <Text
            style={[
              styles.nota,
              { color: colores.secundario },
            ]}
          >
            Vista ilustrativa. El modo simple se
            aplicará progresivamente a las pantallas
            principales del pasajero.
          </Text>
        </View>

        <View style={styles.informacion}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colores.secundario}
          />

          <Text
            style={[
              styles.informacionTexto,
              { color: colores.secundario },
            ]}
          >
            Esta preferencia no modifica los datos de
            tus viajes ni tu cuenta. Puedes desactivarla
            cuando quieras.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  presentacion: {
    borderRadius: 20,
    padding: 20,
    gap: 11,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 23,
    lineHeight: 30,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 20,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 16,
    minHeight: 85,
  },
  icono: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 5,
  },
  nombre: {
    fontSize: 15,
    fontWeight: "700",
  },
  detalle: {
    fontSize: 12,
    lineHeight: 18,
  },
  vistaPrevia: {
    padding: 18,
    gap: 15,
  },
  textoPrevia: {
    fontWeight: "700",
  },
  campoPrevia: {
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botonPrevia: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  nota: {
    fontSize: 11,
    lineHeight: 17,
  },
  informacion: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
  },
  informacionTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },
  seccionInformativa: {
    gap: 12,
    marginTop: 8,
    },

    subtitulo: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 25,
    },

    descripcionInformativa: {
    fontSize: 14,
    lineHeight: 22,
    },

    beneficios: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 18,
    },

    filaBeneficio: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    },

    textoBeneficio: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    },
});
