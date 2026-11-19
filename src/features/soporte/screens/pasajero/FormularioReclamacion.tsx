import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { styles } from "./reclamaciones.styles";

type TipoDocumento = "DNI" | "CE" | "RUC";
type TipoReclamacion = "reclamo" | "queja";

interface FormularioReclamacionProps {
  tipo: TipoReclamacion;
  setTipo: (value: TipoReclamacion) => void;
  nombreCompleto: string;
  setNombreCompleto: (value: string) => void;
  tipoDocumento: TipoDocumento;
  setTipoDocumento: (value: TipoDocumento) => void;
  numeroDocumento: string;
  setNumeroDocumento: (value: string) => void;
  telefono: string;
  setTelefono: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  direccion: string;
  setDireccion: (value: string) => void;
  montoReclamado: string;
  setMontoReclamado: (value: string) => void;
  detalle: string;
  setDetalle: (value: string) => void;
  pedido: string;
  setPedido: (value: string) => void;
  enviando: boolean;
  enviarReclamacion: () => void;
}

export function FormularioReclamacion({
  tipo,
  setTipo,
  nombreCompleto,
  setNombreCompleto,
  tipoDocumento,
  setTipoDocumento,
  numeroDocumento,
  setNumeroDocumento,
  telefono,
  setTelefono,
  email,
  setEmail,
  direccion,
  setDireccion,
  montoReclamado,
  setMontoReclamado,
  detalle,
  setDetalle,
  pedido,
  setPedido,
  enviando,
  enviarReclamacion,
}: FormularioReclamacionProps) {
  const { colores } = useAltokkeTheme();

  return (
    <>
        <View
          style={[
            styles.avisoLegal,
            { backgroundColor: colores.superficie, borderColor: colores.linea },
          ]}
        >
          <Ionicons name="book-outline" size={22} color={colores.exitoTexto} />
          <Text style={[styles.textoAvisoLegal, { color: colores.secundario }]}>
            Altokke Móvil S.A.C. · RUC: 20612345678 · Jr. Bagua N° 120, Bagua.
            Conforme a las disposiciones del INDECOPI.
          </Text>
        </View>

        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
          Tipo de Disconformidad
        </Text>
        <View style={styles.filaTipos}>
          <Pressable
            onPress={() => setTipo("reclamo")}
            style={[
              styles.botonTipo,
              {
                backgroundColor:
                  tipo === "reclamo" ? colores.primario : colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            <Ionicons
              name="alert-circle"
              size={18}
              color={
                tipo === "reclamo" ? colores.textoBoton : colores.secundario
              }
            />
            <Text
              style={[
                styles.textoTipo,
                {
                  color:
                    tipo === "reclamo" ? colores.textoBoton : colores.texto,
                },
              ]}
            >
              Reclamo (Servicio)
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTipo("queja")}
            style={[
              styles.botonTipo,
              {
                backgroundColor:
                  tipo === "queja" ? colores.primario : colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            <Ionicons
              name="chatbox-ellipses"
              size={18}
              color={tipo === "queja" ? colores.textoBoton : colores.secundario}
            />
            <Text
              style={[
                styles.textoTipo,
                {
                  color: tipo === "queja" ? colores.textoBoton : colores.texto,
                },
              ]}
            >
              Queja (Atención)
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
          1. Datos del Consumidor
        </Text>
        <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
          Nombre completo *
        </Text>
        <TextInput
          value={nombreCompleto}
          onChangeText={setNombreCompleto}
          placeholder="Nombres y apellidos"
          placeholderTextColor={colores.secundario}
          style={[
            styles.input,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <View style={styles.filaDocumento}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
              Tipo doc.
            </Text>
            <View
              style={[
                styles.selectorDoc,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.linea,
                },
              ]}
            >
              <Pressable
                onPress={() => setTipoDocumento("DNI")}
                style={[
                  styles.opcionDoc,
                  tipoDocumento === "DNI" && {
                    backgroundColor: colores.primario,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.textoDoc,
                    {
                      color:
                        tipoDocumento === "DNI"
                          ? colores.textoBoton
                          : colores.secundario,
                    },
                  ]}
                >
                  DNI
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTipoDocumento("CE")}
                style={[
                  styles.opcionDoc,
                  tipoDocumento === "CE" && {
                    backgroundColor: colores.primario,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.textoDoc,
                    {
                      color:
                        tipoDocumento === "CE"
                          ? colores.textoBoton
                          : colores.secundario,
                    },
                  ]}
                >
                  CE
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTipoDocumento("RUC")}
                style={[
                  styles.opcionDoc,
                  tipoDocumento === "RUC" && {
                    backgroundColor: colores.primario,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.textoDoc,
                    {
                      color:
                        tipoDocumento === "RUC"
                          ? colores.textoBoton
                          : colores.secundario,
                    },
                  ]}
                >
                  RUC
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={{ flex: 1.4 }}>
            <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
              N° Documento *
            </Text>
            <TextInput
              value={numeroDocumento}
              onChangeText={setNumeroDocumento}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="Número"
              placeholderTextColor={colores.secundario}
              style={[
                styles.input,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.linea,
                  color: colores.texto,
                },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
          Teléfono / Celular *
        </Text>
        <TextInput
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          maxLength={9}
          placeholder="Ej: 913714910"
          placeholderTextColor={colores.secundario}
          style={[
            styles.input,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
          Correo electrónico *
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="ejemplo@correo.com"
          placeholderTextColor={colores.secundario}
          style={[
            styles.input,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
          Domicilio (Bagua / Perú)
        </Text>
        <TextInput
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Dirección o referencia"
          placeholderTextColor={colores.secundario}
          style={[
            styles.input,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
          2. Detalle y Pedido
        </Text>
        <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
          Monto reclamado (S/ - opcional)
        </Text>
        <TextInput
          value={montoReclamado}
          onChangeText={setMontoReclamado}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colores.secundario}
          style={[
            styles.inputMoneda,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
          Detalle de los hechos *
        </Text>
        <TextInput
          value={detalle}
          onChangeText={setDetalle}
          multiline
          numberOfLines={4}
          placeholder="Explica qué ocurrió..."
          placeholderTextColor={colores.secundario}
          textAlignVertical="top"
          style={[
            styles.areaTexto,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <Text style={[styles.etiquetaCampo, { color: colores.secundario }]}>
          Pedido concreto *
        </Text>
        <TextInput
          value={pedido}
          onChangeText={setPedido}
          multiline
          numberOfLines={3}
          placeholder="¿Qué solución solicitas?"
          placeholderTextColor={colores.secundario}
          textAlignVertical="top"
          style={[
            styles.areaTexto,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <BotonPrincipal
          titulo={enviando ? "Registrando hoja..." : "Enviar Reclamación"}
          cargando={enviando}
          disabled={enviando}
          onPress={enviarReclamacion}
          estilo={{ marginTop: 20 }}
        />
    </>
  );
}