'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io as SocketIOClient } from 'socket.io-client';
import api, { API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

// Composant interne pour recentrer la carte
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center]);
  return null;
}

export default function Map() {
  const { user, token } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [positions, setPositions] = useState<{ [key: string]: VehiclePosition }>({});
  const [routePaths, setRoutePaths] = useState<{ [routeId: string]: [number, number][] }>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([5.3484, -4.0152]); // Abidjan par défaut
  const socketRef = useRef<any>(null);

  const fetchRoutePaths = async (loadedRoutes: Route[]) => {
    const paths: { [routeId: string]: [number, number][] } = {};
    
    for (const route of loadedRoutes) {
      if (route.stops.length < 2) continue;
      
      const sortedStops = [...route.stops].sort((a, b) => a.ordre - b.ordre);
      const coordsString = sortedStops
        .map((stop) => `${stop.longitude},${stop.latitude}`)
        .join(';');
      
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const streetCoords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          paths[route.id] = streetCoords;
        } else {
          paths[route.id] = sortedStops.map((s) => [s.latitude, s.longitude] as [number, number]);
        }
      } catch (err) {
        console.error(`Erreur OSRM pour la route ${route.nom}:`, err);
        paths[route.id] = sortedStops.map((s) => [s.latitude, s.longitude] as [number, number]);
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

  return (
    <div className="dark-map h-full w-full rounded-3xl overflow-hidden border border-slate-800/80 shadow-inner relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dessiner les trajets (Polylines) et arrêts */}
        {routes.map((route) => {
          const stopsPoints = route.stops.map((s) => [s.latitude, s.longitude] as [number, number]);
          const streetPath = routePaths[route.id] || stopsPoints;
          return (
            <React.Fragment key={route.id}>
              {/* Ligne du trajet */}
              {streetPath.length > 1 && (
                <Polyline
                  positions={streetPath}
                  color={route.type === 'MATIN' ? '#f97316' : '#3b82f6'} // Orange matin, Bleu soir
                  weight={4}
                  opacity={0.7}
                />
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
                    <div className="text-slate-100">
                      <p className="font-bold text-sm">{stop.nom}</p>
                      <p className="text-xs text-slate-400 mt-1">Trajet : {route.nom}</p>
                      <p className="text-xs text-slate-400">Ordre de passage : #{stop.ordre}</p>
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
                <div className="text-slate-100 min-w-[180px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                    <span className="font-bold text-sm text-slate-100">🚌 {pos.immatriculation || 'Bus scolaire'}</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                      En route
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-400">
                      Vitesse : <span className="text-slate-200 font-semibold">{Math.round(pos.speed * 3.6)} km/h</span>
                    </p>
                    <p className="text-slate-400">
                      Prochain relais : <span className="text-slate-200 font-semibold">{pos.stopProchain}</span>
                    </p>
                    <p className="text-slate-400">
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
      <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur border border-slate-800/80 rounded-2xl p-4 shadow-xl z-[999] pointer-events-auto flex flex-col gap-2 text-xs">
        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-800 pb-1.5 mb-1">
          Légende
        </span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 border border-white"></div>
          <span className="text-slate-300 font-medium">Car en service</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-800 border-2 border-orange-500"></div>
          <span className="text-slate-300 font-medium">Arrêt (Matin)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-800 border-2 border-blue-500"></div>
          <span className="text-slate-300 font-medium">Arrêt (Soir)</span>
        </div>
      </div>
    </div>
  );
}
