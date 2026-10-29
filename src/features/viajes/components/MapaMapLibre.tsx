import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import type { MapaBaseProps, PuntoMapa } from "@/features/viajes/types/tiposMapa";

const ZOOM_INICIAL = 15;

// OpenStreetMap bloquea las peticiones sin "Referer". Con baseUrl el WebView
// trata la página como si viniera de esta dirección y lo envía.
const URL_BASE = "https://altokke.app/";

// Página web con MapLibre (mapa vectorial de OpenFreeMap, sin clave).
// OJO: MapLibre usa [longitud, latitud], al revés que nuestro PuntoMapa.
function crearHtml(centro: PuntoMapa, colorPrimario: string, colorError: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <style>
    html, body, #mapa { margin: 0; height: 100%; background: #EAF0EC; }
    .halo { width: 56px; height: 56px; border-radius: 28px; display: flex;
      align-items: center; justify-content: center; background: rgba(47, 174, 115, 0.22); }
    .punto { width: 14px; height: 14px; border-radius: 10px; border: 3px solid #FFFFFF;
      background: ${colorPrimario}; }
    .halo-gps { width: 42px; height: 42px; border-radius: 21px; display: flex;
      align-items: center; justify-content: center; background: rgba(37, 99, 235, 0.15); }
    .punto-gps { width: 10px; height: 10px; border-radius: 8px; border: 3px solid #FFFFFF;
      background: #2563EB; }
    .moto { width: 26px; height: 26px; border-radius: 15px; display: flex;
      align-items: center; justify-content: center; font-size: 15px;
      background: #2FAE73; border: 2px solid #FFFFFF; }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script>
    function avisar(mensaje) {
      window.ReactNativeWebView.postMessage(JSON.stringify(mensaje));
    }

    function crearElemento(clase, interior) {
      const elemento = document.createElement("div");
      elemento.className = clase;
      if (interior) elemento.appendChild(interior);
      return elemento;
    }

    const mapa = new maplibregl.Map({
      container: "mapa",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [${centro.longitude}, ${centro.latitude}],
      zoom: ${ZOOM_INICIAL},
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapa.touchZoomRotate.disableRotation();

    let cargado = false;
    let datosPendientes = null;
    let interactivo = true;
    let ultimoEncuadre = "";
    let marcadores = [];

    function aLngLat(punto) {
      return [punto.longitude, punto.latitude];
    }

    function agregarMarcador(punto, opciones) {
      const marcador = new maplibregl.Marker(opciones).setLngLat(aLngLat(punto)).addTo(mapa);
      marcadores.push(marcador);
    }

    // React Native llama a esta función cada vez que cambian las props
    window.actualizar = function (datos) {
      if (!cargado) {
        datosPendientes = datos;
        return;
      }

      interactivo = datos.interactivo;
      const gestos = [mapa.dragPan, mapa.scrollZoom, mapa.touchZoomRotate, mapa.doubleClickZoom];
      gestos.forEach(function (gesto) {
        if (interactivo) gesto.enable();
        else gesto.disable();
      });
      mapa.touchZoomRotate.disableRotation();

      // Equivale al mapPadding de Google: el panel tapa la parte de abajo
      mapa.setPadding({ top: 0, left: 0, right: 0, bottom: datos.margenInferior });
      document.querySelector(".maplibregl-ctrl-bottom-right").style.bottom =
        datos.margenInferior + "px";

      marcadores.forEach(function (marcador) { marcador.remove(); });
      marcadores = [];

      datos.conductores.forEach(function (conductor) {
        const moto = crearElemento("moto");
        moto.textContent = "🛺";
        agregarMarcador(conductor, { element: moto });
      });

      if (datos.destino) {
        agregarMarcador(datos.destino, { color: "${colorError}" });
      }

      // Punto de recojo
      agregarMarcador(datos.origen || datos.centro, {
        element: crearElemento("halo", crearElemento("punto")),
      });

      // Ubicación GPS actual del pasajero
      if (datos.ubicacionActual) {
        agregarMarcador(datos.ubicacionActual, {
          element: crearElemento("halo-gps", crearElemento("punto-gps")),
        });
      }

      const ruta = datos.ruta && datos.ruta.length > 1 ? datos.ruta.map(aLngLat) : [];
      mapa.getSource("ruta").setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: ruta },
      });

      // Cuando hay origen y destino, se encuadra la ruta completa (solo si cambiaron)
      if (datos.origen && datos.destino) {
        const encuadre = JSON.stringify([datos.origen, datos.destino]);
        if (encuadre !== ultimoEncuadre) {
          ultimoEncuadre = encuadre;
          const limites = new maplibregl.LngLatBounds(aLngLat(datos.origen), aLngLat(datos.origen))
            .extend(aLngLat(datos.destino));
          mapa.fitBounds(limites, {
            padding: { top: 70, right: 60, bottom: 70, left: 60 },
            maxZoom: 16,
          });
        }
      }
    };

    window.centrar = function (punto) {
      mapa.easeTo({ center: aLngLat(punto), zoom: ${ZOOM_INICIAL}, duration: 400 });
    };

    mapa.on("load", function () {
      mapa.addSource("ruta", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });
      mapa.addLayer({
        id: "ruta",
        type: "line",
        source: "ruta",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "${colorPrimario}", "line-width": 5 },
      });

      cargado = true;
      if (datosPendientes) window.actualizar(datosPendientes);
      avisar({ tipo: "listo" });
    });

    // Mantener presionado medio segundo sin mover el dedo = seleccionar punto
    let temporizador = null;
    let inicioToque = null;

    function cancelarPresion() {
      clearTimeout(temporizador);
      temporizador = null;
    }

    mapa.on("touchstart", function (evento) {
      cancelarPresion();
      if (!interactivo || evento.originalEvent.touches.length !== 1) return;

      inicioToque = evento.point;
      const lugar = evento.lngLat;
      temporizador = setTimeout(function () {
        avisar({ tipo: "puntoSeleccionado", latitude: lugar.lat, longitude: lugar.lng });
      }, 500);
    });

    mapa.on("touchmove", function (evento) {
      if (inicioToque && evento.point.dist(inicioToque) > 10) cancelarPresion();
    });
    mapa.on("touchend", cancelarPresion);
    mapa.on("touchcancel", cancelarPresion);
    mapa.on("movestart", cancelarPresion);
  </script>
