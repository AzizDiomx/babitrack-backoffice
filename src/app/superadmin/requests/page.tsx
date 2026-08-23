'use client';

import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  CheckCircle,
  Building2,
  Globe,
  Phone,
  Mail,
  Calendar,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import api from '../../../services/api';
import NotificationModal, { NotificationState } from '../../../components/NotificationModal';

interface CompanyAdmin {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
}

interface Company {
  id: string;
  name: string;
  subdomain: string | null;
  status: string;
  plan: string;
  createdAt: string;
  users: CompanyAdmin[];
}

export default function SuperAdminRequestsPage() {
  const [requests, setRequests] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/companies');
      const allCompanies: Company[] = res.data;
      // Filter requests pending approval or draft status
      setRequests(allCompanies.filter(c => c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL'));
    } catch (err) {
      console.error('Erreur lors du chargement des demandes:', err);
      notify('error', 'Erreur serveur', 'Impossible de charger les demandes d\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveCompany = async (companyId: string, companyName: string) => {
    try {
      await api.patch(`/api/companies/${companyId}/approve`);
      notify('success', 'Inscription Validée !', `La compagnie ${companyName} a été activée avec succès !`);
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur de validation', err.response?.data?.error || "Erreur lors de la validation de la compagnie.");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Demandes d'Inscription & Prospects
            </h1>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              File d'attente
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Validez les nouvelles demandes d'ouverture de comptes locataires et attribuez les accès initiaux.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-3 min-h-[44px] text-sm font-semibold transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 text-orange-500" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">En Attente</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">{requests.length}</span>
          <span className="text-[10px] font-semibold text-zinc-400">Dossiers à examiner</span>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Délai Moyen</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Calendar className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">&lt; 24h</span>
          <span className="text-[10px] font-semibold text-emerald-400">Temps de validation rapide</span>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Activation SaaS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">Automatique</span>
          <span className="text-[10px] font-semibold text-zinc-400">Génération du sous-domaine</span>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-16 text-center text-zinc-500 backdrop-blur-xl">
          <CheckCircle className="h-12 w-12 text-emerald-500/80 mx-auto mb-3" />
          <p className="font-bold text-zinc-300">Aucune demande en attente</p>
          <p className="text-xs text-zinc-500 mt-1">
            Toutes les demandes d'inscription d'entreprises ont été traitées.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#121212] backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Dossiers de Candidature ({requests.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-black text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Compagnie</th>
                  <th className="px-6 py-4">Sous-Domaine</th>
                  <th className="px-6 py-4">Contact Responsable</th>
                  <th className="px-6 py-4">Forfait</th>
                  <th className="px-6 py-4">Date de demande</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-black/40">
                {requests.map((req) => {
                  const admin = req.users && req.users.length > 0 ? req.users[0] : null;

                  return (
                    <tr key={req.id} className="hover:bg-zinc-800/20 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                            <Building2 className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <span className="block font-bold text-zinc-100">{req.name}</span>
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                              ID: {req.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-zinc-300">
                        <div className="flex items-center gap-1 text-orange-400">
                          <Globe className="h-3.5 w-3.5" />
                          {req.subdomain ? `${req.subdomain}.babitrack.com` : 'Non défini'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        {admin ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-zinc-200 block">
                              {admin.prenom} {admin.nom}
                            </span>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Phone className="h-3 w-3 text-zinc-500" />
                              <span>{admin.telephone}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">Pas de contact admin</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                          {req.plan}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-zinc-400 font-medium">
                        {formatDate(req.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleApproveCompany(req.id, req.name)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/10"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approuver & Activer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
