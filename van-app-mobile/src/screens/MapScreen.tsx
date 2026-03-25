import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { createTrip, updateTrip, sendLocationBatch, uploadMedia, getMedias, Trip, LocationPoint, Media } from '../services/tripService';

const BACKGROUND_LOCATION_TASK = 'VANAPP_BACKGROUND_LOCATION';

// Stockage partagé entre la tâche de fond et le composant
let _backgroundBuffer: LocationPoint[] = [];
let _backgroundTripId: number | null = null;
let _backgroundFlushTimeout: ReturnType<typeof setTimeout> | null = null;

// Envoie les points GPS en batch et vide le buffer
async function flushBackgroundBuffer() {
  if (!_backgroundTripId || _backgroundBuffer.length === 0) return;
  const points = [..._backgroundBuffer];
  _backgroundBuffer = [];
  try {
    await sendLocationBatch(_backgroundTripId, points);
  } catch {
    _backgroundBuffer = [...points, ..._backgroundBuffer];
  }
}

// Définition de la tâche de fond (doit être au top-level du module)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }: any) => {
  if (error) return;
  if (data?.locations) {
    for (const loc of data.locations) {
      _backgroundBuffer.push({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        speed: loc.coords.speed ?? undefined,
        timestamp: new Date(loc.timestamp).toISOString(),
        source: 'mobile',
      });
    }
    // Flush toutes les 15 secondes
    if (!_backgroundFlushTimeout) {
      _backgroundFlushTimeout = setTimeout(() => {
        flushBackgroundBuffer();
        _backgroundFlushTimeout = null;
      }, 15000);
    }
  }
});

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [photoMarkers, setPhotoMarkers] = useState<Media[]>([]);
  const [noteText, setNoteText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Références pour le voyage actif et le buffer GPS
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const activeTrip = useRef<Trip | null>(null);
  const locationBuffer = useRef<LocationPoint[]>([]);
  const flushInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Au démarrage : demande permission GPS (avant + arrière-plan) et centre la carte
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status: fg } = await Location.requestForegroundPermissionsAsync();
        if (fg !== 'granted') {
          if (isMounted) setErrorMsg('Permission GPS refusée.');
          return;
        }
        // Demande la permission arrière-plan
        await Location.requestBackgroundPermissionsAsync();

        let currentLocation = await Location.getLastKnownPositionAsync({});
        if (!currentLocation) {
          currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }
        if (isMounted && currentLocation) setLocation(currentLocation);
      } catch {
        if (isMounted) setErrorMsg('Activez la localisation de votre appareil.');
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // 2. Gestion du tracking GPS + envoi vers le backend
  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => {
      // Le cleanup useEffect doit être synchrone (pas de return Promise)
      stopTracking();
    };
  }, [isTracking]);

  const startTracking = async () => {
    try {
      const trip = await createTrip(`Voyage du ${new Date().toLocaleDateString('fr-BE')}`);
      activeTrip.current = trip;
      _backgroundTripId = trip.id;
      _backgroundBuffer = [];
      setRouteCoordinates([]);

      // Flush batch toutes les 10 secondes côté foreground
      flushInterval.current = setInterval(flushBackgroundBuffer, 10000);

      // Démarrage du tracking en avant-plan (pour la carte live)
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (newLocation) => {
          setLocation(newLocation);
          setRouteCoordinates((prev) => [...prev, {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          }]);
        },
      );

      // Démarrage du tracking en arrière-plan
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 5,
        foregroundService: {
          notificationTitle: '🚐 VanApp — Voyage en cours',
          notificationBody: 'Votre trajet est enregistré en arrière-plan.',
          notificationColor: '#007BFF',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer le voyage. Vérifie ta connexion.');
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    try {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      if (flushInterval.current) {
        clearInterval(flushInterval.current);
        flushInterval.current = null;
      }
      // Arrête la tâche de fond
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
      // Envoie les derniers points restants
      await flushBackgroundBuffer();
      _backgroundTripId = null;
      if (activeTrip.current) {
        await updateTrip(activeTrip.current.id, {
          status: 'completed',
          end_date: new Date().toISOString().split('T')[0],
        });
        activeTrip.current = null;
      }
    } catch (e) {
      console.warn("Erreur lors de l'arrêt du voyage", e);
    }
  };

  const flushBuffer = async () => {
    await flushBackgroundBuffer();
  };

  const toggleTracking = () => setIsTracking((prev) => !prev);

  const handleTakePhoto = async () => {
    if (!activeTrip.current || !location) return;

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', "L'acces a l'appareil photo est necessaire.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        Alert.alert('Envoi en cours', 'Photo en cours de transfert vers Railway...');
        const uploaded = await uploadMedia(
          activeTrip.current.id, 
          result.assets[0].uri, 
          location.coords.latitude, 
          location.coords.longitude
        );
        // Ajoute la photo comme marqueur sur la carte
        if (uploaded) {
          setPhotoMarkers(prev => [...prev, uploaded]);
        }
        Alert.alert('Succes', 'Photo integree a votre carnet !');
      }
    } catch (e: any) {
      Alert.alert('Erreur', "Impossible denvoyer la photo : " + e.message);
    }
  };

  const handleAddNote = async () => {
    if (!activeTrip.current || !location) return;
    if (!noteText.trim()) {
      Alert.alert('Note vide', 'Ecris quelque chose avant de sauvegarder !');
      return;
    }
    try {
      const saved = await uploadMedia(
        activeTrip.current.id,
        '', // pas d'image
        location.coords.latitude,
        location.coords.longitude,
        noteText.trim(),
      );
      if (saved) setPhotoMarkers(prev => [...(prev || []), saved]);
      setNoteText('');
      setShowNoteModal(false);
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la note.');
    }
  };

  if (!location) {
    return (
      <View style={styles.centered}>
        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Recherche du signal GPS...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
      >
        <Polyline coordinates={routeCoordinates} strokeColor="#FF3B30" strokeWidth={5} />
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Mon Van"
        />
        {/* Marqueurs photo */}
        {photoMarkers.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}
            title="📸 Photo"
            description={photo.description || new Date(photo.created_at).toLocaleTimeString('fr-FR')}
            pinColor="#34C759"
          />
        ))}
      </MapView>

      {/* Indicateur de voyage actif */}
      {isTracking && activeTrip.current && (
        <View style={styles.tripBadge}>
          <Text style={styles.tripBadgeText}>
            🔴 En route · {routeCoordinates.length} pts
          </Text>
        </View>
      )}

      {/* Floating buttons */}
      <View style={styles.floatingButtonsContainer}>
        {isTracking && activeTrip.current && (
          <>
            <TouchableOpacity style={styles.noteButton} onPress={() => setShowNoteModal(true)}>
              <Text style={styles.noteIcon}>📝</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
              <Text style={styles.photoIcon}>📸</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Modal saisie de note */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📝 Ajouter une note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Decris cet endroit..."
              placeholderTextColor="#8e8e93"
              value={noteText}
              onChangeText={setNoteText}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowNoteModal(false); setNoteText(''); }}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddNote}>
                <Text style={styles.modalSaveText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.uiContainer}>
        <TouchableOpacity
          style={[styles.button, isTracking ? styles.buttonStop : styles.buttonStart]}
          onPress={toggleTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? '🛑 Arrêter le voyage' : '▶️ Démarrer le voyage'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingText: { marginTop: 15, fontSize: 16, color: '#fff', fontWeight: '500' },
  errorText: { color: '#D8000C', fontSize: 16, padding: 20, textAlign: 'center' },
  tripBadge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tripBadgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  uiContainer: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonStart: { backgroundColor: '#007BFF' },
  buttonStop: { backgroundColor: '#FF3B30' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  floatingButtonsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    alignItems: 'flex-end',
  },
  photoButton: {
    backgroundColor: '#34C759',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  photoIcon: { fontSize: 26 },
  noteButton: {
    backgroundColor: '#5856D6',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 10,
  },
  noteIcon: { fontSize: 26 },
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
  noteInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
  },
  modalCancelText: { color: '#8e8e93', fontWeight: '700' },
  modalSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#5856D6',
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
