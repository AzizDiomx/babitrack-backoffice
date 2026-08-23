'use client';

import React, { useEffect, useState } from 'react';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Coins,
  CreditCard,
  RefreshCw,
  FileText
} from 'lucide-react';
import api from '../../../services/api';
import NotificationModal, { NotificationState } from '../../../components/NotificationModal';

interface PaymentRequest {
  id: string;
  companyId: string;
  companyName?: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  status: string;
  createdAt: string;
  company?: {
    name: string;
    subdomain: string | null;
  };
}

export default function SuperAdminBillingPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/payment-requests');
      setPaymentRequests(res.data);
    } catch (err) {
      console.error('Erreur chargement demandes de paiement:', err);
      notify('error', 'Erreur serveur', 'Impossible de charger l\'historique des règlements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const handleApprovePayment = async (requestId: string) => {
    try {
      await api.patch(`/api/payment-requests/${requestId}/approve`);
      notify('success', 'Paiement Approuvé !', 'Le règlement a été validé avec succès. La licence et les quotas ont été automatiquement mis à jour.');
      fetchPaymentRequests();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur d\'approbation', err.response?.data?.error || 'Erreur lors de la validation du paiement.');
    }
  };

  const handleRejectPayment = async (requestId: string) => {
    try {
      await api.patch(`/api/payment-requests/${requestId}/reject`, { notes: 'Référence de transaction introuvable ou montant non reçu.' });
      notify('info', 'Demande Rejetée', 'La demande de paiement a été rejetée.');
      fetchPaymentRequests();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur de rejet', err.response?.data?.error || 'Erreur lors du rejet.');
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

  // Aggregated totals
  const pendingRequests = paymentRequests.filter(p => p.status === 'PENDING');
  const totalApprovedAmount = paymentRequests
    .filter(p => p.status === 'APPROVED')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Facturation & Suivi des Règlements
            </h1>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              Recouvrement SaaS
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Validez les preuves de virement Mobile Money / Banque et suivez le chiffre d'affaires collecté.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchPaymentRequests}
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Paiements En Attente</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">{pendingRequests.length}</span>
          <span className="text-[10px] font-semibold text-zinc-400">Preuves de paiement à vérifier</span>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Encaissements Validés</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Coins className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">
            {totalApprovedAmount.toLocaleString('fr-FR')} FCFA
          </span>
          <span className="text-[10px] font-semibold text-emerald-400">Total recettes enregistrées</span>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Moyens de Paiement</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <CreditCard className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">Multi-Canaux</span>
          <span className="text-[10px] font-semibold text-zinc-400">Wave, Orange Money, Virement</span>
        </div>
      </div>

      {/* Payment Requests Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : paymentRequests.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-16 text-center text-zinc-500 backdrop-blur-xl">
          <Receipt className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
          <p className="font-bold text-zinc-300">Aucune demande de paiement reçue</p>
          <p className="text-xs text-zinc-500 mt-1">
            Les demandes de renouvellement et preuves de paiement apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#121212] backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Historique des Transactions ({paymentRequests.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-black text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Compagnie Client</th>
                  <th className="px-6 py-4">Réf. Transaction</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Moyen de Paiement</th>
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-black/40">
                {paymentRequests.map((req) => {
                  const companyName = req.company?.name || req.companyName || 'Compagnie';
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';

                  return (
                    <tr key={req.id} className="hover:bg-zinc-800/20 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                            <Building2 className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <span className="block font-bold text-zinc-100">{companyName}</span>
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                              ID: {req.companyId ? req.companyId.substring(0, 8) : 'N/A'}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-300">
                        {req.transactionRef || 'N/A'}
                      </td>

                      <td className="px-6 py-4 font-extrabold text-white text-base">
                        {req.amount.toLocaleString('fr-FR')} FCFA
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-700 uppercase tracking-wider">
                          {req.paymentMethod}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-zinc-400 font-medium">
                        {formatDate(req.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isApproved 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {isApproved ? 'Approuvé' : isPending ? 'En attente' : 'Rejeté'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectPayment(req.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Rejeter
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(req.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/10"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approuver
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 font-medium">Traité</span>
                        )}
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
