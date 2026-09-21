import { paletaColores } from "@/paletaColores";
import { Link, router } from "expo-router";
import React from "react";
import { StyleSheet, View, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomInput } from "@/components/ui/CustomInput";
import { LogoHeader } from "@/components/ui/LogoHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function RecuperarPasswordScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <LogoHeader />

            <PageHeader
              title={"Recuperar\ncontraseña"}
              highlightedTitle=""
              description=""
            />

            <View style={styles.inputContainer}>
              <CustomInput
                iconName="mail-outline"
                placeholder="Correo electrónico o teléfono"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <PrimaryButton
              title="Continuar"
              onPress={() => router.push("/recuperar-password/verificar" as any)}
              style={styles.button}
            />

            <Link href={"/login" as any} style={styles.secondaryLink}>
              Usa otra forma de recuperación
            </Link>
          </View>

          <View style={styles.footer}>
            <Link href={"/login" as any} style={styles.secondaryLink}>
              Volver al inicio
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginTop: 30,
    marginBottom: 40,
  },
  button: {
    marginBottom: 30,
  },
  secondaryLink: {
    color: paletaColores.verde,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  footer: {
    paddingBottom: 40,
    alignItems: "center",
    marginTop: "auto",
  },
});
