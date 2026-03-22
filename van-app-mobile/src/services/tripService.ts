import api from './api';

export interface Trip {
  id: number;
  title: string;
  start_date: string;
  end_date: string | null;
  status: string;
  user_id: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp: string;
  source?: 'mobile' | 'tracker';
}

/**
 * Récupère la liste de tous les voyages de l'utilisateur.
 */
export async function getTrips(): Promise<Trip[]> {
  const { data } = await api.get<Trip[]>('/trips');
  return data;
}

/**
 * Crée un nouveau voyage et retourne l'objet créé (avec son id).
 */
export async function createTrip(title: string): Promise<Trip> {
  const { data } = await api.post<Trip>('/trips', {
    title,
    status: 'active',
  });
  return data;
}

/**
 * Met à jour un voyage (ex : le terminer).
 */
export async function updateTrip(
  tripId: number,
  payload: Partial<Pick<Trip, 'title' | 'end_date' | 'status'>>,
): Promise<Trip> {
  const { data } = await api.put<Trip>(`/trips/${tripId}`, payload);
  return data;
}

/**
 * Envoie un lot de points GPS pour un voyage.
 * Utilise l'endpoint batch pour ne pas spammer le serveur.
 */
export async function sendLocationBatch(
  tripId: number,
  points: LocationPoint[],
): Promise<void> {
  await api.post(`/trips/${tripId}/locations`, { points });
}

/**
 * Récupère tous les points GPS d'un voyage.
 */
export async function getLocations(tripId: number): Promise<LocationPoint[]> {
  const { data } = await api.get<LocationPoint[]>(`/trips/${tripId}/locations`);
  return data;
}

/**
 * Supprime un voyage.
 */
export async function deleteTrip(tripId: number): Promise<void> {
  await api.delete(`/trips/${tripId}`);
}

/**
 * Uploade une photo pour un voyage
 */
export async function uploadMedia(tripId: number, uri: string, latitude: number, longitude: number, description?: string): Promise<any> {
  const formData = new FormData();

  const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  // Astuce TypeScript pour react-native FormData
  formData.append('image', {
    uri,
    name: filename,
    type,
  } as any);

  formData.append('latitude', latitude.toString());
  formData.append('longitude', longitude.toString());
  if (description) {
    formData.append('description', description);
  }

  const { data } = await api.post(`/trips/${tripId}/medias`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}
