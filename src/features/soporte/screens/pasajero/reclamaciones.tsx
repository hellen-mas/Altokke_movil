import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { supabase } from "@/shared/api/supabase";
import { BotonPrincipal } from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormularioReclamacion } from "./FormularioReclamacion";
import { styles } from "./reclamaciones.styles";

type TipoDocumento = "DNI" | "CE" | "RUC";
type TipoReclamacion = "reclamo" | "queja";

export default function PantallaLibroReclamaciones() {
  const insets = useSafeAreaInsets();
  const { colores } = useAltokkeTheme();
  const { perfil } = usePerfilPasajero();

  const [nombreCompleto, setNombreCompleto] = useState(
    perfil?.nombreCompleto || "",
  );
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState(perfil?.dni || "");
  const [telefono, setTelefono] = useState(perfil?.telefono || "");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipo, setTipo] = useState<TipoReclamacion>("reclamo");
  const [montoReclamado, setMontoReclamado] = useState("");
  const [detalle, setDetalle] = useState("");
  const [pedido, setPedido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);

  const validar = (): boolean => {
    if (!nombreCompleto.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa tu nombre completo.");
      return false;
    }
    if (!numeroDocumento.trim()) {
      Alert.alert(
        "Campo requerido",
        "Por favor ingresa tu número de documento.",
      );
      return false;
    }
    if (!telefono.trim() || telefono.trim().length < 9) {
      Alert.alert(
        "Teléfono inválido",
        "Ingresa un número de teléfono de 9 dígitos.",
      );
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert(
        "Correo inválido",
        "Ingresa un correo electrónico válido para recibir respuesta.",
      );
      return false;
    }
    if (!detalle.trim() || detalle.trim().length < 15) {
      Alert.alert(
        "Detalle requerido",
        "Describe los hechos con al menos 15 caracteres.",
      );
      return false;
    }
    if (!pedido.trim() || pedido.trim().length < 10) {
      Alert.alert(
        "Pedido requerido",
        "Indica qué solución concreta solicitas.",
      );
      return false;
    }
    return true;
  };

  const enviarReclamacion = async () => {
    if (!validar() || enviando) return;
    setEnviando(true);
    try {
      const montoNumero = Number.parseFloat(montoReclamado) || 0;
      const { data, error } = await supabase.functions.invoke("registrar-reclamacion", {
        body: {
          tipoReclamo: tipo,
          nombreCompleto: nombreCompleto.trim(),
          tipoDoc: tipoDocumento,
          numDoc: numeroDocumento.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono.trim(),
          direccion: direccion.trim() || "No especificada",
          montoReclamado: montoNumero,
          descripcionHechos: detalle.trim(),
          pedidoConcreto: pedido.trim(),
        },
      });

      if (error || !data || !data.ok) {
        const errorMsg = data?.error || error?.message || "No se pudo registrar la reclamación.";
        console.error("Error al registrar reclamación:", errorMsg);
        Alert.alert("No se pudo registrar", errorMsg);
        return;
      }

      // Código correlativo atómico oficial generado por PostgreSQL (e.g. REC-2026-00001)
      setCodigoGenerado(data.codigo);
    } catch (err: unknown) {
      console.error("Error de conectividad en reclamaciones:", err);
      Alert.alert(
        "No se pudo registrar",
        "Revisa tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  if (codigoGenerado) {
    return (
      <View
        style={[
          styles.pantalla,
          { backgroundColor: colores.fondo, paddingTop: insets.top + 20 },
        ]}
      >
        <ScrollView contentContainerStyle={styles.contenidoConfirmacion}>
          <View
            style={[styles.iconoExito, { backgroundColor: colores.exitoFondo }]}
          >
            <Ionicons
              name="checkmark-done-circle"
              size={56}
              color={colores.exitoTexto}
            />
          </View>
          <Text style={[styles.tituloConfirmacion, { color: colores.texto }]}>
            Hoja de Reclamación Registrada
          </Text>
          <Text
            style={[
              styles.subtituloConfirmacion,
              { color: colores.secundario },
            ]}
          >
            Conforme a la Ley N° 29571 (Código de Protección y Defensa del
            Consumidor) y D.S. N° 011-2011-PCM.
          </Text>
          <View
            style={[
              styles.tarjetaCodigo,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            <Text
              style={[styles.etiquetaCodigo, { color: colores.secundario }]}
            >
              CÓDIGO DE RECLAMACIÓN
            </Text>
            <Text style={[styles.valorCodigo, { color: colores.exitoTexto }]}>
              {codigoGenerado}
            </Text>
            <Text style={[styles.avisoPlazo, { color: colores.texto }]}>
              Plazo legal de respuesta: Máximo 15 días hábiles a tu correo:
              {"\n"}
              <Text style={{ fontWeight: "700" }}>{email}</Text>
            </Text>
          </View>
          <BotonPrincipal
            titulo="Volver al Inicio"
            onPress={() => router.replace("/(pasajero)/mapa")}
            estilo={{ marginTop: 24 }}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.pantalla, { backgroundColor: colores.fondo }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.cabecera,
          { paddingTop: insets.top + 10, borderBottomColor: colores.linea },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={24} color={colores.texto} />
        </Pressable>
        <Text style={[styles.tituloCabecera, { color: colores.texto }]}>
          Libro de Reclamaciones
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contenidoFormulario,
          { paddingBottom: insets.bottom + 30 },
        ]}
      >
        <FormularioReclamacion
          tipo={tipo}
          setTipo={setTipo}
          nombreCompleto={nombreCompleto}
          setNombreCompleto={setNombreCompleto}
          tipoDocumento={tipoDocumento}
          setTipoDocumento={setTipoDocumento}
          numeroDocumento={numeroDocumento}
          setNumeroDocumento={setNumeroDocumento}
          telefono={telefono}
          setTelefono={setTelefono}
          email={email}
          setEmail={setEmail}
          direccion={direccion}
          setDireccion={setDireccion}
          montoReclamado={montoReclamado}
          setMontoReclamado={setMontoReclamado}
          detalle={detalle}
          setDetalle={setDetalle}
          pedido={pedido}
          setPedido={setPedido}
          enviando={enviando}
          enviarReclamacion={enviarReclamacion}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
