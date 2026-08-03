'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Send, 
  Calendar, 
  Info, 
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle
} from 'lucide-react';
import api from '../../../services/api';
import NotificationModal, { NotificationState } from '../../../components/NotificationModal';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  sentAt: string;
  admin: {
    prenom: string;
    nom: string;
  } | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setNotification({ isOpen: true, type, message, title });
  };

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');
  const [severity, setSeverity] = useState('LOW');
  const [audience, setAudience] = useState('TOUS');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Erreur de chargement des notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      notify('warning', 'Veuillez remplir le titre et le message.');
      return;
    }

    setSending(true);
    try {
      await api.post('/api/notifications/send', {
        title,
        message,
        type,
        severity,
        audience,
      });

      notify('success', 'Notification Push diffusée avec succès aux usagers.');
      setTitle('');
      setMessage('');
      setType('INFO');
      setSeverity('LOW');
      setAudience('TOUS');
      fetchNotifications();
    } catch (err: any) {
      console.error(err);
      notify('error', err.response?.data?.error || 'Erreur lors de l\'envoi de la notification.');
    } finally {
      setSending(false);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PANNE':
        return '#ef4444'; // Rouge
      case 'RETARD':
        return '#f59e0b'; // Ambre
      case 'ANNULATION':
        return '#7c3aed'; // Violet
      case 'CHANGEMENT_ITINERAIRE':
        return '#3b82f6'; // Bleu
      case 'URGENT':
        return '#dc2626'; // Rouge vif
      default:
        return '#64748b'; // Ardoise
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-800 text-zinc-400 border border-slate-700/50';
    }
  };

  return (
    <div className="min-h-full bg-black p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Alertes & Notifications Push
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Diffuser des alertes de trafic ou des annonces générales aux parents et aux élèves
          </p>
        </div>
      </div>

      {/* Grid: Form (1/3) & History (2/3) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Send Form (1/3 width) */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl h-fit">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Nouvelle diffusion
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            Le message sera instantanément transmis par notification push sur les smartphones des élèves.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Titre de l'alerte</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                placeholder="Titre accrocheur..."
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                placeholder="Rédigez le contenu du message ici..."
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Type d'alerte</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
              >
                <option value="INFO">INFORMATION GÉNÉRALE</option>
                <option value="URGENT">URGENT</option>
                <option value="PANNE">PANNE DE CAR</option>
                <option value="RETARD">RETARD DE TRAJET</option>
                <option value="ANNULATION">ANNULATION DE SERVICE</option>
                <option value="CHANGEMENT_ITINERAIRE">CHANGEMENT D'ITINÉRAIRE</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Niveau de gravité</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
              >
                <option value="LOW">BASSE (Info simple)</option>
                <option value="MEDIUM">MOYENNE (Retard...)</option>
                <option value="HIGH">HAUTE (Panne, Annulation...)</option>
              </select>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 text-sm transition duration-150 cursor-pointer disabled:opacity-50 mt-6 shadow-md shadow-orange-600/10"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Diffusion...' : 'Diffuser l\'alerte'}
            </button>
          </form>
        </div>

        {/* History List (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-450" />
              Historique des diffusions
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <CheckCircle className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="font-semibold text-zinc-400">Aucune alerte diffusée</p>
                <p className="text-xs text-zinc-500 mt-1">Les messages envoyés par la compagnie apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    style={{ borderLeftColor: getNotificationColor(notif.type) }}
                    className="border-l-4 bg-[#121212] border border-y-slate-850 border-r-slate-850 rounded-xl p-5 hover:border-zinc-800 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span 
                          style={{ color: getNotificationColor(notif.type) }}
                          className="text-xs font-bold uppercase tracking-wider"
                        >
                          {notif.type}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${getSeverityBadge(notif.severity)}`}>
                          {notif.severity}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(notif.sentAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-bold text-zinc-200 mb-1.5">{notif.title}</h4>
                    <p className="text-xs leading-relaxed text-zinc-400">{notif.message}</p>
                    
                    {notif.admin && (
                      <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                        Par: {notif.admin.prenom} {notif.admin.nom}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popups & Notifications */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
