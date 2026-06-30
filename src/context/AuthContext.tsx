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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Charger le token et les données utilisateur depuis le localStorage
    const savedToken = localStorage.getItem('babitrack_admin_token');
    const savedUser = localStorage.getItem('babitrack_admin_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (telephone: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { telephone, password });
      const { accessToken, user: userData } = response.data;

      // Vérifier que le rôle est bien ADMIN ou SUPER_ADMIN
      if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
        throw new Error("Accès refusé. Cette interface est réservée aux administrateurs.");
      }

      localStorage.setItem('babitrack_admin_token', accessToken);
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

  const logout = () => {
    localStorage.removeItem('babitrack_admin_token');
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
