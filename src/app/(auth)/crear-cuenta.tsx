import { LogoHeader } from "@/components/ui/LogoHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RoleCard } from "@/components/ui/RoleCard";
import { paletaColores } from "@/paletaColores";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CrearCuentaScreen() {
  const [selectedRole, setSelectedRole] = useState<
    "pasajero" | "conductor" | null
  >("pasajero");
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole === "pasajero") {
      router.push("/registro-pasajero" as any);
    } else if (selectedRole === "conductor") {
      router.push("/registro-conductor/datos-personales" as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={paletaColores.fondo}
      />
      <View style={styles.container}>
        <LogoHeader />

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            Crear <Text style={styles.titleHighlight}>cuenta</Text>
          </Text>
          <Text style={styles.subtitle}>
            Primero elige cómo deseas{"\n"}registrarte en Altokke.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <RoleCard
            title="Cuenta de pasajero"
            subtitle="Pide mototaxis para ti y tu familia."
            iconName="people-outline"
            selected={selectedRole === "pasajero"}
            onPress={() => setSelectedRole("pasajero")}
          />
          <RoleCard
            title="Cuenta de conductor"
            subtitle="Regístrate para ofrecer viajes y generar ingresos."
            iconName="car-outline"
            selected={selectedRole === "conductor"}
            onPress={() => setSelectedRole("conductor")}
          />
        </View>

        <View style={styles.spacer} />

        <PrimaryButton
          title="Continuar"
          onPress={handleContinue}
          disabled={!selectedRole}
        />

        <View style={styles.footerContainer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            ¿Ya tienes cuenta?{" "}
            <Link href={"/login" as any} style={styles.footerLink}>
              Iniciar sesión
            </Link>
          </Text>
          <View style={styles.footerLine} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: paletaColores.texto,
    marginBottom: 8,
  },
  titleHighlight: {
    color: paletaColores.verde,
  },
  subtitle: {
    fontSize: 16,
    color: paletaColores.textoSecundario,
    lineHeight: 24,
  },
  cardsContainer: {
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 12,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: paletaColores.borde,
    maxWidth: 60,
  },
  footerText: {
    fontSize: 14,
    color: paletaColores.textoSecundario,
  },
  footerLink: {
    color: paletaColores.verde,
    fontWeight: "bold",
  },
});
