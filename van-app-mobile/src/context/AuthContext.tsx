import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hasToken, getMe, logout as authLogout, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au démarrage, vérifie si un token existe et charge le profil
  useEffect(() => {
    (async () => {
      try {
        const tokenExists = await hasToken();
        if (tokenExists) {
          const me = await getMe();
          setUser(me);
        }
      } catch {
        // Token invalide ou expiré → on reste déconnecté
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
}
