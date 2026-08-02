'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Bus, 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Clock,
  CheckCircle2,
  UserCheck,
  Navigation,
  User
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DynamicMap from '../../components/DynamicMap';

interface DashboardStats {
  activeSubscriptions: number;
  activeVehicles: number;
  brokenVehicles: number;
  notificationsCount: number;
}

interface EmbarkationPassenger {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  scanTime: string;
}

interface EmbarkationSummary {
  vehicleId: string;
  immatriculation: string;
  capacite: number;
  statut: string;
  routeName: string;
  routeType: string | null;
  totalScans: number;
  uniqueCount: number;
  passengers: EmbarkationPassenger[];
}

// Dummy data for weekly boardings
const dummyWeeklyData = [
  { name: 'Lun', boardings: 120 },
  { name: 'Mar', boardings: 145 },
  { name: 'Mer', boardings: 130 },
  { name: 'Jeu', boardings: 165 },
  { name: 'Ven', boardings: 190 },
  { name: 'Sam', boardings: 45 },
  { name: 'Dim', boardings: 10 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [embarkations, setEmbarkations] = useState<EmbarkationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/api/dashboard/stats');
      setStats(res.data.stats);
      setEmbarkations(res.data.embarkationsToday);
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black text-zinc-400">
        <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Chargement des données du tableau de bord...</p>
      </div>
    );
  }

  const kpis = [
    {
      name: 'Abonnés Actifs',
      value: stats?.activeSubscriptions ?? 0,
      change: '+4.2%',
      trending: true,
      icon: Users,
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-500',
    },
    {
      name: 'Véhicules en Service',
      value: stats?.activeVehicles ?? 0,
      change: '100% de la flotte',
      trending: null,
      icon: Bus,
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-500',
    },
    {
      name: 'Véhicules en Panne',
      value: stats?.brokenVehicles ?? 0,
      change: 'Requiert intervention',
      trending: false,
      icon: AlertTriangle,
      color: stats?.brokenVehicles && stats.brokenVehicles > 0 ? 'from-red-500/20 to-rose-500/20' : 'from-zinc-800/40 to-zinc-900/40',
      iconColor: stats?.brokenVehicles && stats.brokenVehicles > 0 ? 'text-red-500' : 'text-zinc-500',
    },
    {
      name: 'Alertes Push (24h)',
      value: stats?.notificationsCount ?? 0,
      change: 'Diffusions d\'incidents',
      trending: null,
      icon: Bell,
      color: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-500',
    },
  ];

  return (
    <div className="min-h-full bg-black p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Suivi en temps réel de la flotte de transport scolaire pour {user?.company?.name || 'votre compagnie'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 border border-zinc-800 hover:bg-zinc-800 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* SaaS Expiration / Alert Banner */}
      {(() => {
        const expiresStr = (user?.company as any)?.subscriptionExpiresAt;
        if (!expiresStr) return null;
        const expiryDate = new Date(expiresStr);
        const now = new Date();
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (diffDays < 0) {
          return (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">🚨 Licence SaaS Expirée</h4>
                  <p className="text-xs text-red-200 mt-0.5">
                    Votre abonnement BabiTrack a expiré le <span className="font-bold text-white">{expiryDate.toLocaleDateString('fr-FR')}</span>. Les ajouts de véhicules et d'abonnés sont bloqués.
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/subscription"
                className="shrink-0 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 transition text-center"
              >
                Régulariser mon abonnement
              </a>
            </div>
          );
        }

        if (diffDays <= 15) {
          return (
            <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">⚠️ Échéance d'abonnement proche (J-{diffDays})</h4>
                  <p className="text-xs text-amber-200 mt-0.5">
                    Votre licence expire le <span className="font-bold text-white">{expiryDate.toLocaleDateString('fr-FR')}</span>. Pensez à renouveler pour éviter toute interruption de service.
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/subscription"
                className="shrink-0 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 transition text-center shadow-md shadow-orange-600/20"
              >
                Renouveler mon abonnement
              </a>
            </div>
          );
        }

        return null;
      })()}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.name}
            className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {kpi.name}
                </p>
                <p className="text-3xl font-bold text-white tracking-tight mt-2">
                  {kpi.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.iconColor}`} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold">
              {kpi.trending !== null && (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${kpi.trending ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                  {kpi.trending ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.change}
                </span>
              )}
              {kpi.trending === null && (
                <span className="text-zinc-500 font-medium">
                  {kpi.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live Map & Boardings Row */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
        {/* Real-time Map (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col h-[520px] rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Suivi GPS en temps réel</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Visualisation des bus actifs et trajets de ramassage</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <DynamicMap />
          </div>
        </div>

        {/* Boardings today (1/3 width) */}
        <div className="flex flex-col h-[520px] rounded-3xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Embarquements du Jour</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Suivi des usagers par car & trajet</p>
            </div>
            <Clock className="h-5 w-5 text-zinc-500" />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {embarkations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-zinc-500">
                <CheckCircle2 className="h-10 w-10 text-zinc-700 mb-3" />
                <p className="text-sm font-semibold text-zinc-400">Aucun embarquement aujourd'hui</p>
                <p className="text-xs text-zinc-500 mt-1">Les données s'actualiseront dès qu'un élève scannera son badge.</p>
              </div>
            ) : (
              embarkations.map((emb) => {
                const percent = Math.min(100, Math.round((emb.uniqueCount / (emb.capacite || 1)) * 100));
                
                return (
                  <div 
                    key={emb.vehicleId}
                    className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 transition duration-150 hover:border-zinc-700 space-y-3"
                  >
                    {/* Bus & Route info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                          <Bus className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white tracking-wide">{emb.immatriculation}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              emb.statut === 'EN_SERVICE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {emb.statut === 'EN_SERVICE' ? 'EN SERVICE' : 'HORS SERVICE'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Navigation className="h-3 w-3 text-orange-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{emb.routeName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Unique Passenger count badge */}
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400 border border-orange-500/20">
                          <UserCheck className="h-3.5 w-3.5" />
                          {emb.uniqueCount} / {emb.capacite}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Scanned passengers list */}
                    {emb.passengers.length > 0 ? (
                      <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                          Passagers embarqués ({emb.uniqueCount})
                        </p>
                        {emb.passengers.map((p) => {
                          const dateObj = new Date(p.scanTime);
                          const timeFormatted = isNaN(dateObj.getTime()) 
                            ? '--:--' 
                            : dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div key={p.id} className="flex items-center justify-between text-xs bg-zinc-900/60 rounded-lg px-2.5 py-1.5">
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="font-semibold text-zinc-200">{p.prenom} {p.nom}</span>
                              </div>
                              <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                {timeFormatted}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600 italic pt-1">Aucun passager scanné sur ce trajet.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Analytics chart */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Activité Hebdomadaire</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Nombre total d'embarquements quotidiens sur les 7 derniers jours</p>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dummyWeeklyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBoardings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000', borderColor: '#27272a', borderRadius: '12px' }}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                itemStyle={{ color: '#ea580c' }}
              />
              <Area 
                type="monotone" 
                dataKey="boardings" 
                name="Embarquements"
                stroke="#ea580c" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBoardings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
