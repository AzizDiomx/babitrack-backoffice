'use client';

import React, { useEffect, useState } from 'react';
import { 
  Map, 
  MapPin, 
  Plus, 
  Trash2, 
  X, 
  Navigation,
  ArrowRight,
  Bus,
  Tag
} from 'lucide-react';
import api from '../../../services/api';

interface Stop {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  ordre: number;
}

interface Vehicle {
  id: string;
  immatriculation: string;
}

interface Route {
  id: string;
  nom: string;
  type: string;
  vehicleId: string | null;
  vehicle: Vehicle | null;
  stops: Stop[];
  createdAt: string;
}

interface StopInput {
  nom: string;
  latitude: string;
  longitude: string;
  ordre: number;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  const [nom, setNom] = useState('');
  const [type, setType] = useState('MATIN');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [stops, setStops] = useState<StopInput[]>([
    { nom: 'Arrêt de départ', latitude: '5.3484', longitude: '-4.0152', ordre: 1 }
  ]);

  const fetchData = async () => {
    try {
      const [resRoutes, resVehicles] = await Promise.all([
        api.get('/api/routes'),
        api.get('/api/vehicles'),
      ]);
      setRoutes(resRoutes.data);
      setVehicles(resVehicles.data);
    } catch (err) {
      console.error('Erreur lors du chargement des trajets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add stop row
  const addStopRow = () => {
    const nextOrder = stops.length + 1;
    setStops([
      ...stops,
      { nom: `Relais #${nextOrder}`, latitude: '5.3484', longitude: '-4.0152', ordre: nextOrder }
    ]);
  };

  // Remove stop row
  const removeStopRow = (index: number) => {
    if (stops.length <= 1) {
      alert('Un trajet doit comporter au moins un arrêt.');
      return;
    }
    const filtered = stops.filter((_, idx) => idx !== index);
    // Recalculer l'ordre
    const reordered = filtered.map((s, idx) => ({
      ...s,
      ordre: idx + 1
    }));
    setStops(reordered);
  };

  // Update stop input fields
  const handleStopChange = (index: number, field: keyof StopInput, value: string) => {
    const updated = [...stops];
    if (field === 'ordre') {
      updated[index][field] = parseInt(value, 10);
    } else {
      updated[index][field] = value as any;
    }
    setStops(updated);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom) {
      alert('Veuillez spécifier le nom du trajet.');
      return;
    }

    // Valider les coordonnées des arrêts
    for (const stop of stops) {
      if (!stop.nom || !stop.latitude || !stop.longitude) {
        alert('Veuillez renseigner tous les champs pour chaque arrêt.');
        return;
      }
      const lat = parseFloat(stop.latitude);
      const lng = parseFloat(stop.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        alert(`Coordonnées invalides pour l'arrêt: ${stop.nom}`);
        return;
      }
    }

    try {
      await api.post('/api/routes', {
        nom,
        type,
        vehicleId: selectedVehicleId || null,
        stops: stops.map((s) => ({
          nom: s.nom,
          latitude: parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
          ordre: s.ordre,
        })),
      });

      alert('Trajet créé avec succès.');
      setIsAddModalOpen(false);
      setNom('');
      setType('MATIN');
      setSelectedVehicleId('');
      setStops([{ nom: 'Arrêt de départ', latitude: '5.3484', longitude: '-4.0152', ordre: 1 }]);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erreur lors du dépôt du trajet.');
    }
  };

  return (
    <div className="min-h-full bg-slate-950 p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Trajets & Points Relais
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Créer et configurer les lignes de ramassage scolaire, ordonner les points relais de passage
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Créer une ligne
          </button>
        </div>
      </div>

      {/* Routes List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-2xl border border-slate-850 bg-slate-900/10 p-16 text-center text-slate-500 backdrop-blur-xl">
          <Map className="h-12 w-12 text-slate-700 mx-auto mb-3 animate-pulse" />
          <p className="font-semibold text-slate-400">Aucun trajet configuré</p>
          <p className="text-xs text-slate-550 mt-1">Créez votre première ligne de ramassage en cliquant sur le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {routes.map((rt) => (
            <div 
              key={rt.id}
              className="rounded-2xl border border-slate-850 bg-slate-900/20 p-6 backdrop-blur-xl"
            >
              {/* Route Header Info */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-5 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <Navigation className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{rt.nom}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                        rt.type === 'MATIN' 
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        ☀️ {rt.type}
                      </span>
                      {rt.vehicle && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
                          <Bus className="h-3 w-3 text-slate-400" /> {rt.vehicle.immatriculation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  {rt.stops.length} points de relais
                </div>
              </div>

              {/* Stop Points Progression Timeline */}
              <div className="flex flex-wrap items-center gap-y-4">
                {rt.stops.map((stop, idx) => (
                  <React.Fragment key={stop.id}>
                    {idx > 0 && <ArrowRight className="h-4.5 w-4.5 text-slate-600 mx-2 shrink-0 hidden md:block" />}
                    
                    <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 rounded-xl px-4 py-3 min-w-[160px] max-w-xs hover:border-slate-800 transition">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-orange-500 border border-orange-500/20 shadow">
                        {stop.ordre}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{stop.nom}</p>
                        <p className="text-[10px] font-semibold text-slate-550 mt-0.5">
                          {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Route Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-350 cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Créer une ligne</h3>
            <p className="text-xs text-slate-400 mb-6">
              Configurez un itinéraire de transport en spécifiant ses arrêts et l'ordre de passage.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Route Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nom de la Ligne</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Ligne Riviera - Plateau"
                    required
                  />
                </div>

                {/* Route Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Période de service</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="MATIN">MATIN (Aller vers l'école)</option>
                    <option value="SOIR">SOIR (Retour vers la maison)</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Assign */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Véhicule assigné (Facultatif)</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Aucun bus assigné pour l'instant --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.immatriculation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stop Points Builder */}
              <div className="border-t border-slate-850 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-250 uppercase tracking-wider">Points de Relais (Arrêts)</h4>
                  <button
                    type="button"
                    onClick={addStopRow}
                    className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5 hover:bg-orange-500/20 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter un arrêt
                  </button>
                </div>

                <div className="space-y-3">
                  {stops.map((stop, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center bg-slate-950/40 border border-slate-850 rounded-2xl p-4 relative"
                    >
                      {/* Order indicator */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-orange-500 border border-orange-500/20">
                        {stop.ordre}
                      </div>

                      {/* Stop Name */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={stop.nom}
                          onChange={(e) => handleStopChange(idx, 'nom', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-orange-500"
                          placeholder="Nom du relais (ex: Carrefour Riviera)"
                          required
                        />
                      </div>

                      {/* Latitude */}
                      <div className="w-full sm:w-28">
                        <input
                          type="text"
                          value={stop.latitude}
                          onChange={(e) => handleStopChange(idx, 'latitude', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-orange-500"
                          placeholder="Latitude"
                          required
                        />
                      </div>

                      {/* Longitude */}
                      <div className="w-full sm:w-28">
                        <input
                          type="text"
                          value={stop.longitude}
                          onChange={(e) => handleStopChange(idx, 'longitude', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-orange-500"
                          placeholder="Longitude"
                          required
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeStopRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-850 mt-6 bg-slate-900 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
