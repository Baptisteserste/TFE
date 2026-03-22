import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { getTrips, deleteTrip, Trip } from '../services/tripService';
import { useFocusEffect } from '@react-navigation/native';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-BE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: string): { label: string; color: string } {
  if (status === 'active') return { label: '🟢 En cours', color: '#34C759' };
  if (status === 'completed') return { label: '✅ Terminé', color: '#8e8e93' };
  return { label: status, color: '#8e8e93' };
}

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: number) => void }) {
  const { label, color } = statusLabel(trip.status);

  const confirmDelete = () => {
    Alert.alert(
      "Supprimer le voyage",
      "Voulez-vous vraiment supprimer ce voyage ? Toutes les données associées seront perdues.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => onDelete(trip.id) }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{trip.title}</Text>
          <Text style={[styles.statusBadge, { color }]}>{label}</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardDate}>📅 {formatDate(trip.start_date)}</Text>
      {trip.end_date && (
        <Text style={styles.cardDate}>🏁 {formatDate(trip.end_date)}</Text>
      )}
    </View>
  );
}

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = async () => {
    try {
      setError(null);
      const data = await getTrips();
      setTrips(data);
    } catch {
      setError('Impossible de charger les voyages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTrip(id);
      // Met à jour la liste en supprimant l'élément filtré
      setTrips((prevTrips) => prevTrips.filter((t) => t.id !== id));
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer ce voyage.');
    }
  };

  // Recharge la liste à chaque fois que l'onglet est affiché
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTrips();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Voyages</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <TripCard trip={item} onDelete={handleDelete} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007BFF" />}
        contentContainerStyle={trips.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>🚐</Text>
            <Text style={styles.emptyText}>Aucun voyage pour l'instant.</Text>
            <Text style={styles.emptySubtext}>
              Démarre ton premier voyage depuis la carte !
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statusBadge: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  cardDate: { fontSize: 14, color: '#8e8e93', marginTop: 4 },
  deleteButton: {
    padding: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    marginLeft: 10,
  },
  deleteIcon: { fontSize: 18 },
  error: { color: '#FF3B30', textAlign: 'center', marginBottom: 10 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8e8e93', textAlign: 'center', paddingHorizontal: 40 },
});
