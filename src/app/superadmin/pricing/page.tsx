'use client';

import React, { useEffect, useState } from 'react';
import {
  Coins,
  Plus,
  CheckCircle,
  Sparkles,
  Edit,
  Building,
  Bus,
  Users,
  Shield,
  X,
  RefreshCw
} from 'lucide-react';
import api from '../../../services/api';
import NotificationModal, { NotificationState } from '../../../components/NotificationModal';

interface SaasPlanItem {
  id: string;
  code: string;
  name: string;
  badge: string | null;
  priceMensuel: number;
  priceAnnuel: number;
  maxVehicles: number;
  maxUsers: number;
  features: string[];
  popular: boolean;
}

const PREDEFINED_PLATFORM_FEATURES = [
  'Suivi GPS temps réel des bus sur carte',
  'Carte interactive avec arrêts & relais',
  'Filtrage de trajet (Aller Matin / Retour Soir)',
  'Notifications Push instantanées (approche bus, retards)',
  'Signalement & suivi des incidents par les chauffeurs',
  'Mode Carte Google Maps Satellite HD',
  'Clôture automatique du bus aux terminus',
  'Exportation des données au format CSV & Excel',
  'Support technique prioritaire 7j/7',
  'Gestionnaire de compte dédié BabiTrack & Formation',
];

