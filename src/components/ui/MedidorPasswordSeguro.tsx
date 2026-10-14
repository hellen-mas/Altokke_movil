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
  const tieneMinLongitud = contrasena.length >= longitudMinima;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneMinuscula = /[a-z]/.test(contrasena);
  const tieneNumero = /[0-9]/.test(contrasena);
  const tieneSimbolo = /[^A-Za-z0-9]/.test(contrasena);

  const reglasCumplidas = [
    tieneMinLongitud,
    tieneMayuscula,
    tieneMinuscula,
    tieneNumero,
    tieneSimbolo
  ].filter(Boolean).length;

  let nivel = 0; 
  if (contrasena.length === 0) {
    nivel = 0;
  } else if (reglasCumplidas <= 2) {
    nivel = 1;
  } else if (reglasCumplidas === 3) {
    nivel = 2;
  } else if (reglasCumplidas === 4) {
    nivel = 3;
  } else if (reglasCumplidas === 5) {
    nivel = 4;
  }

  const colores = {
    0: paletaColores.borde,
    1: paletaColores.error,
    2: paletaColores.advertencia,
    3: '#8bc34a', 
    4: paletaColores.exito, 
  };

  const etiquetas = {
    0: 'Ingresa una contraseña',
    1: 'Débil',
    2: 'Regular',
    3: 'Buena',
    4: 'Excelente',
  };

  const colorActual = colores[nivel as keyof typeof colores];

  const colorTexto = variante === "claro"
    ? paletaColores.textoClaro
    : paletaColores.texto;

  const colorSecundario = variante === "claro"
    ? paletaColores.textoSecundarioClaro
    : paletaColores.textoSecundario;

  const renderRequisito = (cumplido: boolean, texto: string) => (
    <View style={styles.requisitoFila}>
      <Ionicons 
        name={cumplido ? 'checkmark-circle' : 'ellipse-outline'} 
        size={18} 
        color={cumplido ? paletaColores.exito : colorSecundario} 
      />
      <Text 
        style={[
          styles.textoRequisito, 
          { color: cumplido ? colorTexto : colorSecundario },
          cumplido && { fontWeight: "500" },
        ]}>
        {texto}
      </Text>
    </View>
  );

  return (
    <View style={styles.contenedor}>
      <View style={styles.barrasContainer}>
        {[1, 2, 3, 4].map((index) => (
          <View
            key={index}
            style={[
              styles.barra,
              { backgroundColor: nivel >= index ? colorActual : paletaColores.borde }
            ]}
          />
        ))}
      </View>
      
      <View style={styles.textoContainer}>
        <Text 
          style={[
            styles.textoFuerza, 
            { color: nivel > 0 ? colorActual : colorSecundario },
          ]}>
          {etiquetas[nivel as keyof typeof etiquetas]}
        </Text>
      </View>

      <View style={styles.requisitosContainer}>
        {renderRequisito(tieneMinLongitud,  `Mínimo ${longitudMinima} caracteres`)}
        {renderRequisito(tieneMayuscula && tieneMinuscula, 'Mayúsculas (A-Z) y minúsculas (a-z)')}
        {renderRequisito(tieneNumero, 'Al menos un número (0-9)')}
        {renderRequisito(tieneSimbolo, 'Símbolo especial (!, @, #, $, etc)')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  barrasContainer: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    marginBottom: 8,
  },
  barra: {
    flex: 1,
    borderRadius: 2,
  },
  textoContainer: {
    marginBottom: 12,
  },
  textoFuerza: {
    fontSize: 14,
    fontWeight: '600',
  },
  requisitosContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  requisitoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textoRequisito: {
    fontSize: 13,
    color: paletaColores.textoSecundario,
  },
  textoCumplido: {
    color: paletaColores.texto,
    fontWeight: '500',
  },
});
