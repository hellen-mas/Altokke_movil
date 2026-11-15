import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { AvisoInformativo } from "@/shared/components/ui";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

type EstadoDoc = "VERIFICADO" | "EN_REVISION" | "PENDIENTE";

const DOCS_CONFIG = [
  { clave: "dni", icono: "id-card-outline" as const, titulo: "DNI o documento de identidad", desc: "Tu documento oficial registrado" },
  { clave: "licencia", icono: "car-outline" as const, titulo: "Licencia de conducir", desc: "Licencia vigente para mototaxi" },
  { clave: "soat", icono: "document-text-outline" as const, titulo: "SOAT", desc: "Seguro obligatorio contra accidentes" },
  { clave: "tarjetaPropiedad", icono: "car-sport-outline" as const, titulo: "Tarjeta de propiedad", desc: "Documento oficial de tu vehículo" },
  { clave: "antecedentesPenales", icono: "shield-checkmark-outline" as const, titulo: "Antecedentes penales", desc: "Certificado policial y judicial" },
];

const crearEstilosEstado = (c: ColoresConductor): Record<EstadoDoc, { texto: string; icono: keyof typeof Ionicons.glyphMap; color: string; fondo: string }> => ({
  VERIFICADO: { texto: "Verificado", icono: "checkmark-circle", color: c.primario, fondo: c.primarioSuave },
  EN_REVISION: { texto: "En revisión", icono: "time-outline", color: c.ambar, fondo: c.ambarSuave },
  PENDIENTE: { texto: "Pendiente", icono: "alert-circle-outline", color: c.error, fondo: c.errorSuave },
});

export default function DocumentosConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const ESTILOS_ESTADO = crearEstilosEstado(c);
  const { perfil } = usePerfilConductor();
  const docs = perfil.documentos || {};

  const verDocumento = (nombre: string) => {
    Alert.alert(nombre, "Tu documento se encuentra registrado en la central. Para reemplazarlo, contacta a soporte.");
  };

  const docsCargados = DOCS_CONFIG.filter((d) => docs[d.clave]?.estado === "VERIFICADO").length;

  return (
    <View style={styles.container}>
      <CabeceraConductor titulo="Documentos" mostrarAtras compacta />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.resumenCard}>
          <View style={styles.progresoBox}>
            <Text style={styles.progresoNum}>{docsCargados} de 5</Text>
            <Text style={styles.progresoSub}>verificados</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.resumenTitulo}>{docsCargados === 5 ? "¡Documentación al día!" : "Verificación en curso"}</Text>
            <Text style={styles.resumenDesc}>
              {docsCargados === 5
                ? "Todos tus documentos están aprobados para conducir con Altokke."
                : "La central está revisando tus documentos para habilitar tu cuenta."}
            </Text>
          </View>
        </View>

        <View style={styles.lista}>
          {DOCS_CONFIG.map((d) => {
            const rawEstado = (docs[d.clave]?.estado || "PENDIENTE").toUpperCase() as EstadoDoc;
            const estadoVisual = ESTILOS_ESTADO[rawEstado] || ESTILOS_ESTADO.PENDIENTE;

            return (
              <Pressable key={d.clave} style={styles.item} onPress={() => verDocumento(d.titulo)}>
                <View style={styles.iconoBox}>
                  <Ionicons name={d.icono} size={22} color={c.primario} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.itemTitulo}>{d.titulo}</Text>
                  <Text style={styles.itemDesc}>{d.desc}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: estadoVisual.fondo }]}>
                  <Ionicons name={estadoVisual.icono} size={14} color={estadoVisual.color} />
                  <Text style={[styles.badgeText, { color: estadoVisual.color }]}>{estadoVisual.texto}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textoSec} />
              </Pressable>
            );
          })}
        </View>

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tus documentos están cifrados y protegidos de acuerdo con la Ley de Protección de Datos Personales."
          variante="claro"
        />
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.fondo,
  },
  scroll: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  resumenCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.superficie,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: c.borde,
  },
  progresoBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: c.primarioSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  progresoNum: {
    fontSize: 16,
    fontWeight: "800",
    color: c.primario,
  },
  progresoSub: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textoSec,
  },
  resumenTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: c.texto,
  },
  resumenDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textoSec,
  },
  lista: {
    gap: 10,
  },
  item: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.superficie,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: c.borde,
  },
  iconoBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primarioSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: c.texto,
  },
  itemDesc: {
    fontSize: 13,
    color: c.textoSec,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
