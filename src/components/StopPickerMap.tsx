'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Loader2, Maximize2, Minimize2, Layers } from 'lucide-react';

const stopIcon = (order: number, isSelected: boolean) =>
  L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background-color: ${isSelected ? '#f97316' : '#1e293b'};
        color: #ffffff;
        border: 2px solid ${isSelected ? '#ffffff' : '#f97316'};
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
      ">
        ${order}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

interface StopPoint {
  nom: string;
  latitude: number;
  longitude: number;
  ordre: number;
}

interface StopPickerMapProps {
  stops: StopPoint[];
  selectedStopIndex: number | null;
  onSelectStop: (index: number) => void;
  onUpdateStopCoords: (index: number, lat: number, lng: number) => void;
  onAddStopAtCoords: (lat: number, lng: number, name?: string) => void;
}

type MapProvider = 'google-roadmap' | 'google-hybrid' | 'osm';

const MAP_TILE_URLS: Record<MapProvider, { url: string; attribution: string }> = {
  'google-hybrid': {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
  },
  'google-roadmap': {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
};

function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { animate: true });
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [center, map]);
  return null;
}

function MapClickHandler({
  selectedStopIndex,
  onSelectStop,
  onUpdateStopCoords,
  onAddStopAtCoords,
}: {
  selectedStopIndex: number | null;
  onSelectStop: (index: number) => void;
  onUpdateStopCoords: (index: number, lat: number, lng: number) => void;
  onAddStopAtCoords: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (selectedStopIndex !== null) {
        onUpdateStopCoords(selectedStopIndex, parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
      } else {
        onAddStopAtCoords(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
      }
    },
  });
  return null;
}

export default function StopPickerMap({
  stops,
  selectedStopIndex,
  onSelectStop,
  onUpdateStopCoords,
  onAddStopAtCoords,
}: StopPickerMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('google-hybrid');

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    stops.length > 0 && stops[0].latitude && stops[0].longitude
      ? [stops[0].latitude, stops[0].longitude]
      : [5.3484, -4.0152] // Abidjan par défaut
  );

  const positions: [number, number][] = stops
    .filter((s) => !isNaN(s.latitude) && !isNaN(s.longitude))
    .map((s) => [s.latitude, s.longitude]);

  // Geocoding search function via OpenStreetMap Nominatim
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const queryWithCountry = searchQuery.toLowerCase().includes('ivoire') || searchQuery.toLowerCase().includes('abidjan')
        ? searchQuery
        : `${searchQuery}, Côte d'Ivoire`;

      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryWithCountry)}`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'fr',
        },
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
        const lng = parseFloat(parseFloat(data[0].lon).toFixed(6));
        const placeName = data[0].display_name.split(',')[0];

        setMapCenter([lat, lng]);

        if (selectedStopIndex !== null) {
          onUpdateStopCoords(selectedStopIndex, lat, lng);
        } else {
          onAddStopAtCoords(lat, lng, placeName);
        }
      } else {
        setSearchError('Lieu non trouvé. Essayez de préciser la commune (ex: Saint Jean, Cocody).');
      }
    } catch (err) {
      console.error('Erreur recherche de lieu:', err);
      setSearchError('Erreur de connexion au service de recherche.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const activeTileConfig = MAP_TILE_URLS[mapProvider];

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-md p-6 flex flex-col h-screen w-screen space-y-4'
          : 'space-y-2'
      }
    >
      {/* Top Controls Bar */}
      <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
        {/* Search Input Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-orange-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleSearchLocation();
              }
            }}
            placeholder="Rechercher un lieu par nom (ex: Carrefour St Jean, Palmeraie, Yopougon...)"
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSearchLocation();
          }}
          disabled={isSearching}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
        >
          {isSearching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          <span>Rechercher</span>
        </button>

        {/* Map Provider Selector */}
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setMapProvider('google-hybrid')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
              mapProvider === 'google-hybrid'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Google Maps Imagerie Satellite HD avec repères"
          >
            🛰️ Satellite HD
          </button>

          <button
            type="button"
            onClick={() => setMapProvider('google-roadmap')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
              mapProvider === 'google-roadmap'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Google Maps Routier HD"
          >
            🗺️ Google Plan
          </button>

          <button
            type="button"
            onClick={() => setMapProvider('osm')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
              mapProvider === 'osm'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="OpenStreetMap Standard"
          >
            🌐 OpenStreet
          </button>
        </div>

        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer border border-zinc-700"
          title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4 text-orange-400" />
              <span className="hidden sm:inline">Réduire</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 text-orange-400" />
              <span className="hidden sm:inline">Plein écran</span>
            </>
          )}
        </button>
      </div>

      {searchError && (
        <p className="text-[11px] font-semibold text-red-400 pl-1">{searchError}</p>
      )}

      {/* Map Container */}
      <div
        className={
          isFullscreen
            ? 'flex-1 w-full rounded-3xl overflow-hidden border border-zinc-800 relative shadow-2xl'
            : 'h-80 w-full rounded-2xl overflow-hidden border border-zinc-800 relative'
        }
      >
        <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
          <ChangeMapCenter center={mapCenter} />
          <TileLayer key={mapProvider} attribution={activeTileConfig.attribution} url={activeTileConfig.url} maxZoom={20} />

          <MapClickHandler
            selectedStopIndex={selectedStopIndex}
            onSelectStop={onSelectStop}
            onUpdateStopCoords={onUpdateStopCoords}
            onAddStopAtCoords={onAddStopAtCoords}
          />

          {positions.length > 1 && (
            <Polyline positions={positions} color="#f97316" weight={4} dashArray="6, 8" />
          )}

          {stops.map((stop, idx) => {
            if (isNaN(stop.latitude) || isNaN(stop.longitude)) return null;
            const isSelected = selectedStopIndex === idx;

            return (
              <Marker
                key={idx}
                position={[stop.latitude, stop.longitude]}
                icon={stopIcon(stop.ordre || idx + 1, isSelected)}
                draggable={true}
                eventHandlers={{
                  click: () => onSelectStop(idx),
                  dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    onUpdateStopCoords(idx, parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
                  },
                }}
              >
                <Popup>
                  <div className="text-zinc-100 p-1">
                    <p className="font-bold text-xs">Arrêt #{stop.ordre} : {stop.nom}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      GPS: {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                    </p>
                    <p className="text-[10px] text-orange-400 mt-1 italic">
                      Glissez le marqueur pour déplacer l'arrêt
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="absolute top-3 right-3 bg-black/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-zinc-300 z-[999] pointer-events-auto shadow-md flex items-center gap-2">
          <span>💡 Mode {mapProvider === 'google-hybrid' ? 'Satellite HD' : mapProvider === 'google-roadmap' ? 'Google Plan HD' : 'OpenStreetMap'}</span>
        </div>
      </div>
    </div>
  );
}
