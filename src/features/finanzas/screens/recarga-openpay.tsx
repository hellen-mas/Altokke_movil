
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { recargaOpenpayService } from "../services/recargaOpenpayService";

interface Props {
  visible: boolean;
  onCerrar: () => void;
  onRecargaProcesada: () => void | Promise<unknown>;
}

export default function RecargaOpenpay({
  visible,
  onCerrar,
  onRecargaProcesada,
}: Props) {
  const [monto, setMonto] = useState("5.00");
  const [titular, setTitular] = useState("");
  const [numero, setNumero] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [cvv, setCvv] = useState("");
  const [procesando, setProcesando] = useState(false);
  const bloqueo = useRef(false);

  const cerrar = () => {
    if (!procesando) onCerrar();
  };

  const limpiarTarjeta = () => {
    setNumero("");
    setCvv("");
    setMes("");
    setAnio("");
  };

  const procesar = async () => {
    if (bloqueo.current) return;

    const valor = Number(monto.replace(",", "."));
    const numeroLimpio = numero.replace(/\D/g, "");

    if (
      !Number.isFinite(valor) ||
      valor < 1 ||
      valor > 99999 ||
      !/^\d+([.,]\d{1,2})?$/.test(monto.trim())
    ) {
      Alert.alert("Monto inválido", "Ingresa un monto desde S/ 1.00.");
      return;
    }

    if (
      !titular.trim() ||
      numeroLimpio.length < 13 ||
      numeroLimpio.length > 19 ||
      !/^\d{1,2}$/.test(mes) ||
      Number(mes) < 1 ||
      Number(mes) > 12 ||
      !/^\d{2}(\d{2})?$/.test(anio) ||
      !/^\d{3,4}$/.test(cvv)
    ) {
      Alert.alert(
        "Revisa la tarjeta",
        "Completa correctamente todos los datos de prueba."
      );
      return;
    }

    bloqueo.current = true;
    setProcesando(true);

    let solicitudEnviada = false;

    try {
      // A partir de aquí puede existir una transacción en Openpay.
      solicitudEnviada = true;

      const respuesta = await recargaOpenpayService.recargar(
        Number(valor.toFixed(2)),
        {
          holderName: titular.trim(),
          cardNumber: numeroLimpio,
          expirationMonth: mes.padStart(2, "0"),
          expirationYear: anio,
          cvv2: cvv,
        }
      );

      limpiarTarjeta();

      if (respuesta.estado === "completado") {
        await onRecargaProcesada();
        onCerrar();
        Alert.alert(
          "Recarga confirmada",
          "El pago fue aprobado. Consulta tu saldo actualizado."
        );
      } else {
        await onRecargaProcesada();

        Alert.alert(
          "Resultado pendiente",
          respuesta.mensaje ||
            "No se confirmó la acreditación. Revisa el historial antes de iniciar otra recarga."
        );

        onCerrar();
      }
    } catch (error: unknown) {
      limpiarTarjeta();

      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo procesar la recarga.";

      Alert.alert(
        "No se completó la operación",
        solicitudEnviada
          ? `${mensaje}\n\nSi el pago pudo haberse enviado, revisa el historial antes de intentarlo nuevamente.`
          : mensaje
      );
    } finally {
      bloqueo.current = false;
      setProcesando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={cerrar}
    >
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Recargar billetera</Text>

        <Text style={styles.aviso}>
          MODO PRUEBAS OPENPAY. Utiliza únicamente tarjetas
          de prueba proporcionadas por Openpay.
        </Text>

        <Text style={styles.etiqueta}>Monto en soles</Text>
        <TextInput
          style={styles.input}
          value={monto}
          onChangeText={setMonto}
          keyboardType="decimal-pad"
          placeholder="5.00"
          editable={!procesando}
        />

        <Text style={styles.etiqueta}>Nombre del titular</Text>
        <TextInput
          style={styles.input}
          value={titular}
          onChangeText={setTitular}
          autoCapitalize="words"
          placeholder="Nombre de prueba"
          editable={!procesando}
        />

        <Text style={styles.etiqueta}>Número de tarjeta</Text>
        <TextInput
          style={styles.input}
          value={numero}
          onChangeText={setNumero}
          keyboardType="number-pad"
          placeholder="Número de tarjeta de prueba"
          autoComplete="off"
          editable={!procesando}
        />

        <View style={styles.fila}>
          <View style={styles.columna}>
            <Text style={styles.etiqueta}>Mes</Text>
            <TextInput
              style={styles.input}
              value={mes}
              onChangeText={setMes}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              editable={!procesando}
            />
          </View>

          <View style={styles.columna}>
            <Text style={styles.etiqueta}>Año</Text>
            <TextInput
              style={styles.input}
              value={anio}
              onChangeText={setAnio}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="AA"
              editable={!procesando}
            />
          </View>

          <View style={styles.columna}>
            <Text style={styles.etiqueta}>CVV</Text>
            <TextInput
              style={styles.input}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="CVV"
              secureTextEntry
              editable={!procesando}
            />
          </View>
        </View>

        <Pressable
          style={[
            styles.boton,
            procesando && styles.botonDeshabilitado,
          ]}
          onPress={() => void procesar()}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBoton}>
              Confirmar recarga de prueba
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelar}
          onPress={cerrar}
          disabled={procesando}
        >
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F4F8F5",
  },
  contenido: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 50,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "800",
    color: "#073D2D",
    marginBottom: 15,
  },
  aviso: {
    backgroundColor: "#E1F2E8",
    color: "#146344",
    padding: 14,
    borderRadius: 12,
    marginBottom: 22,
    lineHeight: 20,
  },
  etiqueta: {
    fontWeight: "700",
    color: "#19382C",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E5DC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    fontSize: 15,
    color: "#172B22",
  },
  fila: {
    flexDirection: "row",
    gap: 10,
  },
  columna: {
    flex: 1,
  },
  boton: {
    backgroundColor: "#168B60",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    marginTop: 15,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  cancelar: {
    padding: 17,
    alignItems: "center",
  },
  textoCancelar: {
    color: "#52665B",
    fontWeight: "700",
  },
});
