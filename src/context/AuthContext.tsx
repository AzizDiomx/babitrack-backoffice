'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

interface User {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  role: string;
  companyId: string;
  company?: {
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (telephone: string, password: string) => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isTokenExpired = (tokenString: string): boolean => {
    try {
      const parts = tokenString.split('.');
      if (parts.length !== 3) return true;
      const payloadBase64 = parts[1];
      
      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const { exp } = JSON.parse(jsonPayload);
      if (!exp) return false;
      
      return exp * 1000 < Date.now();
    } catch (err) {
      console.error('[JWT Decode Error] Failed to decode token:', err);
      return true;
    }
  };

  useEffect(() => {
    // Charger le token et les données utilisateur depuis le localStorage
    const savedToken = localStorage.getItem('babitrack_admin_token');
    const savedUser = localStorage.getItem('babitrack_admin_user');

    if (savedToken && savedUser) {
      if (isTokenExpired(savedToken)) {
        console.warn('[AuthContext] Token expiré ou corrompu détecté au démarrage. Déconnexion...');
        localStorage.removeItem('babitrack_admin_token');
        localStorage.removeItem('babitrack_admin_refresh_token');
        localStorage.removeItem('babitrack_admin_user');
        document.cookie = `babitrack_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        setToken(null);
        setUser(null);
        router.push('/login');
      } else {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, [router]);

  const login = async (telephone: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { telephone, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      // Vérifier que le rôle est bien ADMIN ou SUPER_ADMIN
      if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
        throw new Error("Accès refusé. Cette interface est réservée aux administrateurs.");
      }

      localStorage.setItem('babitrack_admin_token', accessToken);
      localStorage.setItem('babitrack_admin_refresh_token', refreshToken);
      localStorage.setItem('babitrack_admin_user', JSON.stringify(userData));
      document.cookie = `babitrack_admin_token=${accessToken}; path=/; max-age=604800; SameSite=Lax; Secure`;

      setToken(accessToken);
      setUser(userData);
      
      if (userData.role === 'SUPER_ADMIN') {
        router.push('/superadmin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('[Login Error]', error);
      throw error;
    }
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('babitrack_admin_user', JSON.stringify(newUser));
  };

  const logout = () => {
    localStorage.removeItem('babitrack_admin_token');
    localStorage.removeItem('babitrack_admin_refresh_token');
    localStorage.removeItem('babitrack_admin_user');
    document.cookie = `babitrack_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
