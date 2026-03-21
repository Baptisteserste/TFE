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

export async function getTrips(): Promise<Trip[]> {
  const { data } = await api.get<Trip[]>('/trips');
  return data;
}

export async function createTrip(title: string): Promise<Trip> {
  const { data } = await api.post<Trip>('/trips', {
    title,
    status: 'active',
  });
  return data;
}

export async function updateTrip(
  tripId: number,
  payload: Partial<Pick<Trip, 'title' | 'end_date' | 'status'>>,
): Promise<Trip> {
  const { data } = await api.put<Trip>(`/trips/${tripId}`, payload);
  return data;
}

export async function getLocations(tripId: number): Promise<LocationPoint[]> {
  const { data } = await api.get<LocationPoint[]>(`/trips/${tripId}/locations`);
  return data;
}
