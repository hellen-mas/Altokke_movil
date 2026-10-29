import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { MapaBaseProps, PuntoMapa } from "@/features/viajes/types/tiposMapa";

function crearHtml(centro: PuntoMapa) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html, body, #mapa { margin: 0; height: 100%; }</style>
</head>
<body>
  <div id="mapa"></div>
  <script>
    const mapa = L.map("mapa", { zoomControl: false })
      .setView([${centro.latitude}, ${centro.longitude}], 16);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(mapa);
  </script>
</body>
</html>`;
}

export function MapaLeaflet({ centro, style }: MapaBaseProps) {
  return (
    <View style={[styles.contenedor, style]}>
      <WebView
        source={{ html: crearHtml(centro), baseUrl: "https://altokke.app/" }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: "#EAF0EC",
  },
  webview: {
    flex: 1,
  },
});
