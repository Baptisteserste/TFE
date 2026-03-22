import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ En développement : l'IP 10.0.2.2 est l'alias Android pour localhost.
// Sur un vrai téléphone physique, remplace par ton IP locale (ex: http://192.168.1.x:8000/api)
// En production, on utilise la variable d'environnement
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Intercepteur : ajoute automatiquement le token Bearer à chaque requête
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
