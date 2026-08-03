'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Bus, 
  MapPin, 
  ShieldAlert,
  Wrench,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import api from '../../../services/api';
import NotificationModal, { ConfirmModal, NotificationState, ConfirmState } from '../../../components/NotificationModal';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  sentAt: string;
}

interface Vehicle {
  id: string;
  immatriculation: string;
  capacite: number;
  statut: string;
  chauffeur: {
    prenom: string;
    nom: string;
    telephone: string;
  } | null;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Notification[]>([]);
  const [troubledVehicles, setTroubledVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setNotification({ isOpen: true, type, message, title });
  };

  const fetchData = async () => {
    try {
      const [resNotifications, resVehicles] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/vehicles'),
      ]);
      
      // Filtrer les notifications pour ne garder que les incidents (PANNE, RETARD, ANNULATION)
      const incidentTypes = ['PANNE', 'RETARD', 'ANNULATION'];
      const filteredIncidents = resNotifications.data.filter((n: any) => 
        incidentTypes.includes(n.type)
      );
      setIncidents(filteredIncidents);

      // Filtrer les véhicules en état critique (PANNE ou RETARD)
      const criticalStatus = ['PANNE', 'RETARD'];
      const criticalVehicles = resVehicles.data.filter((v: any) => 
        criticalStatus.includes(v.statut)
      );
      setTroubledVehicles(criticalVehicles);
    } catch (err) {
      console.error('Erreur lors du chargement des incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh incident logs every 20 seconds
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveVehicle = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Résoudre cet incident ?',
      message: 'Voulez-vous marquer cet incident de véhicule comme résolu (remettre HORS_SERVICE) ?',
      confirmLabel: 'Résoudre l\'incident',
      onConfirm: async () => {
        try {
          await api.patch(`/api/vehicles/${id}/status`, { statut: 'HORS_SERVICE' });
          notify('success', 'Statut du véhicule réinitialisé.');
          fetchData();
        } catch (err) {
          console.error(err);
          notify('error', 'Erreur lors de la résolution du statut.');
        }
      },
    });
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'PANNE':
        return <Wrench className="h-5 w-5 text-red-500" />;
      case 'RETARD':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-purple-500" />;
    }
  };

  const getIncidentBorderColor = (type: string) => {
    switch (type) {
      case 'PANNE':
        return 'border-l-red-500';
      case 'RETARD':
        return 'border-l-amber-500';
      default:
        return 'border-l-purple-500';
    }
  };

  return (
    <div className="min-h-full bg-black p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Signalement d'Incidents
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Suivi en direct des anomalies signalées sur le réseau routier par vos chauffeurs
          </p>
        </div>
      </div>

      {/* Grid: Troubled Vehicles (1/3) & Incidents Log (2/3) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Troubled Vehicles (1/3) */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl h-fit">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Flotte en alerte ({troubledVehicles.length})
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            Bus qui ont actuellement signalé un problème mécanique ou un retard de trafic.
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-6">
              <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : troubledVehicles.length === 0 ? (
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-emerald-400 text-xs">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>Aucun véhicule en détresse actuellement. Flotte opérationnelle.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {troubledVehicles.map((v) => (
                <div 
                  key={v.id}
                  className="rounded-xl border border-zinc-800 bg-black/40 p-4 space-y-3 hover:border-zinc-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                      <Bus className="h-4 w-4 text-orange-500" />
                      {v.immatriculation}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      v.statut === 'PANNE' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {v.statut}
                    </span>
                  </div>

                  {v.chauffeur && (
                    <div className="text-xs text-zinc-400 space-y-1">
                      <p>Chauffeur : <span className="font-semibold text-zinc-200">{v.chauffeur.prenom} {v.chauffeur.nom}</span></p>
                      <p>Contact : <span className="font-semibold text-zinc-300">{v.chauffeur.telephone}</span></p>
                    </div>
                  )}

                  <button
                    onClick={() => handleResolveVehicle(v.id)}
                    className="w-full text-center bg-slate-800 hover:bg-slate-700 text-zinc-200 font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
                  >
                    Marquer comme Résolu
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incidents Timeline Log (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-6">
              Journal de bord des incidents
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <CheckCircle className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="font-semibold text-zinc-400">Aucun incident à signaler</p>
                <p className="text-xs text-zinc-500 mt-1">Tous les trajets se déroulent normalement pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((inc) => (
                  <div 
                    key={inc.id}
                    className={`border-l-4 ${getIncidentBorderColor(inc.type)} bg-[#121212] border border-y-slate-850 border-r-slate-850 rounded-xl p-5 hover:border-zinc-800 transition`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {getIncidentIcon(inc.type)}
                        <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                          {inc.type}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 font-medium">
                        {new Date(inc.sentAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-200 mb-1">{inc.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{inc.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popups & Notifications */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
      <ConfirmModal confirmState={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
