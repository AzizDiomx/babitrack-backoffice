'use client';

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Bus, 
  Users, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  Clock,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Check,
  Building2
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import NotificationModal, { NotificationState } from '../../../components/NotificationModal';

interface CompanySubscriptionInfo {
  id: string;
  name: string;
  plan: string;
  billingCycle: string;
  status: string;
  subscriptionExpiresAt: string | null;
  maxVehicles: number;
  maxUsers: number;
  _count: {
    vehicles: number;
    users: number;
  };
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanySubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MENSUEL' | 'ANNUEL'>('ANNUEL');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [saasPlans, setSaasPlans] = useState<any[]>([]);

  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setNotification({ isOpen: true, type, message, title });
  };

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/companies/my-subscription');
      setCompanyInfo(res.data);
    } catch (err) {
      console.error('Erreur chargement abonnement:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const res = await api.get('/api/payment-requests');
      setPaymentHistory(res.data);
    } catch (err) {
      console.error('Erreur chargement historique paiements:', err);
    }
  };

  const fetchSaasPlans = async () => {
    try {
      const res = await api.get('/api/saas-plans');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setSaasPlans(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement offres SaaS dynamiques:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptionInfo();
    fetchPaymentHistory();
    fetchSaasPlans();
  }, []);

  // Static Fallback Plans if DB empty
  const defaultStaticPlans = [
    {
      id: 'DECOUVERTE',
      code: 'DECOUVERTE',
      name: 'Découverte / Essai',
      badge: 'Gratuit 3 mois',
      priceMensuel: 0,
      priceAnnuel: 0,
      maxVehicles: 3,
      maxUsers: 20,
      features: [
        'Suivi GPS temps réel des bus',
        'Carte interactive avec relais',
        'Alertes de franchissement d\'arrêts',
        'Support standard par e-mail',
      ],
      popular: false,
    },
    {
      id: 'ESSENTIEL',
      code: 'ESSENTIEL',
      name: 'Essentiel Pro',
      badge: 'Populaire',
      popular: true,
      priceMensuel: 150000,
      priceAnnuel: 1500000,
      maxVehicles: 10,
      maxUsers: 150,
      features: [
        'Toutes les fonctions Découverte',
        'Jusqu\'à 10 cars scolaires',
        'Jusqu\'à 150 élèves & abonnés',
        'Notifications Push instantanées',
        'Rapports d\'activité & statistiques',
        'Clôture automatique aux terminus',
        'Support prioritaire 7j/7',
      ],
    },
    {
      id: 'PREMIUM',
      code: 'PREMIUM',
      name: 'Premium Flotte Max',
      badge: 'Pour grands réseaux',
      popular: false,
      priceMensuel: 450000,
      priceAnnuel: 4500000,
      maxVehicles: 50,
      maxUsers: 1000,
      features: [
        'Toutes les fonctions Essentiel Pro',
        'Jusqu\'à 50 cars scolaires',
        'Jusqu\'à 1 000 élèves & abonnés',
        'Google Maps Satellite HD en continu',
        'Export des données CSV & Excel',
        'Gestionnaire de compte dédié BabiTrack',
        'Support VIP 24h/24 & formation',
      ],
    },
  ];

  const rawPlans = saasPlans.length > 0 ? saasPlans : defaultStaticPlans;

  const plans = rawPlans.map((p) => {
    const code = p.code || p.id;
    const isPopular = p.popular || code === 'ESSENTIEL';
    const isPremium = code === 'PREMIUM';

    return {
      id: code,
      code: code,
      name: p.name,
      badge: p.badge || (code === 'DECOUVERTE' ? 'Gratuit 3 mois' : isPopular ? 'Populaire' : 'Sur Mesure'),
      popular: isPopular,
      priceMensuelVal: p.priceMensuel || 0,
      priceAnnuelVal: p.priceAnnuel || 0,
      priceMensuel: p.priceMensuel > 0 ? `${p.priceMensuel.toLocaleString('fr-FR')} FCFA / mois` : '0 FCFA',
      priceAnnuel: p.priceAnnuel > 0 ? `${p.priceAnnuel.toLocaleString('fr-FR')} FCFA / an` : '0 FCFA',
      discount: p.priceAnnuel > 0 ? 'Économisez 2 mois avec l\'engagement annuel' : null,
      vehicles: p.maxVehicles || p.vehicles || 3,
      users: p.maxUsers || p.users || 20,
      features: Array.isArray(p.features) ? p.features : [],
      color: isPopular
        ? 'border-orange-500/50 bg-gradient-to-b from-orange-500/10 to-zinc-900/60 shadow-lg shadow-orange-500/5'
        : isPremium
        ? 'border-blue-500/40 bg-gradient-to-b from-blue-500/10 to-zinc-900/60 shadow-lg shadow-blue-500/5'
        : 'border-zinc-800 bg-[#121212]',
      buttonColor: isPopular
        ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20'
        : isPremium
        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
    };
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-zinc-400">Chargement de votre abonnement SaaS...</p>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.id === companyInfo?.plan) || plans[0];
  const expiresDate = companyInfo?.subscriptionExpiresAt ? new Date(companyInfo.subscriptionExpiresAt) : null;
  const isExpired = expiresDate ? expiresDate < new Date() : false;

  const vehicleCount = companyInfo?._count?.vehicles ?? 0;
  const maxVehicles = companyInfo?.maxVehicles ?? 3;
  const vehiclePercent = Math.min(100, Math.round((vehicleCount / maxVehicles) * 100));

  const userCount = companyInfo?._count?.users ?? 0;
  const maxUsers = companyInfo?.maxUsers ?? 20;
  const userPercent = Math.min(100, Math.round((userCount / maxUsers) * 100));

  return (
    <div className="min-h-full bg-black p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Mon Abonnement BabiTrack SaaS
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Licence Transporteur
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Gérez votre forfait d'utilisation, vos quotas de flotte et vos options de renouvellement.
          </p>
        </div>
      </div>

      {/* Current Subscription Summary Card */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 lg:p-8 backdrop-blur-xl mb-10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600/10 border border-orange-500/20 text-orange-500">
              <CreditCard className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Forfait Actuel
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-bold text-white">{currentPlan.name}</h2>
                <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isExpired 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {isExpired ? 'Abonnement Expiré' : 'Licence Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left lg:text-right">
              <span className="text-xs font-semibold text-zinc-400 block">Date d'échéance / Expiration</span>
              <span className={`text-base font-bold mt-0.5 flex items-center gap-1.5 ${isExpired ? 'text-red-400' : 'text-white'}`}>
                <Calendar className="h-4 w-4 text-orange-500" />
                {expiresDate ? expiresDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Indéterminée'}
              </span>
            </div>

            <button
              onClick={() => {
                const element = document.getElementById('available-plans');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-xs font-bold transition duration-150 cursor-pointer shadow-md shadow-orange-600/15"
            >
              <Zap className="h-4 w-4" />
              Surclasser / Renouveler
            </button>
          </div>
        </div>

        {/* Quotas & Usage Progress Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {/* Vehicles Meter */}
          <div className="rounded-2xl bg-[#121212] border border-zinc-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Bus className="h-4 w-4 text-orange-500" />
                Flotte de Véhicules
              </span>
              <span className="text-white font-bold">{vehicleCount} / {maxVehicles} bus</span>
            </div>
            <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  vehiclePercent >= 90 ? 'bg-red-500' : vehiclePercent >= 70 ? 'bg-amber-500' : 'bg-orange-500'
                }`}
                style={{ width: `${vehiclePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              {maxVehicles - vehicleCount > 0 
                ? `Il vous reste ${maxVehicles - vehicleCount} emplacement(s) de bus disponible(s).` 
                : 'Limite de bus atteinte. Surclassez pour en ajouter.'}
            </p>
          </div>

          {/* Users Meter */}
          <div className="rounded-2xl bg-[#121212] border border-zinc-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-orange-500" />
                Comptes Abonnés & Elèves
              </span>
              <span className="text-white font-bold">{userCount} / {maxUsers} usagers</span>
            </div>
            <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  userPercent >= 90 ? 'bg-red-500' : userPercent >= 70 ? 'bg-amber-500' : 'bg-orange-500'
                }`}
                style={{ width: `${userPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              {maxUsers - userCount > 0 
                ? `Il vous reste ${maxUsers - userCount} compte(s) élève(s) disponible(s).` 
                : 'Limite d\'abonnés atteinte. Surclassez pour en ajouter.'}
            </p>
          </div>

          {/* Tenant Status Info */}
          <div className="rounded-2xl bg-[#121212] border border-zinc-800 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{companyInfo?.name}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                ID Locataire : <span className="font-mono text-zinc-300">{companyInfo?.id.substring(0, 8)}...</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available SaaS Plans Section */}
      <div id="available-plans" className="space-y-6 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Choix des Forfaits & Renouvellement</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Sélectionnez le forfait adapté à la taille de votre compagnie de transport</p>
          </div>

          {/* Billing Cycle Switch */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setBillingCycle('MENSUEL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                billingCycle === 'MENSUEL' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('ANNUEL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'ANNUEL' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Annuel</span>
              <span className="text-[9px] bg-amber-400 text-zinc-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = companyInfo?.plan === plan.id;
            const price = billingCycle === 'ANNUEL' ? plan.priceAnnuel : plan.priceMensuel;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border ${plan.color} p-6 flex flex-col justify-between relative transition duration-200 hover:-translate-y-1`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Offre Recommandée
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                    {isCurrent && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Actuel
                      </span>
                    )}
                  </div>

                  <div className="mt-6 border-b border-zinc-800/80 pb-6">
                    <p className="text-2xl font-black text-white">{price}</p>
                    {billingCycle === 'ANNUEL' && plan.discount && (
                      <p className="text-[11px] font-semibold text-emerald-400 mt-1">{plan.discount}</p>
                    )}
                  </div>

                  {/* Quotas badges */}
                  <div className="py-4 border-b border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      <Bus className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>Jusqu'à <strong className="text-white">{plan.vehicles} bus scolaires</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      <Users className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>Jusqu'à <strong className="text-white">{plan.users} élèves & abonnés</strong></span>
                    </div>
                  </div>

                  {/* Features list */}
                  <ul className="py-6 space-y-3">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanModal(plan.id);
                    setPaymentSubmitted(false);
                  }}
                  disabled={isCurrent && !isExpired}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition cursor-pointer ${plan.buttonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCurrent 
                    ? isExpired ? 'Renouveler ce forfait' : 'Forfait Déjà Actif'
                    : `Choisir le forfait ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Historique des Demandes de Règlement de la Compagnie */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-zinc-800 bg-[#121212] backdrop-blur-xl">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Historique de vos Demandes de Règlement & Trans. Mobile Money
            </h3>
            <span className="text-xs text-zinc-400 font-semibold">
              {paymentHistory.length} demande(s) enregistrée(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            {paymentHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Aucun justificatif de paiement soumis pour l'instant.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-black text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Forfait Visé</th>
                    <th className="px-6 py-4">Engagement</th>
                    <th className="px-6 py-4">Montant FCFA</th>
                    <th className="px-6 py-4">N° Réf. Trans. Justificatif</th>
                    <th className="px-6 py-4">Date Soumission</th>
                    <th className="px-6 py-4 text-right">Statut de Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-black">
                  {paymentHistory.map((item, idx) => (
                    <tr key={`hist-${item.id || idx}`} className="hover:bg-zinc-800/20 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        {item.plan}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-zinc-400">
                        {item.billingCycle}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        {item.amount ? `${item.amount.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-orange-400">
                        {item.transactionRef}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === 'PENDING' ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                            En Attente Super Admin
                          </span>
                        ) : item.status === 'APPROVED' ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            ✅ Approuvé & Prolongé
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                            ❌ Rejeté
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Payment / Upgrade Modal */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#121212] p-6 lg:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedPlanModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            {!paymentSubmitted ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Demande de souscription</h3>
                    <p className="text-xs text-zinc-400">Paiement Mobile Money / Virement pour {companyInfo?.name}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Forfait choisi :</span>
                    <span className="font-bold text-orange-400">{selectedPlanModal} ({billingCycle})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Montant total :</span>
                    <span className="font-bold text-white">
                      {(() => {
                        const targetPlan = plans.find((p) => p.id === selectedPlanModal);
                        if (!targetPlan) return '0 FCFA';
                        const amount = billingCycle === 'ANNUEL' ? targetPlan.priceAnnuelVal : targetPlan.priceMensuelVal;
                        return amount > 0 ? `${amount.toLocaleString('fr-FR')} FCFA` : '0 FCFA';
                      })()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Moyens de paiement acceptés à Abidjan :</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-xs font-bold text-orange-500 block">Orange Money</span>
                      <span className="text-[10px] text-zinc-500">+225 07 00 00 00</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-xs font-bold text-blue-400 block">Wave</span>
                      <span className="text-[10px] text-zinc-500">+225 05 00 00 00</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-xs font-bold text-yellow-500 block">MTN MoMo</span>
                      <span className="text-[10px] text-zinc-500">+225 05 00 00 00</span>
                    </div>
                  </div>
                </div>

                {/* Justificatif / Référence de Transaction */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Justificatif : N° de Trans. / Réf. Mobile Money / Virement
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="Ex: OM-8947291 ou WAVE-TX-9842"
                    required
                  />
                  <p className="text-[10px] text-zinc-500">
                    Insérez l'ID de transfert ou le n° de transaction pour accélérer la validation par le Super Admin.
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex gap-3">
                  <button
                    onClick={() => setSelectedPlanModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:bg-[#121212] transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      if (!paymentRef.trim()) {
                        notify('warning', 'Veuillez saisir le N° de transaction ou la référence de reçu Mobile Money / Virement.');
                        return;
                      }

                      try {
                        const targetPlan = plans.find((p) => p.id === selectedPlanModal);
                        const amount = targetPlan 
                          ? (billingCycle === 'ANNUEL' ? targetPlan.priceAnnuelVal : targetPlan.priceMensuelVal)
                          : 0;

                        await api.post('/api/payment-requests/pay', {
                          plan: selectedPlanModal,
                          billingCycle,
                          amount,
                          paymentMethod: 'MOBILE_MONEY',
                          transactionRef: paymentRef,
                        });

                        setPaymentSubmitted(true);
                      } catch (err: any) {
                        console.error(err);
                        notify('error', err.response?.data?.error || 'Erreur lors de la soumission de la preuve de paiement.');
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-600/20 cursor-pointer"
                  >
                    Confirmer la demande
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="h-14 w-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Demande enregistrée avec succès !</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Un conseiller BabiTrack va valider votre paiement et débloquer vos nouveaux quotas sous 15 minutes.
                </p>
                <button
                  onClick={() => setSelectedPlanModal(null)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popups & Notifications */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
