'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bus, 
  User, 
  Plus, 
  X, 
  Hash, 
  Users, 
  Image as ImageIcon,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';
import api, { API_URL } from '../../../services/api';

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
}

interface Vehicle {
  id: string;
  immatriculation: string;
  capacite: number;
  statut: string;
  chauffeurId: string | null;
  chauffeur: Chauffeur | null;
  imageUrl: string | null;
  createdAt: string;
}

interface UserDropdownItem {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

const PRESETS_VEHICLES = [
  {
    id: 'standard',
    name: 'Autobus Jaune',
    url: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'shuttle',
    name: 'Minibus Navette',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'van',
    name: 'Minivan Urbain',
    url: 'https://images.unsplash.com/photo-1518655061766-48f23af93e77?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'electric',
    name: 'Car Moderne',
    url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=500&auto=format&fit=crop&q=60',
  }
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [chauffeurs, setChauffeurs] = useState<UserDropdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  
  // Form State
  const [immatriculation, setImmatriculation] = useState('');
  const [capacite, setCapacite] = useState('30');
  const [selectedChauffeurId, setSelectedChauffeurId] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState(PRESETS_VEHICLES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const getVehicleImageUrl = (url: string | null) => {
    if (!url) return PRESETS_VEHICLES[0].url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL}${url}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingImage(true);
      const res = await api.post('/api/vehicles/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSelectedImageUrl(res.data.imageUrl);
      setCustomImageUrl(res.data.imageUrl);
      alert('Image téléversée avec succès.');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erreur lors du téléversement de l\'image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchData = async () => {
    try {
      const [resVehicles, resUsers] = await Promise.all([
        api.get('/api/vehicles'),
        api.get('/api/users'),
      ]);
      setVehicles(resVehicles.data);
      
      // Filtrer les chauffeurs pour le dropdown
      const drivers = resUsers.data.filter((u: any) => u.role === 'CHAUFFEUR');
      setChauffeurs(drivers);
    } catch (err) {
      console.error('Erreur de chargement des véhicules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setImmatriculation('');
    setCapacite('30');
    setSelectedChauffeurId('');
    setSelectedImageUrl(PRESETS_VEHICLES[0].url);
    setCustomImageUrl('');
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVehicleId(null);
    setImmatriculation('');
    setCapacite('30');
    setSelectedChauffeurId('');
    setSelectedImageUrl(PRESETS_VEHICLES[0].url);
    setCustomImageUrl('');
  };

  const handleEditClick = (vh: Vehicle) => {
    setEditingVehicleId(vh.id);
    setImmatriculation(vh.immatriculation);
    setCapacite(vh.capacite.toString());
    setSelectedChauffeurId(vh.chauffeurId || '');
    setSelectedImageUrl(vh.imageUrl || PRESETS_VEHICLES[0].url);
    setCustomImageUrl(vh.imageUrl && !PRESETS_VEHICLES.some(p => p.url === vh.imageUrl) ? vh.imageUrl : '');
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!immatriculation) {
      alert('Veuillez spécifier l\'immatriculation.');
      return;
    }

    try {
      await api.post('/api/vehicles', {
        immatriculation,
        capacite: parseInt(capacite, 10),
        chauffeurId: selectedChauffeurId || null,
        imageUrl: selectedImageUrl,
      });
      alert('Véhicule enregistré avec succès.');
      closeAddModal();
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erreur lors de la création du véhicule.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!immatriculation) {
      alert('Veuillez spécifier l\'immatriculation.');
      return;
    }

    try {
      await api.patch(`/api/vehicles/${editingVehicleId}`, {
        immatriculation,
        capacite: parseInt(capacite, 10),
        chauffeurId: selectedChauffeurId || '',
        imageUrl: selectedImageUrl,
      });
      alert('Véhicule modifié avec succès.');
      closeEditModal();
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erreur lors de la modification du véhicule.');
    }
  };

  const handleDeleteClick = async (id: string, immat: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le véhicule ${immat} ? Cette action est irréversible.`)) {
      try {
        await api.delete(`/api/vehicles/${id}`);
        alert('Véhicule supprimé avec succès.');
        fetchData();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.error || 'Erreur lors de la suppression du véhicule.');
      }
    }
  };

  const getVehicleStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_SERVICE':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'RETARD':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'PANNE':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'HORS_SERVICE':
        return 'bg-slate-800 text-slate-400 border border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const getVehicleStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_SERVICE':
        return 'En service';
      case 'RETARD':
        return 'Retard';
      case 'PANNE':
        return 'Panne';
      case 'HORS_SERVICE':
        return 'Hors service';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-full bg-slate-955 p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Gestion des Véhicules
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enregistrer les bus scolaires, surveiller leur statut de service et assigner des chauffeurs
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Ajouter un véhicule
          </button>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl border border-slate-850 bg-slate-900/10 p-16 text-center text-slate-500 backdrop-blur-xl">
          <Bus className="h-12 w-12 text-slate-700 mx-auto mb-3 animate-pulse" />
          <p className="font-semibold text-slate-400">Aucun véhicule enregistré</p>
          <p className="text-xs text-slate-550 mt-1">Enregistrez votre premier bus en cliquant sur le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vh) => (
            <div 
              key={vh.id} 
              className="group relative overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/30 backdrop-blur-xl transition duration-150 hover:-translate-y-1 hover:border-slate-800 flex flex-col"
            >
              {/* Cover Image of the Vehicle */}
              <div className="h-40 w-full relative bg-slate-900 overflow-hidden rounded-t-2xl">
                <img
                  src={getVehicleImageUrl(vh.imageUrl)}
                  alt={vh.immatriculation}
                  className="w-full h-full object-cover opacity-80 transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <span className={`absolute top-4 right-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getVehicleStatusBadge(vh.statut)}`}>
                  {getVehicleStatusLabel(vh.statut)}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <Bus className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{vh.immatriculation}</h3>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bus de transport</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEditClick(vh)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      title="Modifier"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(vh.id, vh.immatriculation)}
                      className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 border border-red-500/10 hover:border-red-550 text-red-500 hover:text-red-400 transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Vehicle parameters */}
                <div className="space-y-2.5 border-t border-slate-850 pt-4 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wide">
                      <Users className="h-3.5 w-3.5" /> Capacité
                    </span>
                    <span className="font-bold text-slate-200">{vh.capacite} places</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wide">
                      <User className="h-3.5 w-3.5" /> Chauffeur
                    </span>
                    <span className="font-bold text-slate-200 truncate max-w-[150px]">
                      {vh.chauffeur ? `${vh.chauffeur.prenom} ${vh.chauffeur.nom}` : (
                        <span className="text-slate-600 font-medium italic">Non assigné</span>
                      )}
                    </span>
                  </div>

                  {vh.chauffeur && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wide">
                        📞 Téléphone
                      </span>
                      <span className="font-bold text-slate-400">{vh.chauffeur.telephone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-355 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Enregistrer un véhicule</h3>
            <p className="text-xs text-slate-400 mb-6">
              Ajoutez une nouvelle unité à votre flotte de transport scolaire.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* License plate */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Immatriculation</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3.5 h-4 w-4 text-slate-550" />
                  <input
                    type="text"
                    value={immatriculation}
                    onChange={(e) => setImmatriculation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: CI-0123-AB"
                    required
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Capacité de passagers</label>
                <input
                  type="number"
                  value={capacite}
                  onChange={(e) => setCapacite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                  placeholder="Nombre de places assises"
                  min="1"
                  required
                />
              </div>

              {/* Driver select */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigner un Chauffeur</label>
                <select
                  value={selectedChauffeurId}
                  onChange={(e) => setSelectedChauffeurId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Aucun chauffeur assigné --</option>
                  {chauffeurs.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.prenom} {ch.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset cover image selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Modèle & Illustration</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {PRESETS_VEHICLES.map((preset) => {
                    const isSelected = selectedImageUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(preset.url);
                          setCustomImageUrl('');
                        }}
                        className={`relative h-20 rounded-xl overflow-hidden border transition text-left cursor-pointer ${
                          isSelected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-slate-950/40"></div>
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white shadow-sm">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload image */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ou Téléverser une photo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="vehicle-image-upload"
                  />
                  <label
                    htmlFor="vehicle-image-upload"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-450 hover:border-orange-500 hover:text-slate-200 transition cursor-pointer"
                  >
                    <ImageIcon className="h-4.5 w-4.5" />
                    {uploadingImage ? 'Téléversement en cours...' : 'Choisir un fichier image'}
                  </label>
                </div>
                {customImageUrl && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-2 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Image téléversée avec succès !
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-850 mt-6">
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
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Vehicle Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={closeEditModal}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-355 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Modifier le véhicule</h3>
            <p className="text-xs text-slate-400 mb-6">
              Modifiez les informations ou l'assignation de ce véhicule.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* License plate */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Immatriculation</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3.5 h-4 w-4 text-slate-550" />
                  <input
                    type="text"
                    value={immatriculation}
                    onChange={(e) => setImmatriculation(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: CI-0123-AB"
                    required
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Capacité de passagers</label>
                <input
                  type="number"
                  value={capacite}
                  onChange={(e) => setCapacite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                  placeholder="Nombre de places assises"
                  min="1"
                  required
                />
              </div>

              {/* Driver select */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigner un Chauffeur</label>
                <select
                  value={selectedChauffeurId}
                  onChange={(e) => setSelectedChauffeurId(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Aucun chauffeur assigné --</option>
                  {chauffeurs.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.prenom} {ch.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset cover image selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Modèle & Illustration</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {PRESETS_VEHICLES.map((preset) => {
                    const isSelected = selectedImageUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(preset.url);
                          setCustomImageUrl('');
                        }}
                        className={`relative h-20 rounded-xl overflow-hidden border transition text-left cursor-pointer ${
                          isSelected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-slate-950/40"></div>
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white shadow-sm">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload image */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ou Téléverser une photo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="vehicle-image-upload-edit"
                  />
                  <label
                    htmlFor="vehicle-image-upload-edit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-450 hover:border-orange-500 hover:text-slate-200 transition cursor-pointer"
                  >
                    <ImageIcon className="h-4.5 w-4.5" />
                    {uploadingImage ? 'Téléversement en cours...' : 'Choisir un fichier image'}
                  </label>
                </div>
                {customImageUrl && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-2 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Image téléversée avec succès !
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-850 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
