'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  QrCode, 
  UploadCloud, 
  FileSpreadsheet, 
  Check, 
  X, 
  AlertCircle,
  MoreVertical,
  Calendar,
  DollarSign,
  Plus,
  Phone,
  Mail,
  Lock
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface User {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  role: string;
  statut: string;
  qrToken: string;
  createdAt: string;
}

export default function SubscribersPage() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals state
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Manual creation form state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Activation form state
  const [subType, setSubType] = useState('ALLER_RETOUR');
  const [montant, setMontant] = useState('15000');
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  // Import file upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importReport, setImportReport] = useState<{ success: number; errors: number; details: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSubscribers = async () => {
    try {
      const res = await api.get('/api/users');
      // Filtrer pour n'afficher que les USAGERs
      const filtered = res.data.filter((u: any) => u.role === 'USAGER');
      setSubscribers(filtered);
    } catch (err) {
      console.error('Erreur lors du chargement des abonnés:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Actions
  const handleResetQr = async (id: string) => {
    if (!confirm('Voulez-vous vraiment réinitialiser le code QR de cet abonné ?')) return;
    try {
      await api.patch(`/api/users/${id}/qr/reset`);
      alert('Code QR réinitialisé avec succès.');
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la réinitialisation du code QR.');
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Voulez-vous suspendre l\'abonnement de cet usager ?')) return;
    try {
      await api.patch(`/api/users/${id}/subscription`, { statut: 'SUSPENDU' });
      alert('Abonnement suspendu.');
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suspension de l\'abonnement.');
    }
  };

  const openActivateModal = (sub: User) => {
    setSelectedUser(sub);
    setIsActivateModalOpen(true);
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await api.patch(`/api/users/${selectedUser.id}/subscription`, {
        statut: 'ACTIF',
        type: subType,
        montant: parseFloat(montant),
        dateDebut: new Date(dateDebut).toISOString(),
        dateFin: new Date(dateFin).toISOString(),
      });
      alert('Abonnement activé avec succès.');
      setIsActivateModalOpen(false);
      setSelectedUser(null);
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'activation de l\'abonnement.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !telephone || !password) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      await api.post('/api/users', {
        nom,
        prenom,
        telephone,
        email: email || null,
        password,
        role: 'USAGER',
        statut: 'EN_ATTENTE',
      });
      alert('Abonné créé avec succès.');
      setIsAddModalOpen(false);
      setNom('');
      setPrenom('');
      setTelephone('');
      setEmail('');
      setPassword('');
      fetchSubscribers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erreur lors de la création de l\'abonné.');
    }
  };

  // Drag and Drop File Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setImportError(null);
    setImportReport(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImportReport({
        success: res.data.importedCount || 0,
        errors: res.data.errorsCount || 0,
        details: res.data.errors || [],
      });
      fetchSubscribers();
    } catch (err: any) {
      console.error('Erreur import:', err);
      setImportError(err.response?.data?.error || 'Une erreur est survenue lors de l\'importation.');
    } finally {
      setUploading(false);
    }
  };

  // Filtering
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch = 
      `${sub.prenom} ${sub.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.telephone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'ALL' || sub.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIF':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'EN_ATTENTE':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'SUSPENDU':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'EXPIRE':
        return 'bg-slate-700/20 text-slate-400 border border-slate-700/35';
      default:
        return 'bg-slate-800 text-slate-450';
    }
  };

  return (
    <div className="min-h-full bg-slate-950 p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Gestion des Abonnés
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Activer, suspendre les abonnements des élèves et importer en masse via des fichiers Excel
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Ajouter un abonné
          </button>
        </div>
      </div>

      {/* Grid: 2/3 List, 1/3 Import Zone */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left List (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un abonné (Nom, Tél)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-550 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-orange-500 transition"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIF">Abonnement Actif</option>
                <option value="EN_ATTENTE">En attente de validation</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="EXPIRE">Expiré</option>
              </select>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-xl">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <UserX className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="font-semibold text-slate-400">Aucun abonné trouvé</p>
                <p className="text-xs text-slate-550 mt-1">Essayez d'ajuster votre recherche ou filtre.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-850 text-left">
                  <thead className="bg-slate-900/60 text-xs font-bold text-slate-450 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nom complet</th>
                      <th className="px-6 py-4">Téléphone</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                    {filteredSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-900/30 transition">
                        <td className="whitespace-nowrap px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-350 border border-slate-700/50 font-bold text-sm">
                              {sub.prenom[0]}{sub.nom[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-200">
                                {sub.prenom} {sub.nom}
                              </p>
                              <p className="text-xs text-slate-500">
                                Inscrit le {new Date(sub.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 text-sm text-slate-300">
                          {sub.telephone}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadgeStyle(sub.statut)}`}>
                            {sub.statut === 'EN_ATTENTE' ? 'En attente' : sub.statut}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            {sub.statut !== 'ACTIF' ? (
                              <button
                                onClick={() => openActivateModal(sub)}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                                title="Activer l'abonnement"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Activer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(sub.id)}
                                className="inline-flex items-center gap-1 bg-red-950/40 hover:bg-red-950/70 border border-red-500/20 text-red-400 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                                title="Suspendre l'abonnement"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Suspendre
                              </button>
                            )}

                            <button
                              onClick={() => handleResetQr(sub.id)}
                              className="inline-flex items-center justify-center h-7.5 w-7.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-lg transition duration-150 cursor-pointer"
                              title="Réinitialiser QR Code"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Batch Import (1/3 width) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-2">Importation de Masse</h3>
            <p className="text-xs text-slate-400 mb-6">
              Téléversez un fichier Excel (.xlsx) ou CSV pour inscrire automatiquement de nouveaux abonnés dans votre base de données.
            </p>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition duration-150 ${
                isDragging 
                  ? 'border-orange-500 bg-orange-500/5' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.csv"
                className="hidden"
              />
              
              {uploading ? (
                <>
                  <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-semibold text-slate-300">Traitement du fichier...</p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-slate-500 mb-4" />
                  <p className="text-sm font-semibold text-slate-300">
                    Glisser-déposer le fichier Excel/CSV
                  </p>
                  <p className="text-xs text-slate-550 mt-1">
                    Ou cliquez pour parcourir vos dossiers
                  </p>
                </>
              )}
            </div>

            {/* Download Template Link */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-orange-500 hover:text-orange-400 transition cursor-pointer">
              <FileSpreadsheet className="h-4 w-4" />
              <a href="/templates/import_template.xlsx" download>Télécharger le modèle de fichier</a>
            </div>

            {/* Import Status Reports */}
            {importError && (
              <div className="flex gap-2 bg-red-950/20 border border-red-500/20 rounded-xl p-4 mt-6 text-xs text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Échec de l'importation</p>
                  <p className="mt-1">{importError}</p>
                </div>
              </div>
            )}

            {importReport && (
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 mt-6 space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Rapport d'importation</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                    <span className="text-lg font-bold text-emerald-400">{importReport.success}</span>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Importés</p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                    <span className="text-lg font-bold text-red-400">{importReport.errors}</span>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Échecs</p>
                  </div>
                </div>
                
                {importReport.details.length > 0 && (
                  <div className="pt-2 border-t border-slate-900">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Erreurs rencontrées :</p>
                    <ul className="text-[10px] text-red-400/80 list-disc list-inside space-y-1 max-h-36 overflow-y-auto pr-1">
                      {importReport.details.map((detail, idx) => (
                        <li key={idx} className="leading-relaxed">{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activation Modal */}
      {isActivateModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsActivateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Activer l'abonnement</h3>
            <p className="text-xs text-slate-400 mb-6">
              Configurez le forfait de transport pour <span className="font-bold text-slate-200">{selectedUser.prenom} {selectedUser.nom}</span>.
            </p>

            <form onSubmit={handleActivateSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type d'abonnement</label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALLER">ALLER (Matin seulement)</option>
                  <option value="RETOUR">RETOUR (Soir seulement)</option>
                  <option value="ALLER_RETOUR">ALLER-RETOUR (Complet)</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Montant (FCFA)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                    placeholder="Montant payé"
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date début</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date fin</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-850 mt-6">
                <button
                  type="button"
                  onClick={() => setIsActivateModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Valider l'abonnement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Subscriber Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-355 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Ajouter un Abonné</h3>
            <p className="text-xs text-slate-400 mb-6">
              Créez manuellement un compte pour un nouvel abonné (élève/usager).
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Abel"
                    required
                  />
                </div>
                {/* Last name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Koffi"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-550" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: 0303030303"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Adresse Email (Optionnel)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-550" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="abel@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mot de passe de connexion mobile</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-550" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-550 mt-1">
                  Ce mot de passe permettra à l'élève ou à son tuteur de s'authentifier sur l'application mobile.
                </p>
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
    </div>
  );
}
