
import { CabeceraPasajero } from "@/features/pasajeros/components/CabeceraPasajero";
import { IconoMototaxi } from "@/features/viajes/components/IconoMototaxi";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { BotonPrincipal } from "@/shared/components/ui/BotonPrincipal";
import {
  CENTRO_BAGUA,
  ORIGEN_EJEMPLO,
} from "@/features/viajes/constants/pasajero";
import { useViajeStore, type TipoServicio } from "@/features/viajes/store/viajeStore";
import { useNotificaciones } from "@/features/notificaciones/context/NotificacionesContext";
import { useNombrePasajero } from "@/features/pasajeros/hooks/use-nombre-pasajero";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { viajeService } from "@/features/viajes/services/viajeService";

const SERVICIOS: {
  id: TipoServicio;
  titulo: string;
  descripcion: string;
}[] = [
  {
    id: "normal",
    titulo: "Normal",
    descripcion: "Económico y confiable",
  },
  {
    id: "express",
    titulo: "Express",
    descripcion: "Llegas más rápido",
  },
  {
    id: "reserva",
    titulo: "Reserva",
    descripcion: "Proximamente",
  },
];

export default function PantallaMapa() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { hayNoLeidas } = useNotificaciones();
  const nombre = useNombrePasajero();
  const { perfil } = usePerfilPasajero();

  const tipoServicio = useViajeStore((s) => s.tipoServicio);
  const setTipoServicio = useViajeStore((s) => s.setTipoServicio);
  const origen = useViajeStore((s) => s.origen);
  const destino = useViajeStore((s) => s.destino);
  const ubicacionActual = useViajeStore((s) => s.ubicacionActual);
  const errorUbicacion = useViajeStore((s) => s.errorUbicacion);
  
  const setDestino = useViajeStore((s) => s.setDestino);
  const setOrigen = useViajeStore((s) => s.setOrigen);
  const setMetodoPago = useViajeStore((s) => s.setMetodoPago);

  const viajeActivoId = useViajeStore((s) => s.viajeActivoId);
  const setViajeActivoId = useViajeStore((s) => s.setViajeActivoId);
  const verificandoViajeActivo = useViajeStore((s) => s.verificandoViajeActivo);

  const [abriendoViaje, setAbriendoViaje] = useState(false);

  const hayViajeActivo = Boolean(viajeActivoId);
  const origenConfirmado = origen.id !== ORIGEN_EJEMPLO.id;
  const bloqueandoSolicitud =
    verificandoViajeActivo || abriendoViaje;

  const direccionOrigen = origenConfirmado
    ? origen.detalle || origen.nombre
    : ubicacionActual
      ? "Ubicación GPS disponible"
      : "Selecciona tu punto de recojo";

  const continuarViaje = async () => {
    if (!userId || !viajeActivoId || abriendoViaje || verificandoViajeActivo) {
      return;
    }

    setAbriendoViaje(true);

    try {
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

  const irADestino = () => {
    if (hayViajeActivo) {
      void continuarViaje();
      return;
    }

    if (bloqueandoSolicitud) return;

    router.push("/destino");
  };

  const seleccionarServicio = (servicio: TipoServicio) => {
    if (hayViajeActivo || bloqueandoSolicitud) return;

    if (servicio === "reserva") {
      Alert.alert(
        "Próximamente",
        "La programación de viajes todavía no está disponible. Por ahora puedes solicitar un viaje Normal o Express."
      );
      return;
    }

    setTipoServicio(servicio);
  };

  const seleccionarDestinoFrecuente = (item: (typeof destinosFrecuentes)[number]) => {
    if (hayViajeActivo) {
      void continuarViaje();
      return;
    }

    if (bloqueandoSolicitud) return;

    if (!item.esGuardado || !item.coordenadas) {
      router.push("/cuenta/direcciones");
      return;
    }

    setDestino({
      id: `frecuente-${item.nombre}`,
      nombre: item.nombre,
      detalle: item.detalle,
      coordenadas: item.coordenadas,
    });

    router.push("/confirmar-viaje");
  };

  const solicitarMototaxi = () => {
    if (bloqueandoSolicitud) return;

    if (hayViajeActivo) {
      void continuarViaje();
      return;
    }

    if (tipoServicio === "reserva") {
      Alert.alert(
        "Servicio no disponible",
        "Selecciona Normal o Express para solicitar un mototaxi."
      );
      return;
    }

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
          titulo={nombre ? `Hola, ${nombre} !` : "Hola !"}
          subtitulo="¿A dónde te llevamos hoy?"
          paddingInferior={12}
          hayNotificaciones={hayNoLeidas}
        />

        {/* Origen y destino */}
        <View
          style={[
            styles.tarjetaRuta,
            {
              backgroundColor: colores.superficie,
            },
          ]}
        >
          <View style={styles.filaOrigen}>
            <View style={styles.indicadorOrigen}>
              <View
                style={[
                  styles.puntoOrigen,
                  { backgroundColor: colores.exitoTexto },
                ]}
              />
            </View>

            <View style={styles.textoOrigen}>
              <Text style={[styles.etiquetaUbicacion, { color: colores.secundario }]}>
                PUNTO DE RECOJO
              </Text>

              <Text
                style={[styles.origenDetalle, { color: colores.texto }]}
                numberOfLines={2}
              >
                {direccionOrigen}
              </Text>
            </View>

            <Pressable
              onPress={irADestino}
              disabled={bloqueandoSolicitud}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cambiar punto de recojo"
              style={styles.botonEditar}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={colores.secundario}
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.divisorRuta,
              { backgroundColor: colores.linea },
            ]}
          />

          <Pressable
            onPress={irADestino}
            disabled={bloqueandoSolicitud}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar destino"
            style={({ pressed }) => [
              styles.filaDestino,
              pressed && { opacity: 0.65 },
            ]}
          >
            <View style={styles.indicadorDestino}>
              <Ionicons
                name="location-sharp"
                size={20}
                color={colores.error}
              />
            </View>

            <Text
              style={[
                styles.destinoTexto,
                {
                  color: destino ? colores.texto : colores.secundario,
                },
              ]}
              numberOfLines={1}
            >
              {destino?.nombre || "¿A dónde vamos?"}
            </Text>

            {destino && !hayViajeActivo ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setDestino(null);
                }}
                disabled={bloqueandoSolicitud}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Quitar destino"
              >
                <Ionicons
                  name="close-circle"
                  size={21}
                  color={colores.secundario}
                />
              </Pressable>
            ) : (
              <Ionicons
                name="chevron-forward"
                size={19}
                color={colores.secundario}
              />
            )}
          </Pressable>
        </View>

        {errorUbicacion && !origenConfirmado && (
          <View style={styles.avisoUbicacion}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={colores.secundario}
            />
            <Text
              style={[
                styles.avisoTexto,
                { color: colores.secundario },
              ]}
            >
              {errorUbicacion}
            </Text>
          </View>
        )}
        
        {/* Tarjeta de viaje activo */}
        {verificandoViajeActivo ? (
          <View
            style={[
              styles.viajeActivo,
              {
                backgroundColor: colores.campo
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={colores.exitoTexto}
            />
            <Text style={{ color: colores.secundario }}>Verificando tus viajes activos...</Text>
          </View>
        ) : viajeActivoId ? (
          <Pressable
            onPress={() => void continuarViaje()}
            disabled={abriendoViaje}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.viajeActivo,
              { backgroundColor: colores.exitoFondo },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name="car-sport-outline"
              size={28}
              color={colores.exitoTexto}
            />

            <View style={styles.viajeActivoTextos}>
              <Text
                style={[
                  styles.viajeActivoTitulo,
                  { color: colores.texto },
                ]}
              >
                Tienes un viaje en curso
              </Text>

              <Text
                style={[
                  styles.textoPequeno,
                  { color: colores.secundario },
                ]}
              >
                {abriendoViaje
                  ? "Recuperando tu viaje..."
                  : "Toca para continuar"}
              </Text>
            </View>
            
            {abriendoViaje ? (
              <ActivityIndicator
                color={colores.exitoTexto}
              />
            ) : (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colores.exitoTexto}
              />
            )}
          </Pressable>
        ): null}

        {/* Mapa */}
        <View style={styles.seccionMapa}>
          <MapaBase
            centro={
              ubicacionActual ??
              (origenConfirmado
                ? origen.coordenadas
                : CENTRO_BAGUA)
            }
            origen={
              origenConfirmado
                ? origen.coordenadas
                : undefined
            }
            ubicacionActual={ubicacionActual ?? undefined}
            destino={destino?.coordenadas}
            conductores={[]}
            style={styles.mapa}
          />
        </View>

        {/* Tipo de servicio */}
        <View style={styles.encabezadoServicios}>
          <Text
            style={[
              styles.seccionTitulo,
              { color: colores.texto },
            ]}
          >
            Elige cómo viajar
          </Text>

          <Text
            style={[
              styles.seccionDescripcion,
              { color: colores.secundario },
            ]}
          >
            Selecciona el servicio que prefieras
          </Text>
        </View>

          <View style={styles.servicios}>
            {SERVICIOS.map((servicio) => {
              const seleccionado = servicio.id === tipoServicio;

              return (
                <Pressable
                  key={servicio.id}
                  onPress={() => seleccionarServicio(servicio.id)}
                  disabled={hayViajeActivo || bloqueandoSolicitud}
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
                  <View style={styles.servicioIcono}>
                    {servicio.id === "normal" ? (
                      <IconoMototaxi
                        size={27}
                        color={
                          seleccionado ? colores.exitoTexto : colores.texto
                        }
                      />
                    ) : (
                      <Ionicons
                        name={
                          servicio.id === "express"
                            ? "flash-outline"
                            : "calendar-outline"
                        }
                        size={25}
                        color={
                          seleccionado
                            ? colores.exitoTexto
                            : colores.secundario
                        }
                      />
                    )}
                  </View>

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
                      styles.servicioDetalle,
                      { color: colores.secundario },
                    ]}
                  >
                    {servicio.descripcion}
                  </Text>

                  {servicio.id === "reserva" && (
                  <View
                    style={[
                      styles.etiquetaProximamente,
                      { backgroundColor: colores.campo },
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoProximamente,
                        { color: colores.secundario },
                      ]}
                    >
                      Pronto
                    </Text>
                  </View>
                )}
                </Pressable>
              );
            })}
          </View>

          {/* Destinos frecuentes */}
          <View style={styles.encabezadoFrecuentes}>
            <View style={styles.tituloFrecuentes}>
              <Text
                style={[
                  styles.seccionTitulo,
                  { color: colores.texto },
                ]}
              >
                Destinos frecuentes
              </Text>

              <Text
                style={[
                  styles.seccionDescripcion,
                  { color: colores.secundario },
                ]}
              >
                Tus lugares habituales
              </Text>
            </View>

            <Pressable 
              onPress={() =>
                router.push("/cuenta/direcciones")
              }
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Ver direcciones guardadas"
              style={styles.verTodos}
            >
              <Text
                style={[
                  styles.verTodosTexto,
                  { color: colores.texto },
                ]}
              >
                Ver todos
              </Text>

              <Ionicons
                name="chevron-forward"
                size={15}
                color={colores.secundario}
              />
            </Pressable>
          </View>
          
          <View style={styles.frecuentes}>
            {destinosFrecuentes.map((item) => (
              <Pressable
                key={item.nombre}
                onPress={() =>
                  seleccionarDestinoFrecuente(item)
                }
                disabled={bloqueandoSolicitud}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.frecuente,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.linea,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View
                  style={[
                    styles.frecuenteIcono,
                    {
                      backgroundColor: colores.campo,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icono}
                    size={21}
                    color={colores.texto}
                  />
                </View>

                <Text
                  style={[
                    styles.frecuenteNombre,
                    { color: colores.texto },
                  ]}
                  numberOfLines={1}
                >
                  {item.nombre}
                </Text>

                <Text
                  style={[
                    styles.frecuenteDetalle,
                    { color: colores.secundario },
                  ]}
                  numberOfLines={1}
                >
                  {item.esGuardado
                    ? item.detalle
                    : "Configurar"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Mensaje de seguridad */}
          <View style={styles.seguridad}>
            <View
              style={[
                styles.seguridadIcono,
                { backgroundColor: colores.campo },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={colores.exitoTexto}
              />
            </View>

            <View style={styles.seguridadTextos}>
              <Text
                style={[
                  styles.seguridadTitulo,
                  { color: colores.texto },
                ]}
              >
                Viaja con tranquilidad
              </Text>

              <Text
                style={[
                  styles.seguridadDetalle,
                  { color: colores.secundario },
                ]}
              >
                Revisa los datos de tu conductor antes de viajar.
              </Text>
            </View>
          </View>

          {/* Acción principal */}
          <BotonPrincipal
            titulo={
              verificandoViajeActivo
                ? "Verificando viajes..."
                : hayViajeActivo
                  ? "Continuar mi viaje"
                  : "Solicitar mototaxi"
            }
            onPress={solicitarMototaxi}
            cargando={
              verificandoViajeActivo || abriendoViaje
            }
            disabled={bloqueandoSolicitud}
            mostrarIcono={!bloqueandoSolicitud}
            icono="arrow-forward"
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
    paddingBottom: 28,
  },

  // ORIGEN Y DESTINO

  tarjetaRuta: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
  },

  filaOrigen: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    gap: 10,
  },

  indicadorOrigen: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  puntoOrigen: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  textoOrigen: {
    flex: 1,
    gap: 4,
  },

  etiquetaUbicacion: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  origenDetalle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },

  botonEditar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  divisorRuta: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 34,
  },

  filaDestino: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  indicadorDestino: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  destinoTexto: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  avisoUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginHorizontal: 20,
  },

  avisoTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  // VIAJE ACTIVO

  viajeActivo: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },

  viajeActivoTextos: {
    flex: 1,
    gap: 4,
  },

  viajeActivoTitulo: {
    fontSize: 15,
    fontWeight: "700",
  },

  textoPequeno: {
    fontSize: 12,
  },

  // MAPA

  seccionMapa: {
    marginTop: 16,
    marginHorizontal: 16,
  },

  mapa: {
    height: 238,
    borderRadius: 20,
  },

  // SERVICIOS

  encabezadoServicios: {
    marginTop: 22,
    marginHorizontal: 18,
    gap: 4,
  },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  seccionDescripcion: {
    fontSize: 12,
    lineHeight: 18,
  },

  servicios: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
    marginHorizontal: 16,
  },

  servicio: {
    flex: 1,
    minHeight: 118,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 18,
  },

  servicioIcono: {
    minHeight: 30,
    justifyContent: "center",
    marginBottom: 3,
  },

  servicioTitulo: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  servicioDetalle: {
    fontSize: 11,
    textAlign: "center",
  },

  indicadorSeleccion: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  etiquetaProximamente: {
    position: "absolute",
    top: 8,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  textoProximamente: {
    fontSize: 9,
    fontWeight: "700",
  },

  // LUGARES

  encabezadoFrecuentes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 27,
    marginHorizontal: 18,
  },

  tituloFrecuentes: {
    flex: 1,
    gap: 4,
  },

  verTodos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 10,
    paddingLeft: 8,
  },

  verTodosTexto: {
    fontSize: 13,
    fontWeight: "600",
  },

  frecuentes: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
    marginHorizontal: 16,
  },

  frecuente: {
    flex: 1,
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 7,
    paddingVertical: 12,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
  },

  frecuenteIcono: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  frecuenteNombre: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  frecuenteDetalle: {
    fontSize: 10,
    textAlign: "center",
  },

  // SEGURIDAD

  seguridad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
    marginHorizontal: 18,
    paddingVertical: 12,
  },

  seguridadIcono: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  seguridadTextos: {
    flex: 1,
    gap: 3,
  },

  seguridadTitulo: {
    fontSize: 14,
    fontWeight: "700",
  },

  seguridadDetalle: {
    fontSize: 12,
    lineHeight: 17,
  },

  // BOTÓN PRINCIPAL

  botonSolicitar: {
    marginTop: 22,
    marginHorizontal: 16,
    width: "auto",
    minHeight: 54,
  },
});
