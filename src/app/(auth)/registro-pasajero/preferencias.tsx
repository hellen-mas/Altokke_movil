import { PageHeader, PrimaryButton } from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function PasajeroPreferenciasScreen() {
  const [notificaciones, setNotificaciones] = useState(true);
  const [ubicacion, setUbicacion] = useState(true);
  const [promociones, setPromociones] = useState(true);
  const [terminos, setTerminos] = useState(false);

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={paletaColores.texto} />
          </Pressable>
          
          <Text style={styles.headerTitle}>Altokke</Text>
          
          <View style={styles.stepContainer}>
            <Text style={styles.stepText}>Paso 3 de 3</Text>
            <View style={styles.miniStepIndicator}>
              <View style={[styles.miniStep, styles.stepCompleted]} />
              <View style={[styles.miniStep, styles.stepCompleted]} />
              <View style={[styles.miniStep, styles.activeStep]} />
            </View>
          </View>
        </View>

        <View style={styles.pageHeaderContainer}>
          <PageHeader
            title="Preferencias"
            highlightedTitle={"\n" + "y seguridad"}
            description="Ajusta tu experiencia antes de empezar."
          />
        </View>

        <View style={styles.opcionesContainer}>
          <View style={styles.opcionCard}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={paletaColores.texto}
              />
            </View>
            <View style={styles.opcionTextos}>
              <Text style={styles.opcionTitulo}>Permitir notificaciones</Text>
              <Text style={styles.opcionDescripcion}>
                Recibe actualizaciones de tus viajes, alertas y más.
              </Text>
            </View>
            <Switch
              value={notificaciones}
              onValueChange={setNotificaciones}
              trackColor={{ false: paletaColores.borde, true: paletaColores.boton }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.opcionCard}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="location-outline"
                size={24}
                color={paletaColores.texto}
              />
            </View>
            <View style={styles.opcionTextos}>
              <Text style={styles.opcionTitulo}>
                Compartir ubicación durante el viaje
              </Text>
              <Text style={styles.opcionDescripcion}>
                Mejora tu seguridad al compartir tu ubicación en tiempo real.
              </Text>
            </View>
            <Switch
              value={ubicacion}
              onValueChange={setUbicacion}
              trackColor={{ false: paletaColores.borde, true: paletaColores.boton }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.opcionCard}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="gift-outline"
                size={24}
                color={paletaColores.texto}
              />
            </View>
            <View style={styles.opcionTextos}>
              <Text style={styles.opcionTitulo}>Promociones y novedades</Text>
              <Text style={styles.opcionDescripcion}>
                Recibe ofertas, descuentos y noticias de Altokke.
              </Text>
            </View>
            <Switch
              value={promociones}
              onValueChange={setPromociones}
              trackColor={{ false: paletaColores.borde, true: paletaColores.boton }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoIconContainer}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={paletaColores.fondo}
            />
          </View>
          <View style={styles.infoTextos}>
            <Text style={styles.infoTitulo}>Tu información será protegida</Text>
            <Text style={styles.infoDescripcion}>
              Cuidamos tus datos y los usamos solo para brindarte un mejor servicio.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.checkboxContainer}
          onPress={() => setTerminos(!terminos)}
        >
          <Ionicons
            name={terminos ? "checkbox" : "square-outline"}
            size={24}
            color={terminos ? paletaColores.boton : paletaColores.textoSecundario}
          />
          <Text style={styles.checkboxText}>
            Acepto los <Text style={styles.linkText}>términos y condiciones</Text> y la <Text style={styles.linkText}>política de privacidad</Text>.
          </Text>
        </Pressable>

        <PrimaryButton
          title="Crear cuenta"
          onPress={() => {
            if (!terminos) {
              import("react-native").then(({ Alert }) => {
                Alert.alert("Términos incompletos", "Debes aceptar los términos y condiciones para crear tu cuenta.");
              });
              return;
            }
            router.push("/login" as any);
          }}
          style={styles.botonCrear}
        />

        <View style={styles.separadorContainer}>
          <View style={styles.linea} />
          <Text style={styles.textoSeparador}>Atrás</Text>
          <View style={styles.linea} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: paletaColores.texto,
    marginRight: -40, 
  },
  stepContainer: {
    alignItems: "flex-end",
    width: 80,
  },
  stepText: {
    fontSize: 13,
    color: paletaColores.texto,
    marginBottom: 6,
    fontWeight: "500",
  },
  miniStepIndicator: {
    flexDirection: "row",
    gap: 4,
  },
  miniStep: {
    height: 4,
    width: 20,
    borderRadius: 2,
  },
  stepCompleted: {
    backgroundColor: paletaColores.boton,
    opacity: 0.3,
  },
  activeStep: {
    backgroundColor: paletaColores.boton,
  },
  pageHeaderContainer: {
    marginBottom: 24,
  },
  opcionesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  opcionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 16,
    backgroundColor: paletaColores.fondo,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: paletaColores.input,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  opcionTextos: {
    flex: 1,
    paddingRight: 12,
  },
  opcionTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.texto,
    marginBottom: 4,
  },
  opcionDescripcion: {
    fontSize: 13,
    color: paletaColores.textoSecundario,
    lineHeight: 18,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#003623",
    borderRadius: 16,
    marginBottom: 24,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: paletaColores.boton,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoTextos: {
    flex: 1,
  },
  infoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.texto,
    marginBottom: 4,
  },
  infoDescripcion: {
    fontSize: 13,
    color: paletaColores.textoSecundario,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: paletaColores.texto,
    lineHeight: 20,
  },
  linkText: {
    color: paletaColores.verde,
    textDecorationLine: "underline",
  },
  botonCrear: {
    marginBottom: 24,
  },
  separadorContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: paletaColores.borde,
  },
  textoSeparador: {
    fontSize: 15,
    color: paletaColores.verde,
    fontWeight: "600",
    marginHorizontal: 16,
  },
});
