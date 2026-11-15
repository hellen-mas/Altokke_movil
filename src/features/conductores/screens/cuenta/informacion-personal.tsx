import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { DatoPersonal } from "@/features/conductores/components/DatoPersonal";
import { TarjetaPerfilConductor } from "@/features/conductores/components/TarjetaPerfilConductor";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { AvisoInformativo } from "@/shared/components/ui";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

export default function InformacionPersonalConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const { perfil } = usePerfilConductor();
  const [modoEdicion, setModoEdicion] = useState(false);

  const editarDato = (campo: string) => {
    Alert.alert("Editar información", `Para actualizar ${campo}, contacta a soporte o actualiza tus documentos.`);
  };

  const campos = [
    { icono: "person" as const, titulo: "Nombre completo", valor: perfil.nombre, editable: false },
    { icono: "card" as const, titulo: "DNI", valor: perfil.dni || "Registrado", editable: false },
    { icono: "call" as const, titulo: "Teléfono", valor: perfil.telefono || "No especificado", editable: modoEdicion, campo: "tu teléfono" },
    { icono: "mail" as const, titulo: "Correo electrónico", valor: perfil.correo || "No especificado", editable: modoEdicion, campo: "tu correo electrónico" },
    { icono: "calendar" as const, titulo: "Fecha de nacimiento", valor: perfil.fechaNacimiento, editable: false },
    { icono: "location" as const, titulo: "Ciudad", valor: perfil.ciudad, editable: modoEdicion, campo: "tu ciudad" },
    {
      icono: "people" as const,
      titulo: "Contacto de emergencia",
      valor: `${perfil.contactoEmergencia.nombre} (${perfil.contactoEmergencia.parentesco})`,
      valorSecundario: perfil.contactoEmergencia.telefono,
      editable: modoEdicion,
      campo: "tu contacto de emergencia",
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
              editable={c.editable}
              onEditar={() => c.campo && editarDato(c.campo)}
              ultimo={i === campos.length - 1}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.botonEditar, pressed && { opacity: 0.85 }]}
          onPress={() => setModoEdicion(!modoEdicion)}
        >
          <Ionicons name={modoEdicion ? "checkmark-outline" : "pencil-outline"} size={18} color="#FFFFFF" />
          <Text style={styles.botonTexto}>{modoEdicion ? "Finalizar edición" : "Actualizar datos"}</Text>
        </Pressable>

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tus datos personales están protegidos con cifrado de punto a punto y no se comparten con terceros."
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
