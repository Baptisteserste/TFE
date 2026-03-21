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

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/login', { email, password });
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/register', {
    name,
    email,
    password,
    password_confirmation: password,
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/logout');
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/me');
  return data;
}

export function hasToken(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') !== null;
  }
  return false;
}
