
import { CabeceraPasajero } from "@/features/pasajeros/components/CabeceraPasajero";
import { IconoMototaxi } from "@/features/viajes/components/IconoMototaxi";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { BotonPrincipal } from "@/shared/components/ui/BotonPrincipal";
import {
  CENTRO_BAGUA,
  COLOR_CABECERA,
  CONDUCTORES_CERCANOS,
  ORIGEN_EJEMPLO,
} from "@/features/viajes/constants/pasajero";
import { useViajeStore, type TipoServicio } from "@/features/viajes/store/viajeStore";
import { useNotificaciones } from "@/features/notificaciones/context/NotificacionesContext";
import { useNombrePasajero } from "@/features/pasajeros/hooks/use-nombre-pasajero";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { viajeService } from "@/features/viajes/services/viajeService";

const SERVICIOS: {
  id: TipoServicio;
  titulo: string;
  descripcion: string;
  icono: (color: string) => ReactNode;
}[] = [
  {
    id: "normal",
    titulo: "Normal",
    descripcion: "Económico y confiable",
    icono: (color) => <IconoMototaxi size={28} color={color} />,
  },
  {
    id: "express",
    titulo: "Express",
    descripcion: "Llegas más rápido",
    icono: (color) => <Ionicons name="flash" size={26} color={color} />,
  },
  {
    id: "reserva",
    titulo: "Reserva",
    descripcion: "Programa tu viaje",
    icono: (color) => (
      <Ionicons name="calendar-outline" size={26} color={color} />
    ),
  },
];

