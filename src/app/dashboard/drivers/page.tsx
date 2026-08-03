'use client';

import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  X, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Lock,
  User as UserIcon,
  Shield
} from 'lucide-react';
import api from '../../../services/api';
import NotificationModal, { ConfirmModal, NotificationState, ConfirmState } from '../../../components/NotificationModal';

interface Driver {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  role: string;
  statut: string;
  createdAt: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setNotification({ isOpen: true, type, message, title });
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form State
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users');
      // Filter for CHAUFFEUR role
      const filtered = res.data.filter((u: any) => u.role === 'CHAUFFEUR');
      setDrivers(filtered);
    } catch (err) {
      console.error('Erreur lors du chargement des chauffeurs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNom('');
    setPrenom('');
    setTelephone('');
    setEmail('');
    setPassword('');
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDriver(null);
    setNom('');
    setPrenom('');
    setTelephone('');
    setEmail('');
    setPassword('');
  };

  const handleEditClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setNom(driver.nom);
    setPrenom(driver.prenom);
    setTelephone(driver.telephone);
    setEmail(driver.email || '');
    setPassword(''); // leave blank unless changing password
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !telephone || !password) {
      notify('warning', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      await api.post('/api/users', {
        nom,
        prenom,
        telephone,
        email: email || null,
        password,
        role: 'CHAUFFEUR',
      });
      notify('success', 'Chauffeur enregistré avec succès.');
      closeAddModal();
      fetchDrivers();
    } catch (err: any) {
      console.error(err);
      notify('error', err.response?.data?.error || 'Erreur lors de la création du chauffeur.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !telephone) {
      notify('warning', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const payload: any = {
        nom,
        prenom,
        telephone,
        email: email || null,
      };
      if (password) {
        payload.password = password;
      }

      await api.patch(`/api/users/${selectedDriver?.id}`, payload);
      notify('success', 'Informations du chauffeur mises à jour.');
      closeEditModal();
      fetchDrivers();
    } catch (err: any) {
      console.error(err);
      notify('error', err.response?.data?.error || 'Erreur lors de la modification du chauffeur.');
    }
  };

  const handleDeleteClick = async (id: string, fullName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Supprimer ce chauffeur ?',
      message: `Êtes-vous sûr de vouloir supprimer le compte du chauffeur ${fullName} ? Cette action libérera automatiquement tout véhicule auquel il est associé.`,
      confirmLabel: 'Supprimer le compte',
      onConfirm: async () => {
        try {
          await api.delete(`/api/users/${id}`);
          notify('success', 'Compte chauffeur supprimé avec succès.');
          fetchDrivers();
        } catch (err: any) {
          console.error(err);
          notify('error', err.response?.data?.error || 'Erreur lors de la suppression du chauffeur.');
        }
      },
    });
  };

  // Filtered drivers based on search query
  const filteredDrivers = drivers.filter((driver) => {
    const fullName = `${driver.prenom} ${driver.nom}`.toLowerCase();
    const phone = driver.telephone.toLowerCase();
    const emailStr = (driver.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || phone.includes(query) || emailStr.includes(query);
  });

  return (
    <div className="min-h-full bg-black p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Gestion des Chauffeurs
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Enregistrez les chauffeurs de votre compagnie et mettez à jour leurs identifiants de connexion mobile.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 min-h-[44px] text-sm font-semibold w-full sm:w-auto transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Ajouter un chauffeur
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 bg-[#121212] border border-zinc-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-slate-550 focus:outline-none focus:border-orange-500 transition"
          />
        </div>
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Total : {filteredDrivers.length} chauffeur(s)
        </div>
      </div>

      {/* Table List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-16 text-center text-zinc-500 backdrop-blur-xl">
          <UserIcon className="h-12 w-12 text-slate-700 mx-auto mb-3 animate-pulse" />
          <p className="font-semibold text-zinc-400">Aucun chauffeur trouvé</p>
          <p className="text-xs text-zinc-500 mt-1">Créez un nouveau chauffeur ou affinez votre filtre de recherche.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#121212] backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-black/40 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-4 px-6">Nom Complet</th>
                <th className="py-4 px-6">Téléphone</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Date de création</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-sm text-zinc-200">
              {filteredDrivers.map((driver) => {
                const fullName = `${driver.prenom} ${driver.nom}`;
                return (
                  <tr key={driver.id} className="hover:bg-[#121212] transition">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <UserIcon className="h-4 w-4 text-orange-500" />
                      </div>
                      {fullName}
                    </td>
                    <td className="py-4 px-6 font-mono text-zinc-300">{driver.telephone}</td>
                    <td className="py-4 px-6 text-zinc-400">{driver.email || <span className="italic text-slate-600">Non renseigné</span>}</td>
                    <td className="py-4 px-6 text-zinc-400">
                      {new Date(driver.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(driver)}
                          className="p-2 rounded-lg bg-slate-805 hover:bg-slate-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(driver.id, fullName)}
                          className="p-2 rounded-lg bg-red-955/20 hover:bg-red-900/30 border border-red-500/10 hover:border-red-550 text-red-500 hover:text-red-400 transition cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={closeAddModal}
              className="absolute right-4 top-4 text-zinc-500 hover:text-slate-355 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Ajouter un Chauffeur</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Enregistrez un nouveau chauffeur pour piloter vos véhicules.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Moussa"
                    required
                  />
                </div>
                {/* Last name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Bamba"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: 0202020202"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Adresse Email (Optionnel)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="chauffeur@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Mot de passe de connexion mobile</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Ce mot de passe permettra au chauffeur de s'authentifier sur l'application mobile de tracking.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-zinc-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
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

      {/* Edit Driver Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={closeEditModal}
              className="absolute right-4 top-4 text-zinc-500 hover:text-slate-355 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Modifier le Chauffeur</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Mettez à jour les informations de profil ou modifiez le mot de passe de connexion.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Moussa"
                    required
                  />
                </div>
                {/* Last name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Bamba"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: 0202020202"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Adresse Email (Optionnel)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="chauffeur@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nouveau mot de passe (Optionnel)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Laisser vide pour ne pas modifier"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-zinc-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
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

      {/* Popups & Notifications */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
      <ConfirmModal confirmState={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
