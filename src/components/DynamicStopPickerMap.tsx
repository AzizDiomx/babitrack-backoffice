'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const LazyStopPickerMap = dynamic(() => import('./StopPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center bg-zinc-950 border border-zinc-800 rounded-2xl animate-pulse">
      <span className="text-xs font-semibold text-zinc-500">Chargement de la carte interactive d'arrêts...</span>
    </div>
  ),
});

export default function DynamicStopPickerMap(props: any) {
  return <LazyStopPickerMap {...props} />;
}
