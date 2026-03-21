import * as SecureStore from 'expo-secure-store';
import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Inscription d'un nouvel utilisateur.
 * Stocke le token Sanctum dans le secure storage du téléphone.
 */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/register', {
    name,
    email,
    password,
    password_confirmation: password,
  });
  await SecureStore.setItemAsync('auth_token', data.token);
  return data;
}

/**
 * Connexion d'un utilisateur existant.
 * Stocke le token Sanctum dans le secure storage du téléphone.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/login', { email, password });
  await SecureStore.setItemAsync('auth_token', data.token);
  return data;
}

/**
 * Déconnexion : supprime le token côté backend ET téléphone.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/logout');
  } finally {
    await SecureStore.deleteItemAsync('auth_token');
  }
}

/**
 * Récupère le profil de l'utilisateur connecté.
 */
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/me');
  return data;
}

/**
 * Vérifie si un token est stocké localement.
 */
export async function hasToken(): Promise<boolean> {
  const token = await SecureStore.getItemAsync('auth_token');
  return token !== null;
}
