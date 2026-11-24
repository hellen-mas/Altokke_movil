import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { DatoPersonal } from "@/features/conductores/components/DatoPersonal";
import { TarjetaPerfilConductor } from "@/features/conductores/components/TarjetaPerfilConductor";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { AvisoInformativo } from "@/shared/components/ui";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

export default function InformacionPersonalConductor() {
  const { estilos: styles } = useTemaConductor(crearEstilos);
  const { perfil } = usePerfilConductor();

  const solicitarActualizacion = () => {
    router.push("/conductor/cuenta/centro-ayuda");
  };

  const campos = [
    { icono: "person" as const, titulo: "Nombre completo", valor: perfil.nombre, editable: false },
    { icono: "card" as const, titulo: "DNI", valor: perfil.dni || "Registrado", editable: false },
    { icono: "call" as const, titulo: "Teléfono", valor: perfil.telefono || "No especificado", editable: false },
    { icono: "mail" as const, titulo: "Correo electrónico", valor: perfil.correo || "No especificado", editable: false },
    { icono: "calendar" as const, titulo: "Fecha de nacimiento", valor: perfil.fechaNacimiento, editable: false },
    { icono: "location" as const, titulo: "Ciudad", valor: perfil.ciudad, editable: false },
    {
      icono: "people" as const,
      titulo: "Contacto de emergencia",
      valor: `${perfil.contactoEmergencia.nombre} (${perfil.contactoEmergencia.parentesco})`,
      valorSecundario: perfil.contactoEmergencia.telefono,
      editable: false,
    },
  ];

  return (
    <View style={styles.container}>
      <CabeceraConductor titulo="Información personal" mostrarAtras compacta />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TarjetaPerfilConductor
          nombre={perfil.nombre}
          calificacion={perfil.calificacion}
          viajes={perfil.viajes}
          estado={perfil.estado}
          foto={perfil.foto}
          compacta
        />

        <View style={styles.cardDatos}>
          {campos.map((c, i) => (
            <DatoPersonal
              key={c.titulo}
              icono={c.icono}
              titulo={c.titulo}
              valor={c.valor}
              valorSecundario={c.valorSecundario}
              editable={false}
              ultimo={i === campos.length - 1}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.botonEditar, pressed && { opacity: 0.85 }]}
          onPress={solicitarActualizacion}
        >
          <Ionicons name="help-buoy-outline" size={18} color="#FFFFFF" />
          <Text style={styles.botonTexto}>Solicitar actualización a soporte</Text>
        </Pressable>

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Por seguridad y validación de antecedentes, la actualización de datos personales es verificada por el equipo de soporte de Altokke."
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
  cardDatos: {
    backgroundColor: c.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.borde,
    overflow: "hidden",
  },
  botonEditar: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primario,
    borderRadius: 14,
    gap: 8,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
