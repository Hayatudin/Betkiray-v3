import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface LeafletMapViewProps {
  latitude: number;
  longitude: number;
  onRegionChange?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function LeafletMapView({
  latitude,
  longitude,
  onRegionChange,
  interactive = false
}: LeafletMapViewProps) {

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-control-attribution { font-size: 8px; opacity: 0.6; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], 16);
          
          // 1. Satellite Base Layer (Esri World Imagery)
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
          }).addTo(map);

          // 2. Labels Overlay (Street names on top)
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
             maxZoom: 19
          }).addTo(map);

          // Marker setup
          var marker = L.marker([${latitude}, ${longitude}], { 
            draggable: ${interactive} 
          }).addTo(map);

          ${interactive ? `
            map.on('click', function(e) {
              marker.setLatLng(e.latlng);
              window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
            });

            marker.on('dragend', function(e) {
              var pos = marker.getLatLng();
              window.ReactNativeWebView.postMessage(JSON.stringify({ lat: pos.lat, lng: pos.lng }));
            });
          ` : ''}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        scrollEnabled={false}
        onMessage={(event) => {
          if (onRegionChange) {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              onRegionChange(data.lat, data.lng);
            } catch (e) { }
          }
        }}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} size="small" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
});