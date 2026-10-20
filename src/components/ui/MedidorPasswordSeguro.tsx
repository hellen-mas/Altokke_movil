import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { paletaColores } from '@/paletaColores';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  contrasena: string;
  longitudMinima?: number;
  variante?: "oscuro" | "claro";
}

export function MedidorPasswordSeguro({ 
  contrasena,
  longitudMinima = 8,
  variante = "oscuro",
}: Props) {
  const esClaro = variante === "claro";

  const requisitos = [
    contrasena.length >= longitudMinima,
    /[A-Z]/.test(contrasena),
    /[a-z]/.test(contrasena),
    /[0-9]/.test(contrasena),
    /[^A-Za-z0-9]/.test(contrasena),
  ];

  const cumplidos = requisitos.filter(Boolean).length;

  const nivel =
    contrasena.length === 0 ? 0 :
    cumplidos <= 2 ? 1 :
    cumplidos === 3 ? 2 :
    cumplidos === 4 ? 3 : 4;

  const colores = [
    paletaColores.bordeClaro,
    paletaColores.error,
    paletaColores.advertencia,
    "#729A35",
    paletaColores.exito,
  ];

  const etiquetas = [
    "Sin evaluar",
    "Débil",
    "Regular",
    "Buena",
    "Excelente",
  ];

  const colorActual = colores[nivel];

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text
          style={[
            styles.titulo,
            esClaro && styles.tituloClaro,
          ]}
        >
          Seguridad de contraseña
        </Text>

        <Text
          style={[
            styles.nivel,
            { color: nivel === 0
                ? esClaro
                  ? paletaColores.textoSecundarioClaro
                  : paletaColores.textoSecundario
                : colorActual
            },
          ]}
        >
          {etiquetas[nivel]}
        </Text>
      </View>

      <View style={styles.barras}>
        {[1, 2, 3, 4].map((indice) => (
          <View
            key={indice}
            style={[
              styles.barra,
              { backgroundColor: 
                nivel >= indice 
                  ? colorActual 
                  : esClaro
                    ? "#DCE5DF"
                    : paletaColores.borde, 
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.ayuda}>
        <Ionicons
          name="information-circle-outline"
          size={15}
          color={
            esClaro
              ? paletaColores.textoSecundarioClaro
              : paletaColores.textoSecundario
          }
        />
        <Text
          style={[
            styles.descripcion,
            esClaro && styles.descripcionClara,
          ]}
        >
          Mín. {longitudMinima} caracteres,
          mayúsculas, números y símbolos.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: "100%",
    marginTop: 2,
    marginBottom: 4,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titulo: {
    fontSize: 13,
    fontWeight: "600",
    color: paletaColores.texto,
  },
  tituloClaro: {
    color: paletaColores.textoClaro,
  },
  nivel: {
    fontSize: 12,
    fontWeight: "700",
  },
  barras: {
    flexDirection: "row",
    gap: 5,
    height: 5,
  },
  barra: {
    flex: 1,
    borderRadius: 5,
  },
  ayuda: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 10,
  },
  descripcion: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: paletaColores.textoSecundario,
  },
  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
});
