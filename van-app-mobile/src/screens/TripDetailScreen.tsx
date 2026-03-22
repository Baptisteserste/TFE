import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getLocations, getMedias, LocationPoint, Media, Trip } from '../services/tripService';

// Types de navigation
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  TripDetail: { trip: Trip };
};

type TripDetailRouteProp = RouteProp<RootStackParamList, 'TripDetail'>;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-BE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function TripDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TripDetailRouteProp>();
  const { trip } = route.params;

  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    Promise.all([
      getLocations(trip.id).then(setLocations),
      getMedias(trip.id).then(setMedias),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [trip.id]);

  // Ajuste le zoom de la carte autour du tracé une fois chargé
  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      const coords = locations.map(l => ({ latitude: l.latitude, longitude: l.longitude }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 40, bottom: 80, left: 40 },
        animated: true,
      });
    }
  }, [locations]);

  const routeCoords = locations.map(l => ({ latitude: l.latitude, longitude: l.longitude }));
  const firstCoord = routeCoords[0];
  const lastCoord = routeCoords[routeCoords.length - 1];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{trip.title}</Text>
          <Text style={styles.headerSub}>
            📅 {formatDate(trip.start_date)}
            {trip.end_date ? `  🏁 ${formatDate(trip.end_date)}` : '  🟢 En cours'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{locations.length}</Text>
          <Text style={styles.statLabel}>Points GPS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{medias.length}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
      </View>

      {/* Carte */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Chargement du tracé...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={firstCoord ? {
            latitude: firstCoord.latitude,
            longitude: firstCoord.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          } : {
            latitude: 50.85045, longitude: 4.34878,
            latitudeDelta: 5, longitudeDelta: 5,
          }}
        >
          {/* Tracé du voyage */}
          {routeCoords.length > 1 && (
            <Polyline coordinates={routeCoords} strokeColor="#FF3B30" strokeWidth={5} />
          )}

          {/* Marqueur de départ */}
          {firstCoord && (
            <Marker coordinate={firstCoord} title="Départ" pinColor="#007BFF" />
          )}

          {/* Marqueur d'arrivée */}
          {lastCoord && routeCoords.length > 1 && (
            <Marker coordinate={lastCoord} title="Arrivée" pinColor="#FF3B30" />
          )}

          {/* Marqueurs de photos */}
          {medias.map((media) => (
            <Marker
              key={`photo-${media.id}`}
              coordinate={{ latitude: media.latitude, longitude: media.longitude }}
              title="📸 Photo"
              description={media.description || formatDate(media.created_at)}
              pinColor="#34C759"
            />
          ))}
        </MapView>
      )}

      {/* Message si aucun point GPS */}
      {!loading && locations.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyText}>Aucun tracé enregistré pour ce voyage.</Text>
        </View>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#8e8e93', fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    paddingVertical: 12,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { color: '#007BFF', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#8e8e93', fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2a2a3e' },
  map: { flex: 1, width, height },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#8e8e93', marginTop: 12, fontSize: 15 },
  emptyOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: '#8e8e93', fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
