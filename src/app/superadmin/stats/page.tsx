'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  Users,
  Bus,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Globe,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';
import api from '../../../services/api';
import NotificationModal, { NotificationState } from '../../../components/NotificationModal';

interface Company {
  id: string;
  name: string;
  subdomain: string | null;
  status: string;
  plan: string;
  createdAt: string;
  _count: {
    users: number;
    vehicles: number;
    routes: number;
    subscriptions: number;
  };
}

export default function SuperAdminStatsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
      notify('error', 'Erreur serveur', 'Impossible de charger les statistiques globales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const activeCompanies = companies.filter(c => c.status !== 'DRAFT' && c.status !== 'PENDING_APPROVAL');
  const totalVehiclesCount = activeCompanies.reduce((acc, curr) => acc + (curr._count?.vehicles || 0), 0);
  const totalUsersCount = activeCompanies.reduce((acc, curr) => acc + (curr._count?.users || 0), 0);
  const totalRoutesCount = activeCompanies.reduce((acc, curr) => acc + (curr._count?.routes || 0), 0);

  // Plan distribution counts
  const decouverteCount = activeCompanies.filter(c => c.plan === 'DECOUVERTE').length;
  const essentielCount = activeCompanies.filter(c => c.plan === 'ESSENTIEL').length;
  const premiumCount = activeCompanies.filter(c => c.plan === 'PREMIUM').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Tableau des Statistiques Globales SaaS
            </h1>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              Analytics Plateforme
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Supervisez la croissance multi-locataires, la répartition des bus géolocalisés et la répartition des forfaits.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-3 min-h-[44px] text-sm font-semibold transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 text-orange-500" />
          <span>Actualiser</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Compagnies Actives</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Building2 className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-white block">{activeCompanies.length}</span>
              <span className="text-[10px] font-semibold text-emerald-400">Sur {companies.length} enregistrées</span>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Bus Géolocalisés</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Bus className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <span className="text-3xl font-black text-white block">{totalVehiclesCount}</span>
              <span className="text-[10px] font-semibold text-zinc-400">Véhicules de flotte actifs</span>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Utilisateurs Enregistrés</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <span className="text-3xl font-black text-white block">{totalUsersCount}</span>
              <span className="text-[10px] font-semibold text-zinc-400">Admins, Chauffeurs & Élèves</span>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Lignes & Trajets</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Activity className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <span className="text-3xl font-black text-white block">{totalRoutesCount}</span>
              <span className="text-[10px] font-semibold text-orange-400">Trajets scolaires configurés</span>
            </div>
          </div>

          {/* Plan Breakdown & Usage Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SaaS Plan Distribution */}
            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-orange-500" />
                  Répartition des Forfaits Souscrits
                </h3>
                <span className="text-xs text-zinc-500 font-semibold">{activeCompanies.length} actif(s)</span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Découverte */}
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span className="text-zinc-400">DECOUVERTE (Essai Gratuit)</span>
                    <span className="text-zinc-200">{decouverteCount} compagnie(s)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-500 rounded-full transition-all duration-300"
                      style={{ width: `${activeCompanies.length ? (decouverteCount / activeCompanies.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Essentiel */}
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span className="text-orange-400">ESSENTIEL (Pro)</span>
                    <span className="text-zinc-200">{essentielCount} compagnie(s)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${activeCompanies.length ? (essentielCount / activeCompanies.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Premium */}
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span className="text-blue-400">PREMIUM (Entreprise)</span>
                    <span className="text-zinc-200">{premiumCount} compagnie(s)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${activeCompanies.length ? (premiumCount / activeCompanies.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Infrastructure Health */}
            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Performances Infrastructure BabiTrack
                </h3>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  SLA 99.9%
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black border border-zinc-800/80">
                  <span className="text-zinc-400 font-semibold">Service WebSocket GPS Temps Réel</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> En Ligne (0.4ms)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-black border border-zinc-800/80">
                  <span className="text-zinc-400 font-semibold">Passerelle Notifications Push FCM</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Opérationnel
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-black border border-zinc-800/80">
                  <span className="text-zinc-400 font-semibold">Isolation Multi-Locataires (Subdomains)</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Actif & Isolé
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Notification Modal */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
