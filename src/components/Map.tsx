'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io as SocketIOClient } from 'socket.io-client';
import api, { API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

import { Maximize2, Minimize2, Search, MapPin, Loader2 } from 'lucide-react';

// Correction des icônes Leaflet par défaut
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface Stop {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  ordre: number;
}

interface Route {
  id: string;
  nom: string;
  type: string;
  stops: Stop[];
  vehicle?: {
    id: string;
    immatriculation: string;
    statut: string;
  };
}

interface VehiclePosition {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  eta: number | null;
  stopProchain: string;
  immatriculation?: string;
  statut?: string;
}

import { createPortal } from 'react-dom';

// Composant interne pour recentrer la carte
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [center, map]);
  return null;
}

// Composant interne pour redimensionner Leaflet au passage en plein écran
function ResizeMapOnFullscreen({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isFullscreen, map]);
  return null;
}

type MapProvider = 'google-roadmap' | 'google-hybrid' | 'osm';
type RouteFilter = 'ALL' | 'MATIN' | 'SOIR';

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

export default function Map() {
  const { user, token } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [positions, setPositions] = useState<{ [key: string]: VehiclePosition }>({});
  const [routePaths, setRoutePaths] = useState<{ [routeId: string]: [number, number][] }>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([5.3484, -4.0152]); // Abidjan par défaut
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('google-hybrid');
  const [routeFilter, setRouteFilter] = useState<RouteFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const socketRef = useRef<any>(null);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const query = searchQuery.toLowerCase().includes('abidjan') || searchQuery.toLowerCase().includes('côte d\'ivoire')
        ? searchQuery
        : `${searchQuery}, Abidjan, Côte d'Ivoire`;

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: {
          'Accept-Language': 'fr',
        },
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
        const lng = parseFloat(parseFloat(data[0].lon).toFixed(6));
        setMapCenter([lat, lng]);
      }
    } catch (err) {
      console.error('Erreur recherche de lieu:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchRoutePaths = async (loadedRoutes: Route[]) => {
    const paths: { [routeId: string]: [number, number][] } = {};
    
    for (const route of loadedRoutes) {
      if (!route.stops || route.stops.length < 2) continue;

      try {
        const res = await api.get(`/api/routes/${route.id}/path`);
        if (res.data && res.data.path && res.data.path.length > 0) {
          paths[route.id] = res.data.path;
        } else {
          const sortedStops = [...route.stops].sort((a, b) => a.ordre - b.ordre);
          paths[route.id] = sortedStops.map((s) => [s.latitude, s.longitude]);
        }
      } catch (err) {
        console.error(`Erreur géométrie trajet ${route.id}:`, err);
        const sortedStops = [...route.stops].sort((a, b) => a.ordre - b.ordre);
        paths[route.id] = sortedStops.map((s) => [s.latitude, s.longitude]);
      }
    }

    setRoutePaths(paths);
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await api.get('/api/routes');
        setRoutes(res.data);
        fetchRoutePaths(res.data);
        
        // Centrer sur le premier arrêt du premier trajet
        if (res.data.length > 0 && res.data[0].stops.length > 0) {
          const firstStop = res.data[0].stops[0];
          setMapCenter([firstStop.latitude, firstStop.longitude]);
        }
      } catch (err) {
        console.error('Erreur chargement trajets carte:', err);
      }
    };
    fetchRoutes();
  }, []);

  // 2. Initialiser Socket.IO et s'abonner aux véhicules
  useEffect(() => {
    if (!token || !user || routes.length === 0) return;

    console.log('[Socket Map] Connexion au serveur...');
    const socket = SocketIOClient(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket Map] Connecté au serveur');
      
      // S'abonner à tous les véhicules associés aux trajets
      routes.forEach((route) => {
        if (route.vehicle?.id) {
          console.log(`[Socket Map] Abonnement au véhicule: ${route.vehicle.id}`);
          socket.emit('user:subscribe_vehicle', { vehicleId: route.vehicle.id });
          
          // Initialiser la position avec le statut de base
          setPositions((prev) => ({
            ...prev,
            [route.vehicle!.id]: {
              vehicleId: route.vehicle!.id,
              lat: route.stops[0]?.latitude || 5.3484,
              lng: route.stops[0]?.longitude || -4.0152,
              speed: 0,
              bearing: 0,
              eta: null,
              stopProchain: 'En attente...',
              immatriculation: route.vehicle!.immatriculation,
              statut: route.vehicle!.statut
            }
          }));
        }
      });
    });

    // Recevoir les positions des véhicules en temps réel
    socket.on('vehicle:position', (data: any) => {
      console.log('[Socket Map] Position reçue:', data);
      const { vehicleId, lat, lng, speed, bearing, eta, stopProchain } = data;
      if (!vehicleId) return;

      setPositions((prev) => {
        const existing = prev[vehicleId];
        return {
          ...prev,
          [vehicleId]: {
            ...existing,
            vehicleId,
            lat,
            lng,
            speed,
            bearing,
            eta,
            stopProchain,
            statut: 'EN_SERVICE' // S'il émet une position, il est en service
          }
        };
      });
    });

    // Écouter les changements de statut
    socket.on('trip:status', (data: any) => {
      console.log('[Socket Map] Statut reçu:', data);
      const { vehicleId, status } = data;
      if (!vehicleId) return;

      setPositions((prev) => {
        const existing = prev[vehicleId];
        if (!existing) return prev;
        return {
          ...prev,
          [vehicleId]: {
            ...existing,
            statut: status
          }
        };
      });
    });

    return () => {
      socket.disconnect();
      console.log('[Socket Map] Déconnecté');
    };
  }, [token, user, routes]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTileConfig = MAP_TILE_URLS[mapProvider];

  const mapElement = (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[99999] bg-zinc-950 p-4 w-screen h-screen dark-map relative flex flex-col'
          : 'dark-map h-full w-full rounded-3xl overflow-hidden border border-zinc-800/80 shadow-inner relative'
      }
    >
      {/* Top Map Controls */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pointer-events-auto">
        {/* Search Location Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
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
            placeholder="Rechercher un lieu (ex: Riviera, St Jean, Yopougon...)"
            className="w-full pl-9 pr-9 py-2 bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 shadow-lg"
          />
          <button
            type="button"
            onClick={handleSearchLocation}
            disabled={isSearching}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-orange-500 transition cursor-pointer"
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Route Type Filter Selector */}
          <div className="flex items-center gap-1 bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-xl p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setRouteFilter('ALL')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                routeFilter === 'ALL'
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Afficher les deux trajets (Aller et Retour)"
            >
              🔄 Les deux
            </button>

            <button
              type="button"
              onClick={() => setRouteFilter('MATIN')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                routeFilter === 'MATIN'
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Afficher uniquement le trajet Aller (Matin)"
            >
              🌅 Aller (Matin)
            </button>

            <button
              type="button"
              onClick={() => setRouteFilter('SOIR')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                routeFilter === 'SOIR'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Afficher uniquement le trajet Retour (Soir)"
            >
              🌇 Retour (Soir)
            </button>
          </div>

          {/* Map Provider Selector (Satellite HD / Google Plan / OpenStreet) */}
          <div className="flex items-center gap-1 bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-xl p-1 shadow-lg">
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
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="bg-zinc-950/95 hover:bg-[#121212] backdrop-blur border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-200 flex items-center gap-2 shadow-lg cursor-pointer transition"
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
      </div>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={mapCenter} />
        <ResizeMapOnFullscreen isFullscreen={isFullscreen} />
        <TileLayer
          key={mapProvider}
          attribution={activeTileConfig.attribution}
          url={activeTileConfig.url}
          maxZoom={20}
        />

        {/* Dessiner les trajets (Polylines) et arrêts filtrés */}
        {routes
          .filter((route) => {
            if (routeFilter === 'MATIN') return route.type === 'MATIN';
            if (routeFilter === 'SOIR') return route.type === 'SOIR';
            return true;
          })
          .map((route) => {
          const stopsPoints = route.stops.map((s) => [s.latitude, s.longitude] as [number, number]);
          const streetPath = routePaths[route.id] || stopsPoints;
          return (
            <React.Fragment key={route.id}>
              {/* Tracé direct et propre du trajet (Ligne externe néon + Cœur intérieur) */}
              {streetPath.length > 1 && (
                <>
                  <Polyline
                    positions={streetPath}
                    color={route.type === 'MATIN' ? '#f97316' : '#2563eb'}
                    weight={6}
                    opacity={0.9}
                  />
                  <Polyline
                    positions={streetPath}
                    color="#ffffff"
                    weight={2}
                    opacity={0.8}
                  />
                </>
              )}

              {/* Arrêts */}
              {route.stops.map((stop) => (
                <CircleMarker
                  key={stop.id}
                  center={[stop.latitude, stop.longitude]}
                  radius={6}
                  fillColor="#1e293b"
                  color={route.type === 'MATIN' ? '#f97316' : '#3b82f6'}
                  weight={2}
                  fillOpacity={0.9}
                >
                  <Popup>
                    <div className="text-white">
                      <p className="font-bold text-sm">{stop.nom}</p>
                      <p className="text-xs text-zinc-400 mt-1">Trajet : {route.nom}</p>
                      <p className="text-xs text-zinc-400">Ordre de passage : #{stop.ordre}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </React.Fragment>
          );
        })}

        {/* Dessiner les véhicules actifs */}
        {Object.values(positions)
          .filter((pos) => pos.statut === 'EN_SERVICE' || pos.statut === 'RETARD')
          .map((pos) => (
            <CircleMarker
              key={pos.vehicleId}
              center={[pos.lat, pos.lng]}
              radius={10}
              fillColor="#22c55e"
              color="#ffffff"
              weight={2.5}
              fillOpacity={1.0}
              className="animate-pulse"
            >
              <Popup>
                <div className="text-white min-w-[180px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                    <span className="font-bold text-sm text-white">🚌 {pos.immatriculation || 'Bus scolaire'}</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                      En route
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-zinc-400">
                      Vitesse : <span className="text-zinc-200 font-semibold">{Math.round(pos.speed * 3.6)} km/h</span>
                    </p>
                    <p className="text-zinc-400">
                      Prochain relais : <span className="text-zinc-200 font-semibold">{pos.stopProchain}</span>
                    </p>
                    <p className="text-zinc-400">
                      Temps estimé (ETA) :{' '}
                      <span className="text-orange-400 font-semibold">
                        {pos.eta !== null ? `${pos.eta} min` : '--'}
                      </span>
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Légende rapide sur la carte */}
      <div className="absolute bottom-4 right-4 bg-[#121212]/95 backdrop-blur border border-zinc-800/80 rounded-2xl p-4 shadow-xl z-[999] pointer-events-auto flex flex-col gap-2 text-xs">
        <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1.5 mb-1">
          Légende
        </span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 border border-white"></div>
          <span className="text-zinc-300 font-medium">Car en service</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-800 border-2 border-orange-500"></div>
          <span className="text-zinc-300 font-medium">Arrêt (Matin)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-800 border-2 border-blue-500"></div>
          <span className="text-zinc-300 font-medium">Arrêt (Soir)</span>
        </div>
      </div>
    </div>
  );

  if (isFullscreen && mounted) {
    return createPortal(mapElement, document.body);
  }

  return mapElement;
}
