import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AvatarPerfil } from "@/components/cuenta/AvatarPerfil";
import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { PASAJERO_DEMO } from "@/constants/cuenta";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { paletaColores } from "@/paletaColores";
import { seleccionarFotoGaleria, subirFotoAvatar } from "@/utils/avatar";

export default function InformacionPersonal() {
  const { userId, user } = useAuth();
  const [foto, setFoto] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: PASAJERO_DEMO.nombre,
    correo: PASAJERO_DEMO.correo,
    telefono: PASAJERO_DEMO.telefono,
    fechaNacimiento: PASAJERO_DEMO.fechaNacimiento,
    genero: PASAJERO_DEMO.genero,
  });

  // Cargar datos reales del usuario desde Supabase si está autenticado
  useEffect(() => {
    let montado = true;

    async function cargarPerfil() {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("nombre, apellidos, telefono, avatar_url, foto_url")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.warn("Error cargando perfil del usuario:", error.message);
          return;
        }

        if (data && montado) {
          const avatar = data.avatar_url || data.foto_url;
          if (avatar) {
            setFoto(avatar);
          }

          const nombreCompleto =
            `${data.nombre || ""} ${data.apellidos || ""}`.trim() ||
            user?.user_metadata?.nombre ||
            PASAJERO_DEMO.nombre;

          setDatosUsuario((prev) => ({
            ...prev,
            nombre: nombreCompleto,
            correo: user?.email || prev.correo,
            telefono: data.telefono || prev.telefono,
          }));
        }
      } catch (err) {
        console.warn("Excepción al cargar perfil:", err);
      }
    }

    cargarPerfil();

    return () => {
      montado = false;
    };
  }, [userId, user]);

  const elegirFoto = async () => {
    if (!userId) {
      Alert.alert(
        "Sesión requerida",
        "Debes iniciar sesión para actualizar tu foto de perfil en el servidor."
      );
      return;
    }

    try {
      const fotoSeleccionada = await seleccionarFotoGaleria();
      if (!fotoSeleccionada) return;

      setSubiendoFoto(true);

      const resultado = await subirFotoAvatar(fotoSeleccionada, userId);

      setSubiendoFoto(false);

      if (resultado.ok && resultado.url) {
        setFoto(resultado.url);
        Alert.alert(
          "Foto de perfil",
          "Tu fotografía ha sido validada y actualizada exitosamente."
        );
      } else {
        Alert.alert(
          "No se pudo guardar la foto",
          resultado.error ||
            "La imagen fue rechazada por contener material no permitido o hubo un error al guardarla."
        );
      }
    } catch (error: any) {
      setSubiendoFoto(false);
      Alert.alert(
        "Foto de perfil",
        error?.message || "Ocurrió un error al seleccionar la imagen."
      );
    }
  };

  const DATOS = [
    { etiqueta: "Nombre completo", valor: datosUsuario.nombre },
    { etiqueta: "Correo electrónico", valor: datosUsuario.correo },
    { etiqueta: "Número de teléfono", valor: datosUsuario.telefono },
    { etiqueta: "Fecha de nacimiento", valor: datosUsuario.fechaNacimiento },
    { etiqueta: "Género", valor: datosUsuario.genero },
  ];

  return (
    <View style={styles.container}>
      <EncabezadoPantalla titulo="Información personal" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <Pressable
          style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}
          onPress={elegirFoto}
          disabled={subiendoFoto}
        >
          <View style={styles.avatarWrapper}>
            <AvatarPerfil nombre={datosUsuario.nombre} tamano={48} uri={foto} />
            {subiendoFoto && (
              <View style={styles.avatarCargando}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.textos}>
            <Text style={styles.etiquetaFoto}>Foto de perfil</Text>
            <Text style={styles.subtituloFoto}>
              {subiendoFoto ? "Validando y subiendo..." : "Toca para cambiar tu foto"}
            </Text>
          </View>

          {subiendoFoto ? (
            <ActivityIndicator size="small" color={paletaColores.boton} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={paletaColores.textoSecundarioClaro}
            />
          )}
        </Pressable>

        {DATOS.map((dato) => (
          <View key={dato.etiqueta} style={styles.fila}>
            <View style={styles.textos}>
              <Text style={styles.etiqueta}>{dato.etiqueta}</Text>
              <Text style={styles.valor}>{dato.valor}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={paletaColores.textoSecundarioClaro}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paletaColores.bordeClaro,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatarCargando: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  etiquetaFoto: {
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  subtituloFoto: {
    marginTop: 2,
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  textos: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  valor: {
    marginTop: 2,
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
  },
});
