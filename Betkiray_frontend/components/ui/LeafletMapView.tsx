import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

interface LeafletMapViewProps {
  latitude: number;
  longitude: number;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  interactive?: boolean;
  style?: any;
}

const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  interactive = true,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [mapUri, setMapUri] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Generate the HTML with current implementation (Satellite + Labels)
  const getHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #f0f0f0; }
          #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${latitude}, ${longitude}], 16);
          
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
          }).addTo(map);

          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
          }).addTo(map);

          var marker = L.marker([${latitude}, ${longitude}], {
            draggable: ${interactive}
          }).addTo(map);

          window.updateMap = function(lat, lng) {
            var newLatLng = new L.LatLng(lat, lng);
            marker.setLatLng(newLatLng);
            map.panTo(newLatLng);
          };

          if (${interactive}) {
            map.on('click', function(e) {
              marker.setLatLng(e.latlng);
              sendMessage(e.latlng.lat, e.latlng.lng);
            });

            marker.on('dragend', function(e) {
              var position = marker.getLatLng();
              sendMessage(position.lat, position.lng);
            });
          }

          function sendMessage(lat, lng) {
             if (window.ReactNativeWebView) {
               window.ReactNativeWebView.postMessage(JSON.stringify({
                 type: 'locationSelected',
                 latitude: lat,
                 longitude: lng
               }));
             }
          }
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    const prepareMap = async () => {
      try {
        const html = getHtml();
        const filename = 'map_v1.html';
        const fileUri = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, html);
        setMapUri(fileUri);
      } catch (error) {
        console.error('Error saving map HTML:', error);
      }
    };
    prepareMap();
  }, []);

  // Update logic needs to check if WebView is ready
  useEffect(() => {
    if (isMapLoaded && webViewRef.current) {
      const script = `
        try {
          if (window.updateMap) {
            window.updateMap(${latitude}, ${longitude});
          }
        } catch(e) { console.error(e); }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [latitude, longitude, isMapLoaded]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected' && onLocationSelect) {
        onLocationSelect(data.latitude, data.longitude);
      }
    } catch (e) {
      console.error('Error parsing map message', e);
    }
  };

  if (!mapUri) {
    return (
      <View style={[styles.container, style, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#FF5C5C" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: mapUri }}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        onMessage={handleMessage}
        onLoadEnd={() => setIsMapLoaded(true)}
        style={{ flex: 1, opacity: 0.99 }} // Opacity hack for Android
        androidLayerType="software"
        mixedContentMode="always"
      />
      {!isMapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF5C5C" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
});

export default LeafletMapView;
