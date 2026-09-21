import { CustomInput, LogoHeader, PrimaryButton } from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NuevoPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <LogoHeader />

          <Text style={styles.title}>Crear nueva contraseña</Text>
          <Text style={styles.subtitle}>
            Crea una contraseña fuerte y segura para proteger tu cuenta.
          </Text>

          <View style={styles.formContainer}>
            <CustomInput
              iconName="lock-closed-outline"
              placeholder="Nueva contraseña"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <CustomInput
              iconName="lock-closed-outline"
              placeholder="Confirmar nueva contraseña"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.requirementsContainer}>
              <RequirementItem text="Al menos 8 caracteres" checked={true} />
              <RequirementItem text="Un número" checked={true} />
              <RequirementItem text="Un carácter especial (ej: @ # $ % & *)" checked={true} />
              <RequirementItem text="Una mayúscula" checked={true} />
            </View>

            <PrimaryButton
              title="Guardar contraseña"
              onPress={() => router.push("/login" as any)}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.footerContainer}>
            <Link href={"/login" as any} style={styles.backLink}>
              Volver al inicio
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RequirementItem({ text, checked }: { text: string; checked: boolean }) {
  return (
    <View style={styles.requirementItem}>
      <Ionicons
        name="checkmark"
        size={18}
        color={checked ? paletaColores.verde : paletaColores.textoSecundario}
      />
      <Text style={[styles.requirementText, checked && styles.requirementTextChecked]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: paletaColores.texto,
    marginTop: 10,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: paletaColores.textoSecundario,
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  requirementsContainer: {
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: paletaColores.textoSecundario,
  },
  requirementTextChecked: {
    color: paletaColores.texto,
  },
  submitButton: {
    marginTop: 8,
  },
  footerContainer: {
    marginTop: "auto",
    paddingTop: 32,
    alignItems: "center",
  },
  backLink: {
    color: paletaColores.verde,
    fontSize: 16,
    fontWeight: "600",
  },
});
