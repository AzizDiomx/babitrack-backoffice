'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Importation dynamique du composant Map sans rendu côté serveur (SSR)
// pour éviter les erreurs d'accès à la variable globale 'window' (spécifique à Leaflet)
const LazyMap = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#121212] border border-zinc-800 rounded-3xl animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-zinc-400">Chargement de la carte...</span>
      </div>
    </div>
  ),
});

export default function DynamicMap() {
  return <LazyMap />;
}
