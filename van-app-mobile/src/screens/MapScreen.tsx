import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { createTrip, updateTrip, sendLocationBatch, Trip, LocationPoint } from '../services/tripService';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);

  // Références pour le voyage actif et le buffer GPS
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const activeTrip = useRef<Trip | null>(null);
  const locationBuffer = useRef<LocationPoint[]>([]);
  const flushInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Au démarrage : demande la permission GPS et centre la carte
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission refusée pour accéder au GPS.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
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
      // Crée un nouveau voyage sur le backend
      const trip = await createTrip(`Voyage du ${new Date().toLocaleDateString('fr-BE')}`);
      activeTrip.current = trip;
      setRouteCoordinates([]);
      locationBuffer.current = [];

      // Envoi des points GPS en batch toutes les 10 secondes
      flushInterval.current = setInterval(() => {
        flushBuffer();
      }, 10000);

      // Écoute la position GPS
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (newLocation) => {
          const coord = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setLocation(newLocation);
          setRouteCoordinates((prev) => [...prev, coord]);

          // Ajoute au buffer pour l'envoi batch
          locationBuffer.current.push({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            speed: newLocation.coords.speed ?? undefined,
            timestamp: new Date(newLocation.timestamp).toISOString(),
            source: 'mobile',
          });
        },
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer le voyage. Vérifie ta connexion.');
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    // Arrête la subscription GPS
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    // Arrête l'intervalle d'envoi
    if (flushInterval.current) {
      clearInterval(flushInterval.current);
      flushInterval.current = null;
    }
    // Envoie les derniers points restants
    await flushBuffer();
    // Marque le voyage comme terminé
    if (activeTrip.current) {
      await updateTrip(activeTrip.current.id, {
        status: 'completed',
        end_date: new Date().toISOString(),
      });
      activeTrip.current = null;
    }
  };

  // Envoie le buffer de points GPS au backend
  const flushBuffer = async () => {
    if (!activeTrip.current || locationBuffer.current.length === 0) return;
    const points = [...locationBuffer.current];
    locationBuffer.current = [];
    try {
      await sendLocationBatch(activeTrip.current.id, points);
    } catch {
      // Si l'envoi échoue, on remet les points dans le buffer
      locationBuffer.current = [...points, ...locationBuffer.current];
    }
  };

  const toggleTracking = () => setIsTracking((prev) => !prev);

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
      </MapView>

      {/* Indicateur de voyage actif */}
      {isTracking && activeTrip.current && (
        <View style={styles.tripBadge}>
          <Text style={styles.tripBadgeText}>
            🔴 En route · {routeCoordinates.length} pts
          </Text>
        </View>
      )}

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
});
