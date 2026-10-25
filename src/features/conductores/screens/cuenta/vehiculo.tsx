import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { DatoPersonal } from "@/features/conductores/components/DatoPersonal";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { AvisoInformativo } from "@/shared/components/ui";
import { paletaColores } from "@/shared/theme/paletaColores";

export default function VehiculoConductor() {
  const { perfil } = usePerfilConductor();
  const [modoEdicion, setModoEdicion] = useState(false);
  const vehiculo = perfil.vehiculo;

  const editarDato = (campo: string) => {
    Alert.alert("Editar vehículo", `Para actualizar ${campo}, contacta con soporte o sube tu nueva tarjeta de propiedad.`);
  };

  const campos = [
    { clave: "marca", icono: "business-outline" as const, titulo: "Marca", valor: vehiculo.marca },
    { clave: "modelo", icono: "settings-outline" as const, titulo: "Modelo", valor: vehiculo.modelo },
    { clave: "anio", icono: "calendar-outline" as const, titulo: "Año", valor: String(vehiculo.anio) },
    { clave: "color", icono: "color-palette-outline" as const, titulo: "Color", valor: vehiculo.color },
    { clave: "placa", icono: "card-outline" as const, titulo: "Placa", valor: vehiculo.placa },
    { clave: "capacidad", icono: "people-outline" as const, titulo: "Capacidad", valor: `${vehiculo.capacidad} pasajeros` },
    { clave: "estado", icono: "shield-checkmark-outline" as const, titulo: "Estado del vehículo", valor: "Operativo", soloLectura: true },
  ];

  return (
    <View style={styles.container}>
      <CabeceraConductor titulo="Vehículo" subtitulo="Información de tu mototaxi" mostrarAtras compacta />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.vehiculoCard}>
          <View style={styles.iconoBox}>
            <Ionicons name="car-outline" size={32} color={paletaColores.verde} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.nombreVehiculo}>{vehiculo.marca} {vehiculo.modelo}</Text>
            <Text style={styles.placaVehiculo}>Placa {vehiculo.placa}</Text>
            <View style={styles.badgeVerificado}>
              <Ionicons name="checkmark-circle" size={14} color={paletaColores.verde} />
              <Text style={styles.textoVerificado}>Vehículo verificado</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDatos}>
          {campos.map((c, i) => (
            <DatoPersonal
              key={c.clave}
              icono={c.icono}
              titulo={c.titulo}
              valor={c.valor}
              editable={!c.soloLectura && modoEdicion}
              onEditar={() => editarDato(c.titulo.toLowerCase())}
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
          icono="information-circle-outline"
          titulo="Importante"
          texto="Cualquier modificación estructural en el vehículo requiere validación física en la central de Altokke."
          variante="claro"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  scroll: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  vehiculoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },
  iconoBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F4ED",
    alignItems: "center",
    justifyContent: "center",
  },
  nombreVehiculo: {
    fontSize: 18,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },
  placaVehiculo: {
    fontSize: 14,
    fontWeight: "600",
    color: paletaColores.textoSecundarioClaro,
  },
  badgeVerificado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  textoVerificado: {
    fontSize: 12,
    fontWeight: "600",
    color: paletaColores.verde,
  },
  cardDatos: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    overflow: "hidden",
  },
  botonEditar: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.verde,
    borderRadius: 14,
    gap: 8,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