</body>
</html>`;
}

export function MapaMapLibre({
  centro,
  origen,
  ubicacionActual,
  onSeleccionarPunto,
  destino,
  ruta,
  conductores = [],
  interactivo = true,
  margenInferior = 0,
  style,
}: MapaBaseProps) {
  const { colores } = useAltokkeTheme();
  const webviewRef = useRef<WebView>(null);
  const [listo, setListo] = useState(false);
  const posicionPasajero = ubicacionActual ?? origen ?? centro;

  // El HTML se crea una sola vez: si cambiara, el WebView recargaría todo el mapa.
  // Los cambios posteriores se envían con injectJavaScript.
  const [html] = useState(() => crearHtml(centro, colores.primario, colores.error));

  const datos = JSON.stringify({
    centro,
    origen,
    ubicacionActual,
    destino,
    ruta,
    conductores,
    interactivo,
    margenInferior,
  });

  useEffect(() => {
    if (!listo) return;

    webviewRef.current?.injectJavaScript(`window.actualizar(${datos}); true;`);
  }, [listo, datos]);

  const centrarEnPasajero = () => {
    webviewRef.current?.injectJavaScript(
      `window.centrar(${JSON.stringify(posicionPasajero)}); true;`,
    );
  };

  const recibirMensaje = (evento: WebViewMessageEvent) => {
    const mensaje = JSON.parse(evento.nativeEvent.data);

    if (mensaje.tipo === "listo") {
      setListo(true);
    } else if (mensaje.tipo === "puntoSeleccionado" && interactivo) {
      onSeleccionarPunto?.({
        latitude: mensaje.latitude,
        longitude: mensaje.longitude,
      });
    }
  };

  return (
    <View style={[styles.contenedor, style]}>
      <WebView
        ref={webviewRef}
        source={{ html, baseUrl: URL_BASE }}
        originWhitelist={["*"]}
        onMessage={recibirMensaje}
        overScrollMode="never"
        // Dentro de un ScrollView, deja que el dedo mueva el mapa y no la página
        nestedScrollEnabled
        style={styles.webview}
      />

      <Pressable
        style={[
          styles.botonCentrar,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
        onPress={centrarEnPasajero}
      >
        <Ionicons name="locate" size={22} color={colores.primario} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    overflow: "hidden",
    backgroundColor: "#EAF0EC",
  },

  webview: {
    flex: 1,
    backgroundColor: "#EAF0EC",
  },

  botonCentrar: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
});
