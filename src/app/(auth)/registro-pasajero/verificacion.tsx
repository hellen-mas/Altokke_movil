import {
  BarraNavegacionSuperior,
  BotonPrincipal,
  CampoTexto,
  EncabezadoPagina,
  IndicadorPasos,
} from "@/components/ui";
import { useRegistroPasajero } from "@/context/RegistroPasajeroContext";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PasajeroVerificacionScreen() {
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState("Efectivo");
  const [nombreEmergencia, setNombreEmergencia] = useState("");
  const [telefonoEmergencia, setTelefonoEmergencia] = useState("");
  // Se lee los datos que el usuario ingresó en la pantalla anterior para mostrarlos aquí
  const { datosPersonales } = useRegistroPasajero();

  return (
    <SafeAreaView style={styles.safeArea}>
      <BarraNavegacionSuperior titulo="Altokke" />

      {/* Evita que el teclado tape al campo */}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" //Permite presionar el boton con el teclado en uso
        enableOnAndroid={true} //Permite subir y bajar, no solo en los iPhones
        extraScrollHeight={20}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>Paso 2 de 3</Text>
          <IndicadorPasos pasoActual={2} totalPasos={3} />
        </View>

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo="Verifica tu "
            tituloDestacado="información"
            descripcion="Revisa tus datos y configura tus preferencias de viaje."
          />
        </View>

        <View style={styles.card}>
          <Ionicons
            name="person-circle-outline"
            size={42}
            color={paletaColores.texto}
            style={styles.cardIcon}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Pasajero registrado</Text>
            <Text style={styles.cardValue}>
              {datosPersonales?.nombres} {datosPersonales?.apellidos}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={paletaColores.boton}
            />
            <Text style={styles.verifiedText}>Verificado</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Ionicons
            name="location-outline"
            size={36}
            color={paletaColores.texto}
            style={styles.cardIcon}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Ubicación principal</Text>
            <Text style={styles.cardValue}>{datosPersonales?.ciudad}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={paletaColores.boton}
            />
            <Text style={styles.verifiedText}>Confirmado</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="wallet-outline"
              size={24}
              color={paletaColores.texto}
              style={styles.sectionIcon}
            />
            <View>
              <Text style={styles.sectionTitle}>Método de pago preferido</Text>
              <Text style={styles.sectionSubtitle}>
                Podrás cambiarlo en cada viaje si lo deseas.
              </Text>
            </View>
          </View>

          <View style={styles.paymentMethodsRow}>
            {["Efectivo", "Yape", "Plin"].map((metodo) => {
              //Transforma la lista, una por una
              const estaSeleccionado = metodoPagoSeleccionado === metodo;
              return (
                <Pressable
                  key={metodo}
                  style={[
                    styles.paymentCard,
                    estaSeleccionado && styles.paymentCardSelected,
                  ]}
                  onPress={() => setMetodoPagoSeleccionado(metodo)}
                >
                  <View style={styles.paymentCardTopRow}>
                    <View style={styles.paymentIconContainer}>
                      {metodo === "Efectivo" ? (
                        <Ionicons
                          name="cash-outline"
                          size={28}
                          color={
                            estaSeleccionado
                              ? paletaColores.texto
                              : paletaColores.textoSecundario
                          }
                        />
                      ) : metodo === "Yape" ? (
                        <View
                          style={[
                            styles.methodLogoPlaceholder,
                            { backgroundColor: "#742183" },
                          ]}
                        >
                          <Text style={styles.methodLogoText}>Y</Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.methodLogoPlaceholder,
                            { backgroundColor: "#00D1FF" },
                          ]}
                        >
                          <Text style={styles.methodLogoText}>P</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={estaSeleccionado ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={
                        estaSeleccionado ? paletaColores.boton : paletaColores.borde
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentMethodName,
                      estaSeleccionado && styles.paymentMethodNameSelected,
                    ]}
                  >
                    {metodo}
                  </Text>
                  <Text
                    style={[
                      styles.paymentMethodDesc,
                      estaSeleccionado && styles.paymentMethodDescSelected,
                    ]}
                  >
                    {metodo === "Efectivo"
                      ? "Pago en el viaje"
                      : "Pago al conductor"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="people-outline"
              size={24}
              color={paletaColores.texto}
              style={styles.sectionIcon}
            />
            <View>
              <Text style={styles.sectionTitle}>
                Contacto de emergencia (Opcional)
              </Text>
              <Text style={styles.sectionSubtitle}>
                En caso de cualquier eventualidad.
              </Text>
            </View>
          </View>

          <View style={styles.emergencyInputsRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <CampoTexto
                nombreIcono="person-outline"
                textoReferencia="Ej. María Pérez"
                valor={nombreEmergencia}
                alCambiarTexto={setNombreEmergencia}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <CampoTexto
                nombreIcono="call-outline"
                textoReferencia="Ej. 987 654 321"
                valor={telefonoEmergencia}
                alCambiarTexto={setTelefonoEmergencia}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <BotonPrincipal
            titulo="Siguiente"
            alPresionar={() => {
              router.push("/registro-pasajero/preferencias");
            }}
          />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Atrás</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  stepContainer: {
    alignItems: "center",
    marginTop: -10,
  },
  stepText: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
  headerContainer: {
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paletaColores.input,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(53, 233, 130, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: paletaColores.boton,
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 12,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
  },
  paymentMethodsRow: {
    flexDirection: "row",
    gap: 12,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: paletaColores.input,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  paymentCardSelected: {
    borderColor: paletaColores.boton,
    backgroundColor: "rgba(53, 233, 130, 0.05)",
  },
  paymentCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  methodLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  methodLogoText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
  },
  paymentMethodName: {
    color: paletaColores.texto,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentMethodNameSelected: {
    color: paletaColores.verde,
  },
  paymentMethodDesc: {
    color: paletaColores.textoSecundario,
    fontSize: 11,
  },
  paymentMethodDescSelected: {
    color: paletaColores.boton,
  },
  emergencyInputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  footer: {
    marginTop: 32,
    gap: 16,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: "600",
  },
});
