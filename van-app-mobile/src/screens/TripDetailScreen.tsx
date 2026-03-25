import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getLocations, getMedias, updateTrip, LocationPoint, Media, Trip } from '../services/tripService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function generateGpx(trip: Trip, locations: LocationPoint[]): string {
  const points = locations.map(l =>
    `  <trkpt lat="${l.latitude}" lon="${l.longitude}">
    <time>${l.timestamp}</time>${l.speed != null ? `\n    <speed>${l.speed.toFixed(2)}</speed>` : ''}
  </trkpt>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="VanApp" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${trip.title}</name><time>${trip.start_date}</time></metadata>
  <trk>
    <name>${trip.title}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`;
}

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

/** Formule de Haversine : distance en km entre deux coordonnées GPS */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeStats(locations: LocationPoint[], trip: Trip) {
  if (locations.length < 2) return { distanceKm: 0, durationMin: 0, avgSpeedKmh: 0 };

  // Distance totale
  let distanceKm = 0;
  for (let i = 1; i < locations.length; i++) {
    distanceKm += haversineKm(
      locations[i - 1].latitude, locations[i - 1].longitude,
      locations[i].latitude, locations[i].longitude,
    );
  }

  // Durée en minutes
  const start = new Date(locations[0].timestamp).getTime();
  const end = new Date(locations[locations.length - 1].timestamp).getTime();
  const durationMin = Math.round((end - start) / 60000);

  // Vitesse moyenne (km/h)
  const avgSpeedKmh = durationMin > 0 ? Math.round((distanceKm / durationMin) * 60) : 0;

  return { distanceKm: Math.round(distanceKm * 10) / 10, durationMin, avgSpeedKmh };
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

export default function TripDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TripDetailRouteProp>();
  const { trip } = route.params;

  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState(trip.status);
  const [tripTitle, setTripTitle] = useState(trip.title);
  const [completing, setCompleting] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState(trip.title);
  const mapRef = useRef<MapView>(null);

  const handleRename = async () => {
    if (!renameText.trim()) return;
    try {
      await updateTrip(trip.id, { title: renameText.trim() });
      setTripTitle(renameText.trim());
      setShowRenameModal(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de renommer ce voyage.');
    }
  };

  const handleComplete = () => {
    Alert.alert(
      'Terminer le voyage',
      'Marquer ce voyage comme terminé ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer', style: 'destructive',
          onPress: async () => {
            setCompleting(true);
            try {
              const dateStr = new Date().toISOString().split('T')[0];
              await updateTrip(trip.id, {
                status: 'completed',
                end_date: dateStr,
              });
              setTripStatus('completed');
            } catch {
              Alert.alert('Erreur', 'Impossible de terminer ce voyage.');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const handleExportGpx = async () => {
    if (locations.length === 0) {
      Alert.alert('Aucun point GPS', 'Ce voyage ne contient pas encore de points GPS.');
      return;
    }
    try {
      const gpxContent = generateGpx(trip, locations);
      const filename = `vanapp_${trip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
      const fs = FileSystem as any;
      const fileUri = (fs.cacheDirectory ?? fs.documentDirectory ?? '') + filename;
      await FileSystem.writeAsStringAsync(fileUri, gpxContent, { encoding: 'utf8' });
      await Sharing.shareAsync(fileUri, { mimeType: 'application/gpx+xml', dialogTitle: 'Exporter le tracé GPX' });
    } catch {
      Alert.alert('Erreur', "Impossible d'exporter le fichier GPX.");
    }
  };

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
  const stats = computeStats(locations, trip);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>{tripTitle}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => { setRenameText(tripTitle); setShowRenameModal(true); }}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>
            📅 {formatDate(trip.start_date)}
            {tripStatus === 'completed'
              ? (trip.end_date ? `  🏁 ${formatDate(trip.end_date)}` : '  ✅ Terminé')
              : '  🟢 En cours'}
          </Text>
        </View>
        {tripStatus === 'active' && (
          <TouchableOpacity
            style={[styles.completeButton, completing && { opacity: 0.5 }]}
            onPress={handleComplete}
            disabled={completing}
          >
            <Text style={styles.completeButtonText}>🏁 Terminer</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.exportButton} onPress={handleExportGpx}>
          <Text style={styles.exportButtonText}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {loading ? '--' : `${stats.distanceKm}`}
          </Text>
          <Text style={styles.statLabel}>km parcourus</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {loading ? '--' : formatDuration(stats.durationMin)}
          </Text>
          <Text style={styles.statLabel}>Durée</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {loading ? '--' : `${stats.avgSpeedKmh}`}
          </Text>
          <Text style={styles.statLabel}>km/h moy.</Text>
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

      {/* Modal renommer */}
      <Modal visible={showRenameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✏️ Renommer le voyage</Text>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Nom du voyage"
              placeholderTextColor="#8e8e93"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRenameModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleRename}>
                <Text style={styles.modalSaveText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: { padding: 4 },
  editIcon: { fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1 },
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
  completeButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  completeButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  exportButton: {
    padding: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    marginLeft: 6,
  },
  exportButtonText: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  renameInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: '#2a2a3e', alignItems: 'center',
  },
  modalCancelText: { color: '#8e8e93', fontWeight: '700' },
  modalSave: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: '#007BFF', alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '700' },
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
