'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Si on est en train de charger, afficher un écran de chargement
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-zinc-400">Chargement de la session...</span>
        </div>
      </div>
    );
  }

  // Si non authentifié, le middleware s'en occupe, mais faisons un garde fou
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar de gauche */}
      <Sidebar />

      {/* Zone de contenu principale de droite */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-black p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