export default function SuperAdminPricingPage() {
  const [plans, setPlans] = useState<SaasPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlanItem | null>(null);

  // Form State
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [planBadge, setPlanBadge] = useState('');
  const [planPriceMensuel, setPlanPriceMensuel] = useState('0');
  const [planPriceAnnuel, setPlanPriceAnnuel] = useState('0');
  const [planMaxVehicles, setPlanMaxVehicles] = useState('5');
  const [planMaxUsers, setPlanMaxUsers] = useState('50');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [planPopular, setPlanPopular] = useState(false);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/saas-plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Erreur chargement offres SaaS:', err);
      notify('error', 'Erreur serveur', 'Impossible de charger la grille tarifaire.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openPlanModal = (plan?: SaasPlanItem) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanCode(plan.code);
      setPlanName(plan.name);
      setPlanBadge(plan.badge || '');
      setPlanPriceMensuel(String(plan.priceMensuel));
      setPlanPriceAnnuel(String(plan.priceAnnuel));
      setPlanMaxVehicles(String(plan.maxVehicles));
      setPlanMaxUsers(String(plan.maxUsers));
      setSelectedFeatures(Array.isArray(plan.features) ? plan.features : []);
      setPlanPopular(plan.popular);
    } else {
      setEditingPlan(null);
      setPlanCode('');
      setPlanName('');
      setPlanBadge('');
      setPlanPriceMensuel('100000');
      setPlanPriceAnnuel('1000000');
      setPlanMaxVehicles('5');
      setPlanMaxUsers('50');
      setSelectedFeatures([
        PREDEFINED_PLATFORM_FEATURES[0],
        PREDEFINED_PLATFORM_FEATURES[1],
        PREDEFINED_PLATFORM_FEATURES[2],
      ]);
      setPlanPopular(false);
    }
    setCustomFeatureInput('');
    setIsPlanModalOpen(true);
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleAddCustomFeature = () => {
    if (!customFeatureInput.trim()) return;
    const cleanFeat = customFeatureInput.trim();
    if (!selectedFeatures.includes(cleanFeat)) {
      setSelectedFeatures((prev) => [...prev, cleanFeat]);
    }
    setCustomFeatureInput('');
  };

  const handleSavePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planCode || !planName) {
      notify('warning', 'Champs requis', 'Le code et le nom de l\'offre sont requis.');
      return;
    }

    const payload = {
      code: planCode.toUpperCase().trim(),
      name: planName,
      badge: planBadge ? planBadge.trim() : null,
      priceMensuel: parseFloat(planPriceMensuel) || 0,
      priceAnnuel: parseFloat(planPriceAnnuel) || 0,
      maxVehicles: parseInt(planMaxVehicles, 10) || 3,
      maxUsers: parseInt(planMaxUsers, 10) || 20,
      features: selectedFeatures,
      popular: planPopular,
    };

    try {
      if (editingPlan) {
        await api.put(`/api/saas-plans/${editingPlan.id}`, payload);
        notify('success', 'Offre mise à jour', 'L\'offre SaaS a été mise à jour avec succès.');
      } else {
        await api.post('/api/saas-plans', payload);
        notify('success', 'Nouvelle offre créée', 'La nouvelle offre SaaS a été créée avec succès.');
      }
      setIsPlanModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur d\'enregistrement', err.response?.data?.error || 'Erreur lors de l\'enregistrement de l\'offre.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Grille Tarifaire & Forfaits SaaS
            </h1>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              Catalog SaaS
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Définissez les formules de souscription, les quotas de bus/abonnés et la tarification mensuelle/annuelle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPlans}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-3 min-h-[44px] text-sm font-semibold transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-orange-500" />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={() => openPlanModal()}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 min-h-[44px] text-sm font-semibold transition cursor-pointer shadow-md shadow-orange-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Nouvelle offre SaaS
          </button>
        </div>
      </div>

      {/* Plans Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-3xl border bg-[#121212] p-6 backdrop-blur-xl flex flex-col justify-between transition duration-200 hover:-translate-y-1 ${
                plan.popular ? 'border-orange-500/50 shadow-xl shadow-orange-950/30' : 'border-zinc-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-md">
                  <Sparkles className="h-3 w-3" />
                  Populaire
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                    {plan.code}
                  </span>
                  <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                  {plan.badge && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="py-3 border-y border-zinc-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {plan.priceMensuel.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs font-bold text-zinc-400 uppercase">FCFA /mois</span>
                  </div>
                  {plan.priceAnnuel > 0 && (
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      ou {plan.priceAnnuel.toLocaleString('fr-FR')} FCFA /an (Économie engagée)
                    </span>
                  )}
                </div>

                {/* Quotas */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Bus className="h-4 w-4 text-orange-500" />
                      Limite de véhicules
                    </span>
                    <span className="font-extrabold text-white">{plan.maxVehicles} bus</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Users className="h-4 w-4 text-blue-400" />
                      Abonnés max
                    </span>
                    <span className="font-extrabold text-white">{plan.maxUsers} utilisateurs</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                    Inclus dans ce forfait
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {Array.isArray(plan.features) && plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => openPlanModal(plan)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Modifier l'offre
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Edit Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-orange-500" />
                {editingPlan ? 'Modifier l\'offre SaaS' : 'Créer une nouvelle offre SaaS'}
              </h2>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Code de l'offre (ex: ESSENTIEL)</label>
                  <input
                    type="text"
                    required
                    value={planCode}
                    onChange={(e) => setPlanCode(e.target.value)}
                    placeholder="ex: ESSENTIEL"
                    className="w-full rounded-xl bg-black border border-zinc-800 p-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Nom d'affichage</label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="ex: Forfait Essentiel Pro"
                    className="w-full rounded-xl bg-black border border-zinc-800 p-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Prix Mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={planPriceMensuel}
                    onChange={(e) => setPlanPriceMensuel(e.target.value)}
                    className="w-full rounded-xl bg-black border border-zinc-800 p-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Prix Annuel (FCFA)</label>
                  <input
                    type="number"
                    value={planPriceAnnuel}
                    onChange={(e) => setPlanPriceAnnuel(e.target.value)}
                    className="w-full rounded-xl bg-black border border-zinc-800 p-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Quota Max Véhicules</label>
                  <input
                    type="number"
                    value={planMaxVehicles}
                    onChange={(e) => setPlanMaxVehicles(e.target.value)}
                    className="w-full rounded-xl bg-black border border-zinc-800 p-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Quota Max Utilisateurs</label>
                  <input
                    type="number"
                    value={planMaxUsers}
                    onChange={(e) => setPlanMaxUsers(e.target.value)}
                    className="w-full rounded-xl bg-black border border-zinc-800 p-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="planPopular"
                  checked={planPopular}
                  onChange={(e) => setPlanPopular(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-800 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="planPopular" className="text-xs text-zinc-300 font-semibold cursor-pointer">
                  Mettre en avant cette offre comme "Populaire / Recommandée"
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm py-3 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition cursor-pointer shadow-md shadow-orange-600/10"
                >
                  {editingPlan ? 'Mettre à jour l\'offre' : 'Créer l\'offre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
