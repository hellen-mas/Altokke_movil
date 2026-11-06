import React from "react";
import { StyleSheet, View } from "react-native";
import { Control, FieldValues, Path } from "react-hook-form";
import { CampoTextoHookForm } from "./CampoTextoHookForm";
import { MedidorPasswordSeguro } from "./MedidorPasswordSeguro";

export interface PropsCampoPasswordConMedidor<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  contrasenaActual: string;
  placeholder?: string;
  etiqueta?: string;
  longitudMinima?: number;
}

export function CampoPasswordConMedidor<T extends FieldValues>({
  control,
  name,
  contrasenaActual,
  placeholder = "Contraseña",
  etiqueta,
  longitudMinima = 8,
}: PropsCampoPasswordConMedidor<T>) {
  return (
    <View style={styles.contenedor}>
      <CampoTextoHookForm
        control={control}
        name={name}
        placeholder={placeholder}
        nombreIcono="lock-closed-outline"
        esPassword
        autoCapitalize="none"
      />
      <MedidorPasswordSeguro
        contrasena={contrasenaActual}
        longitudMinima={longitudMinima}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: "100%",
    gap: 4,
  },
});

export default CampoPasswordConMedidor;
