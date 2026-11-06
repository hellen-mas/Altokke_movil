import React, { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export interface PropsContenedorGrupoAjustes {
  titulo?: string;
  children: ReactNode;
  estilo?: StyleProp<ViewStyle>;
}

export function ContenedorGrupoAjustes({
  titulo,
  children,
  estilo,
}: PropsContenedorGrupoAjustes) {
  const { colores } = useAltokkeTheme();

  return (
    <View style={[styles.grupo, estilo]}>
      {titulo ? (
        <Text style={[styles.tituloGrupo, { color: colores.secundario }]}>
          {titulo.toUpperCase()}
        </Text>
      ) : null}

      <View
        style={[
          styles.tarjeta,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    gap: 10,
    marginBottom: 8,
  },
  tituloGrupo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
});

export default ContenedorGrupoAjustes;