export default function PantallaMapa() {
  const { colores, esOscuro } = useAltokkeTheme();
  const tipoServicio = useViajeStore((s) => s.tipoServicio);
  const setTipoServicio = useViajeStore((s) => s.setTipoServicio);
  const destino = useViajeStore((s) => s.destino);
  const setDestino = useViajeStore((s) => s.setDestino);
  const setOrigen = useViajeStore((s) => s.setOrigen);
  const setMetodoPago = useViajeStore((s) => s.setMetodoPago);
  const viajeActivoId = useViajeStore((s) => s.viajeActivoId);
  const setViajeActivoId = useViajeStore((s) => s.setViajeActivoId);
  const verificandoViajeActivo = useViajeStore((s) => s.verificandoViajeActivo);
  const { hayNoLeidas } = useNotificaciones();
  const nombre = useNombrePasajero();
  const { perfil } = usePerfilPasajero();
  const { userId } = useAuth();
  const [abriendoViaje, setAbriendoViaje] = useState(false);

  const continuarViaje = async () => {
    if (!userId || !viajeActivoId || abriendoViaje || verificandoViajeActivo) {
      return;
    }

    setAbriendoViaje(true);

    try {
      // Consultar el estado real antes de navegar.
      const viaje = await viajeService.obtenerViajeActivoPasajero(userId);

      if (!viaje) {
        setViajeActivoId(null);

        Alert.alert(
          "No tienes viajes activos",
          "Tu solicitud anterior ya no está activa."
        );
        return;
      }

      const {
        origen_lat,
        origen_lng,
        destino_lat,
        destino_lng,
      } = viaje;

      const coordenadasValidas =
        typeof origen_lat === "number" &&
        Number.isFinite(origen_lat) &&
        Math.abs(origen_lat) <= 90 &&
        typeof origen_lng === "number" &&
        Number.isFinite(origen_lng) &&
        Math.abs(origen_lng) <= 180 &&
        typeof destino_lat === "number" &&
        Number.isFinite(destino_lat) &&
        Math.abs(destino_lat) <= 90 &&
        typeof destino_lng === "number" &&
        Number.isFinite(destino_lng) &&
        Math.abs(destino_lng) <= 180;

      if (!coordenadasValidas) {
        Alert.alert(
          "No se pudo recuperar el viaje",
          "El viaje existe, pero sus coordenadas no son válidas."
        );
        return;
      }

      // Restaurar los datos originales del viaje.
      setOrigen({
        id: `origen-viaje-${viaje.id}`,
        nombre: viaje.origen_texto ?? "Origen registrado",
        detalle: viaje.origen_texto ?? "",
        coordenadas: {
          latitude: origen_lat,
          longitude: origen_lng,
        },
      });

      setDestino({
        id: `destino-viaje-${viaje.id}`,
        nombre: viaje.destino_texto ?? "Destino registrado",
        detalle: viaje.destino_texto ?? "",
        coordenadas: {
          latitude: destino_lat,
          longitude: destino_lng,
        },
      });

      if (
        viaje.metodo_pago === "efectivo" ||
        viaje.metodo_pago === "yape" ||
        viaje.metodo_pago === "plin"
      ) {
        setMetodoPago(viaje.metodo_pago);
      }

      setViajeActivoId(viaje.id);

      // Navegar según el estado real registrado en Supabase.
      if (viaje.estado === "buscando") {
        router.push("/buscando-conductor");
      } else {
        router.push("/viaje-activo");
      }

    } catch (error) {
      console.warn("Error al recuperar el viaje:", error);

      Alert.alert(
        "No se pudo recuperar tu viaje",
        "Verifica tu conexión a internet e inténtalo nuevamente."
      );
    } finally {
      setAbriendoViaje(false);
    }
  };

  const destinosFrecuentes = useMemo(() => {
    const guardadas = perfil?.preferencias?.direcciones || [];

    const direccionesValidas = guardadas.filter((d) => {
      const coordenadas = d.coordenadas;

      return (
        coordenadas != null &&
        typeof coordenadas.latitude === "number" &&
        typeof coordenadas.longitude === "number" &&
        Number.isFinite(coordenadas.latitude) &&
        Number.isFinite(coordenadas.longitude) &&
        Math.abs(coordenadas.latitude) <= 90 &&
        Math.abs(coordenadas.longitude) <= 180
      );
    });

    if (direccionesValidas.length > 0) {
      return direccionesValidas.slice(0, 3).map((d) => ({
        nombre: d.nombre,
        detalle: d.direccion,
        icono: (
          (d.icono || "location").replace("-outline", "")
        ) as keyof typeof Ionicons.glyphMap,
        coordenadas: d.coordenadas!,
        esGuardado: true,
      }));
    }
    
    return [
      { nombre: "Casa", detalle: "Toca para agregar", icono: "home" as const, coordenadas: null, esGuardado: false },
      { nombre: "Trabajo", detalle: "Toca para agregar", icono: "briefcase" as const, coordenadas: null, esGuardado: false },
      { nombre: "Universidad", detalle: "Toca para agregar", icono: "school" as const, coordenadas: null, esGuardado: false },
    ];
  }, [perfil]);

  const seleccionarDestinoFrecuente = (item: (typeof destinosFrecuentes)[number]) => {
    if (item.esGuardado && item.coordenadas) {
      setDestino({
        id: `frecuente-${item.nombre}`,
        nombre: item.nombre,
        detalle: item.detalle,
        coordenadas: item.coordenadas,
      });
      router.push("/confirmar-viaje");
    } else {
      router.push("/cuenta/direcciones");
    }
  };

  const irADestino = () => {
    router.push("/destino");
  };

  const solicitarMototaxi = () => {
    router.push(destino ? "/confirmar-viaje" : "/destino");
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {/* Cabecera */}
        <CabeceraPasajero
          titulo={nombre ? `Hola, ${nombre} 👋` : "Hola 👋"}
          subtitulo="¿A dónde te llevamos hoy?"
          paddingInferior={72}
          hayNotificaciones={hayNoLeidas}
        />

        {/* Origen y destino */}
        <View
          style={[
            styles.tarjetaRuta,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <View style={styles.filaOrigen}>
            <View
              style={[
                styles.iconoOrigen,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <Ionicons
                name="radio-button-on"
                size={20}
                color={colores.exitoTexto}
              />
            </View>

            <View style={styles.textoOrigen}>
              <Text style={[styles.origenTitulo, { color: colores.texto }]}>
                Tu ubicación actual
              </Text>
              <Text
                style={[styles.origenDetalle, { color: colores.secundario }]}
              >
                Bagua, Amazonas
              </Text>
            </View>

            <View
              style={[
                styles.botonIntercambio,
                { backgroundColor: colores.campo },
              ]}
            >
              <Ionicons
                name="swap-vertical"
                size={18}
                color={colores.secundario}
              />
            </View>
          </View>

          <Pressable
            onPress={irADestino}
            style={({ pressed }) => [
              styles.campoDestino,
              { backgroundColor: colores.campo },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name="location-sharp"
              size={20}
              color={destino ? colores.error : colores.secundario}
            />
            <Text
              style={[
                styles.campoDestinoTexto,
                { color: destino ? colores.texto : colores.secundario },
                destino && styles.campoDestinoElegido,
              ]}
              numberOfLines={1}
            >
              {destino ? destino.nombre : "¿A dónde vamos?"}
            </Text>

            {destino && (
              <Pressable onPress={() => setDestino(null)} hitSlop={10}>
                <Ionicons
                  name="close-circle"
                  size={22}
                  color={colores.secundario}
                />
              </Pressable>
            )}
          </Pressable>
        </View>
        
        {/* Tarjeta de viaje activo */}
        {verificandoViajeActivo ? (
          <View
            style={[
              styles.tarjetaContinuar,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            <Text style={{ color: colores.secundario }}>Verificando tus viajes activos...</Text>
          </View>
        ) : viajeActivoId ? (
          <Pressable
            onPress={() => void continuarViaje()}
            disabled={abriendoViaje}
            style={[
              styles.tarjetaContinuar,
              {
                backgroundColor: colores.exitoFondo,
                borderColor: colores.primario,
                opacity: abriendoViaje ? 0.6 : 1,
              },
            ]} 
          >
            <Ionicons
              name="car-sport-outline"
              size={26}
              color={colores.exitoTexto}
            />

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colores.exitoTexto,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                Tienes un viaje activo
              </Text>

              <Text
                style={{
                  color: colores.secundario,
                  fontSize: 13,
                  marginTop: 3,
                }}
              >
                {abriendoViaje
                  ? "Recuperando tu solicitud..."
                  : "Toca aquí para continuar tu viaje"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={colores.exitoTexto}
            />
          </Pressable>
        ): null}

        {/* Mapa */}
        <MapaBase
          centro={CENTRO_BAGUA}
          origen={destino ? ORIGEN_EJEMPLO.coordenadas : undefined}
          destino={destino?.coordenadas}
          conductores={CONDUCTORES_CERCANOS}
          interactivo={false}
          style={styles.mapa}
        />

        {/* Tipo de servicio */}
        <View style={styles.servicios}>
          {SERVICIOS.map((servicio) => {
            const seleccionado = servicio.id === tipoServicio;

            return (
              <Pressable
                key={servicio.id}
                onPress={() => setTipoServicio(servicio.id)}
                style={[
                  styles.servicio,
                  {
                    backgroundColor: seleccionado
                      ? colores.exitoFondo
                      : colores.superficie,
                    borderColor: seleccionado
                      ? colores.primario
                      : colores.linea,
                  },
                ]}
              >
                {servicio.icono(
                  seleccionado ? colores.exitoTexto : colores.secundario
                )}
                <Text
                  style={[
                    styles.servicioTitulo,
                    {
                      color: seleccionado
                        ? colores.exitoTexto
                        : colores.texto,
                    },
                  ]}
                >
                  {servicio.titulo}
                </Text>
                <Text
                  style={[
                    styles.servicioDescripcion,
                    { color: colores.secundario },
                  ]}
                >
                  {servicio.descripcion}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Destinos frecuentes */}
        <View style={styles.encabezadoSeccion}>
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
            Destinos frecuentes
          </Text>
          <Pressable onPress={irADestino} hitSlop={8}>
            <Text style={[styles.verTodos, { color: colores.exitoTexto }]}>
              Ver todos ›
            </Text>
          </Pressable>
        </View>

        <View style={styles.frecuentes}>
          {destinosFrecuentes.map((item) => (
            <Pressable
              key={item.nombre}
              onPress={() => seleccionarDestinoFrecuente(item)}
              style={[
                styles.frecuente,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.linea,
                },
              ]}
            >
              <Ionicons
                name={item.icono}
                size={22}
                color={colores.exitoTexto}
              />
              <View style={styles.frecuenteTextos}>
                <Text
                  style={[styles.frecuenteNombre, { color: colores.texto }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {item.nombre}
                </Text>
                <Text
                  style={[
                    styles.frecuenteDetalle,
                    { color: colores.secundario },
                  ]}
                  numberOfLines={2}
                >
                  {item.detalle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Mensaje de seguridad */}
        <View
          style={[
            styles.seguridad,
            {
              backgroundColor: esOscuro ? colores.superficie : COLOR_CABECERA,
              borderColor: colores.linea,
              borderWidth: esOscuro ? 1 : 0,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={38}
            color={colores.exitoTexto}
          />
          <View style={styles.seguridadTextos}>
            <Text style={[styles.seguridadTitulo, { color: esOscuro ? colores.texto : "#FFFFFF" }]}>
              Viaja más seguro en Bagua
            </Text>
            <Text
              style={[
                styles.seguridadDetalle,
                { color: esOscuro ? colores.secundario : "rgba(255, 255, 255, 0.8)" },
              ]}
            >
              Conductores verificados y de confianza
            </Text>
          </View>
        </View>

        <BotonPrincipal
          titulo="Solicitar mototaxi"
          onPress={solicitarMototaxi}
          estilo={styles.botonSolicitar}
        />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  contenido: {
    paddingBottom: 24,
  },

  tarjetaRuta: {
    marginTop: -52,
    marginHorizontal: 16,
    padding: 14,
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
  },

  filaOrigen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },

  iconoOrigen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  textoOrigen: {
    flex: 1,
  },

  origenTitulo: {
    fontSize: 15,
    fontWeight: "700",
  },

  origenDetalle: {
    fontSize: 13,
  },

  botonIntercambio: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  campoDestino: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  campoDestinoTexto: {
    flex: 1,
    fontSize: 16,
  },

  campoDestinoElegido: {
    fontWeight: "700",
  },

  mapa: {
    height: 190,
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
  },

  servicios: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginHorizontal: 16,
  },

  servicio: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },

  servicioTitulo: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
  },

  servicioDescripcion: {
    fontSize: 12,
    lineHeight: 16,
  },

  encabezadoSeccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginHorizontal: 16,
  },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
  },

  verTodos: {
    fontSize: 14,
    fontWeight: "700",
  },

  frecuentes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginHorizontal: 16,
  },

  frecuente: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  frecuenteTextos: {
    alignSelf: "stretch",
  },

  frecuenteNombre: {
    fontSize: 14,
    fontWeight: "700",
  },

  frecuenteDetalle: {
    fontSize: 11,
    lineHeight: 15,
  },

  seguridad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
  },

  seguridadTextos: {
    flex: 1,
  },

  seguridadTitulo: {
    fontSize: 16,
    fontWeight: "800",
  },

  seguridadDetalle: {
    marginTop: 2,
    fontSize: 13,
  },

  botonSolicitar: {
    width: "auto",
    marginTop: 16,
    marginHorizontal: 16,
  },

  tarjetaContinuar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
});
