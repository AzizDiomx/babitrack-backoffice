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
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  Globe
} from 'lucide-react';
import api from '../../../services/api';
import DynamicStopPickerMap from '../../../components/DynamicStopPickerMap';
import NotificationModal, { ConfirmModal, NotificationState, ConfirmState } from '../../../components/NotificationModal';

interface Stop {
  id?: string;
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
  id?: string;
  nom: string;
  latitude: string;
  longitude: string;
  ordre: number;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(0);

  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setNotification({ isOpen: true, type, message, title });
  };
  
  // Form State
  const [nom, setNom] = useState('');
  const [type, setType] = useState('MATIN');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [stops, setStops] = useState<StopInput[]>([
    { nom: 'Arrêt de départ (ex: Rivera 2)', latitude: '5.3484', longitude: '-4.0152', ordre: 1 },
    { nom: 'Point Relais (ex: Carrefour St Jean)', latitude: '5.3584', longitude: '-4.0052', ordre: 2 },
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

  const openCreateModal = () => {
    setEditingRouteId(null);
    setNom('');
    setType('MATIN');
    setSelectedVehicleId('');
    setStops([
      { nom: 'Arrêt de départ (ex: Rivera 2)', latitude: '5.3484', longitude: '-4.0152', ordre: 1 },
      { nom: 'Point Relais (ex: Carrefour St Jean)', latitude: '5.3584', longitude: '-4.0052', ordre: 2 },
    ]);
    setSelectedStopIndex(0);
    setIsModalOpen(true);
  };

  const openEditModal = (route: Route) => {
    setEditingRouteId(route.id);
    setNom(route.nom);
    setType(route.type);
    setSelectedVehicleId(route.vehicleId || '');
    setStops(
      route.stops.map((s, idx) => ({
        id: s.id,
        nom: s.nom,
        latitude: s.latitude.toString(),
        longitude: s.longitude.toString(),
        ordre: s.ordre || idx + 1,
      }))
    );
    setSelectedStopIndex(0);
    setIsModalOpen(true);
  };

  // Add stop row
  const addStopRow = () => {
    const nextOrder = stops.length + 1;
    const lastStop = stops[stops.length - 1];
    const newLat = lastStop ? (parseFloat(lastStop.latitude) + 0.005).toFixed(6) : '5.3484';
    const newLng = lastStop ? (parseFloat(lastStop.longitude) + 0.005).toFixed(6) : '-4.0152';

    const newStops = [
      ...stops,
      { nom: `Point Relais #${nextOrder}`, latitude: newLat, longitude: newLng, ordre: nextOrder }
    ];
    setStops(newStops);
    setSelectedStopIndex(newStops.length - 1);
  };

  // Remove stop row
  const removeStopRow = (index: number) => {
    if (stops.length <= 1) {
      notify('warning', 'Un trajet doit comporter au moins un arrêt.');
      return;
    }
    const filtered = stops.filter((_, idx) => idx !== index);
    const reordered = filtered.map((s, idx) => ({
      ...s,
      ordre: idx + 1
    }));
    setStops(reordered);
    if (selectedStopIndex === index) {
      setSelectedStopIndex(Math.max(0, index - 1));
    } else if (selectedStopIndex !== null && selectedStopIndex > index) {
      setSelectedStopIndex(selectedStopIndex - 1);
    }
  };

  // Move stop position up or down
  const moveStopOrder = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === stops.length - 1)) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const copy = [...stops];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Recalculer l'ordre
    const reordered = copy.map((s, idx) => ({ ...s, ordre: idx + 1 }));
    setStops(reordered);
    setSelectedStopIndex(targetIdx);
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

  // Update stop coords from map click/drag
  const handleMapUpdateStopCoords = (index: number, lat: number, lng: number) => {
    const updated = [...stops];
    updated[index].latitude = lat.toString();
    updated[index].longitude = lng.toString();
    setStops(updated);
    setSelectedStopIndex(index);
  };

  // Add stop at clicked/searched map coords
  const handleMapAddStopAtCoords = (lat: number, lng: number, name?: string) => {
    const nextOrder = stops.length + 1;
    const newStops = [
      ...stops,
      { nom: name || `Point Relais #${nextOrder}`, latitude: lat.toString(), longitude: lng.toString(), ordre: nextOrder }
    ];
    setStops(newStops);
    setSelectedStopIndex(newStops.length - 1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom) {
      notify('warning', 'Veuillez spécifier le nom du trajet.');
      return;
    }

    // Valider les coordonnées des arrêts
    for (const stop of stops) {
      if (!stop.nom || !stop.latitude || !stop.longitude) {
        notify('warning', 'Veuillez renseigner tous les champs pour chaque arrêt.');
        return;
      }
      const lat = parseFloat(stop.latitude);
      const lng = parseFloat(stop.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        notify('warning', `Coordonnées invalides pour l'arrêt: ${stop.nom}`);
        return;
      }
    }

    try {
      const payload = {
        nom,
        type,
        vehicleId: selectedVehicleId || null,
        stops: stops.map((s, idx) => ({
          nom: s.nom,
          latitude: parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
          ordre: idx + 1,
        })),
      };

      if (editingRouteId) {
        await api.put(`/api/routes/${editingRouteId}`, payload);
        notify('success', 'Trajet et points relais mis à jour avec succès.');
      } else {
        await api.post('/api/routes', payload);
        notify('success', 'Trajet créé avec succès.');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      notify('error', err.response?.data?.error || 'Erreur lors de la sauvegarde du trajet.');
    }
  };

  const handleDeleteRoute = async (routeId: string, routeName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Supprimer ce trajet ?',
      message: `Êtes-vous sûr de vouloir supprimer le trajet "${routeName}" ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer le trajet',
      onConfirm: async () => {
        try {
          await api.delete(`/api/routes/${routeId}`);
          notify('success', 'Trajet supprimé avec succès.');
          fetchData();
        } catch (err: any) {
          console.error(err);
          notify('error', err.response?.data?.error || 'Impossible de supprimer le trajet.');
        }
      },
    });
  };

  return (
    <div className="min-h-full bg-zinc-950 dark:bg-black p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Trajets & Points Relais
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Créer et configurer les lignes de ramassage, ordonner et modifier les coordonnées GPS des points relais
          </p>
        </div>
        <div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 min-h-[44px] text-sm font-semibold w-full sm:w-auto transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
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
        <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-16 text-center text-zinc-500 backdrop-blur-xl">
          <Map className="h-12 w-12 text-zinc-700 mx-auto mb-3 animate-pulse" />
          <p className="font-semibold text-zinc-400">Aucun trajet configuré</p>
          <p className="text-xs text-zinc-500 mt-1">Créez votre première ligne de ramassage en cliquant sur le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {routes.map((rt) => (
            <div 
              key={rt.id}
              className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl hover:border-zinc-700 transition duration-150 space-y-5"
            >
              {/* Route Header Info & Actions */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">{rt.nom}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                        rt.type === 'MATIN' 
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        ☀️ {rt.type}
                      </span>
                      {rt.vehicle ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 bg-zinc-950 px-2.5 py-0.5 rounded-full border border-zinc-800">
                          <Bus className="h-3.5 w-3.5 text-orange-500" /> {rt.vehicle.immatriculation}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Aucun bus assigné</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mr-2 hidden sm:inline">
                    {rt.stops.length} points relais
                  </span>
                  
                  {/* Edit Route Button */}
                  <button
                    onClick={() => openEditModal(rt)}
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl transition cursor-pointer border border-zinc-700"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-orange-400" />
                    Modifier
                  </button>

                  {/* Delete Route Button */}
                  <button
                    onClick={() => handleDeleteRoute(rt.id, rt.nom)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-red-500/20"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stop Points Progression Timeline */}
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  Ordre des Points Relais de passage
                </p>
                <div className="flex flex-wrap items-center gap-y-3 gap-x-2">
                  {rt.stops.map((stop, idx) => (
                    <React.Fragment key={stop.id || idx}>
                      {idx > 0 && <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0 hidden md:block" />}
                      
                      <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 hover:border-zinc-700 transition">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-[11px] font-bold text-orange-500 border border-orange-500/20">
                          {stop.ordre || idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 truncate">{stop.nom}</p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Route Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl p-6 relative max-h-[92vh] flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white cursor-pointer z-10 p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {editingRouteId ? 'Modifier la ligne' : 'Créer une ligne de transport'}
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Configurez le nom, la période, le bus assigné et ordonnez les points relais visuellement sur la carte.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-5 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Route Name */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nom de la Ligne</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Ligne Riviera - Plateau"
                    required
                  />
                </div>

                {/* Route Type */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Période de service</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="MATIN">MATIN (Ramassage École)</option>
                    <option value="SOIR">SOIR (Retour Maison)</option>
                  </select>
                </div>

                {/* Vehicle Assign */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Bus assigné</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Aucun bus assigné --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive Stop Map Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Carte interactive des Points Relais
                  </label>
                  {selectedStopIndex !== null && stops[selectedStopIndex] && (
                    <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                      Arrêt sélectionné : #{stops[selectedStopIndex].ordre} ({stops[selectedStopIndex].nom})
                    </span>
                  )}
                </div>
                
                <DynamicStopPickerMap
                  stops={stops.map((s, idx) => ({
                    nom: s.nom,
                    latitude: parseFloat(s.latitude) || 5.3484,
                    longitude: parseFloat(s.longitude) || -4.0152,
                    ordre: idx + 1,
                  }))}
                  selectedStopIndex={selectedStopIndex}
                  onSelectStop={setSelectedStopIndex}
                  onUpdateStopCoords={handleMapUpdateStopCoords}
                  onAddStopAtCoords={handleMapAddStopAtCoords}
                />
              </div>

              {/* Stop Points Builder List */}
              <div className="border-t border-zinc-800 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Liste & Ordre des Points Relais ({stops.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addStopRow}
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5 hover:bg-orange-500/20 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter un arrêt
                  </button>
                </div>

                <div className="space-y-3">
                  {stops.map((stop, idx) => {
                    const isSelected = selectedStopIndex === idx;

                    return (
                      <div 
                        key={idx}
                        onClick={() => setSelectedStopIndex(idx)}
                        className={`flex flex-col gap-3 sm:flex-row sm:items-center rounded-2xl p-3.5 transition cursor-pointer border ${
                          isSelected 
                            ? 'bg-zinc-950 border-orange-500/60 ring-1 ring-orange-500/30' 
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {/* Order & Reorder buttons */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-500 border border-orange-500/20">
                            {idx + 1}
                          </div>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveStopOrder(idx, 'up'); }}
                              disabled={idx === 0}
                              className="text-zinc-500 hover:text-orange-400 disabled:opacity-30 p-0.5 cursor-pointer"
                              title="Déplacer vers le haut"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveStopOrder(idx, 'down'); }}
                              disabled={idx === stops.length - 1}
                              className="text-zinc-500 hover:text-orange-400 disabled:opacity-30 p-0.5 cursor-pointer"
                              title="Déplacer vers le bas"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Stop Name */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={stop.nom}
                            onChange={(e) => handleStopChange(idx, 'nom', e.target.value)}
                            className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                            placeholder="Nom du relais (ex: Carrefour Riviera)"
                            required
                          />
                        </div>

                        {/* Latitude */}
                        <div className="w-full sm:w-32">
                          <input
                            type="text"
                            value={stop.latitude}
                            onChange={(e) => handleStopChange(idx, 'latitude', e.target.value)}
                            className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-mono"
                            placeholder="Latitude"
                            required
                          />
                        </div>

                        {/* Longitude */}
                        <div className="w-full sm:w-32">
                          <input
                            type="text"
                            value={stop.longitude}
                            onChange={(e) => handleStopChange(idx, 'longitude', e.target.value)}
                            className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-mono"
                            placeholder="Longitude"
                            required
                          />
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeStopRow(idx); }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer self-end sm:self-center"
                          title="Supprimer ce point relais"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6 bg-[#121212] sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  {editingRouteId ? 'Mettre à jour le trajet' : 'Créer le trajet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popups & Notifications */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
      <ConfirmModal confirmState={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
