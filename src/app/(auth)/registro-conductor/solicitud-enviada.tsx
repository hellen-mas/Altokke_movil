import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { paletaColores } from "@/paletaColores";
import { authService } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ETAPAS = [
  {
    numero: "01",
    titulo: "Solicitud recibida",
    descripcion: "Tu información fue registrada.",
  },
  {
    numero: "02",
    titulo: "Revisión de documentos",
    descripcion: "El equipo verificará tus datos.",
  },
  {
    numero: "03",
    titulo: "Resultado",
    descripcion: "Consulta el estado al iniciar sesión.",
  },
];

export default function SolicitudEnviada() {
  const [saliendo, setSaliendo] = useState(false);
  const salidaEnCurso = useRef(false);

  const irAlLogin = async () => {
    if (salidaEnCurso.current) return;

    salidaEnCurso.current = true;
    setSaliendo(true);

    try {
      await authService.cerrarSesion();
      router.replace("/login");
    } catch {
      Alert.alert(
        "No se pudo cerrar sesión",
        "Intenta nuevamente para volver al inicio de sesión."
      );
    } finally {
      salidaEnCurso.current = false;
      setSaliendo(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.areaSegura}
      edges={["top", "bottom"]}
    >
      <StatusBar style="dark"/>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroPrincipal}>
            <Text style={styles.titulo}>
              ¡Solicitud
            </Text>
            <Text style={styles.tituloDestacado}>
              enviada!
            </Text>

            <Text style={styles.descripcion}>
              Recibimos tu información correctamente.
            </Text>
          </View>

          <View style={styles.estado}>
            <View style={styles.puntoEstado} />
            <Text style={styles.estadoTexto}>
              PENDIENTE DE REVISIÓN
            </Text>
          </View>
        </View>

        <View style={styles.contenido}>
          <View style={styles.encabezadoProceso}>
            <Text style={styles.tituloSeccion}>
              ¿Qué sigue?
            </Text>
          </View>

          {/* Proceso de revisión */}
          <View style={styles.proceso}>
            {ETAPAS.map((etapa, indice) => (
              <View
                key={etapa.numero}
                style={styles.etapa}
              >
                <View style={styles.columnaNumero}>
                  <Text
                    style={[
                      styles.numero,
                      indice === 0 && styles.numeroActivo,
                    ]}
                  >
                    {etapa.numero}
                  </Text>

                  {indice < ETAPAS.length - 1 && (
                    <View style={styles.linea} />
                  )}
                </View>

                <View style={styles.informacionEtapa}>
                  <Text style={styles.tituloEtapa}>
                    {etapa.titulo}
                  </Text>

                  <Text style={styles.descripcionEtapa}>
                    {etapa.descripcion}
                  </Text>
                </View>

                {indice === 0 && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color={paletaColores.primaryHover}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Nota de confianza */}
          <View style={styles.nota}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={paletaColores.textoSecundarioClaro}
            />

            <Text style={styles.notaTexto}>
              Tu solicitud permanecerá registrada.
            </Text>
          </View>

          {/* Acción */}
          <View style={styles.acciones}>
            <BotonPrincipal
              titulo="Ir a iniciar sesión"
              mostrarIcono={!saliendo}
              icono="arrow-forward"
              cargando={saliendo}
              disabled={saliendo}
              onPress={irAlLogin}
              estilo={styles.boton}
              estiloTexto={styles.botonTexto}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scroll: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    flexGrow: 1,
  },

  // CABECERA OSCURA
  hero: {
    backgroundColor: "#10281E",
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 32,
    minHeight: 310,
    justifyContent: "space-between",
  },

  heroSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  identificador: {
    color: "#9ED6B5",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  heroPrincipal: {
    marginTop: 38,
    marginBottom: 30,
  },

  titulo: {
    fontSize: 43,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1.4,
    color: "#FFFFFF",
  },

  tituloDestacado: {
    fontSize: 43,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1.4,
    color: "#63C790",
  },

  descripcion: {
    color: "#CFDDD3",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },

  estado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  puntoEstado: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9A44C",
  },

  estadoTexto: {
    color: "#F1E2C5",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // CONTENIDO
  contenido: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 30,
  },

  encabezadoProceso: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 27,
  },

  tituloSeccion: {
    color: paletaColores.textoClaro,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  contador: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    fontWeight: "600",
  },

  // ETAPAS SIN TARJETAS
  proceso: {
    width: "100%",
  },

  etapa: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    minHeight: 80,
  },

  columnaNumero: {
    width: 30,
    alignItems: "center",
    alignSelf: "stretch",
  },

  numero: {
    color: "#A1B0A7",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  numeroActivo: {
    color: paletaColores.primaryHover,
  },

  linea: {
    width: 1,
    flex: 1,
    minHeight: 25,
    backgroundColor: "#DCE5DF",
    marginTop: 9,
    marginBottom: 9,
  },

  informacionEtapa: {
    flex: 1,
    paddingBottom: 22,
  },

  tituloEtapa: {
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },

  descripcionEtapa: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  // NOTA INFERIOR
  nota: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#DCE5DF",
    marginTop: 8,
  },

  notaTexto: {
    flex: 1,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    lineHeight: 18,
  },

  // BOTÓN
  acciones: {
    marginTop: "auto",
    paddingTop: 32,
  },

  boton: {
    minHeight: 58,
    borderRadius: 10,
  },

  botonTexto: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
