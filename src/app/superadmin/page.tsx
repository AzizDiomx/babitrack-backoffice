'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  Plus,
  X,
  User as UserIcon,
  Mail,
  Phone,
  Key,
  ShieldAlert,
  UserPlus,
  Calendar,
  Globe,
  CheckCircle,
  Building,
  AlertTriangle,
  BarChart3,
  Settings2,
  Activity,
  Layers,
  CreditCard,
  Receipt,
  Coins,
  Sparkles,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Bus
} from 'lucide-react';
import api from '../../services/api';
import NotificationModal, { NotificationState } from '../../components/NotificationModal';

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
  subscriptionExpiresAt: string | null;
  maxVehicles: number;
  maxUsers: number;
  createdAt: string;
  updatedAt: string;
  users: CompanyAdmin[];
  _count: {
    users: number;
    vehicles: number;
    routes: number;
    subscriptions: number;
  };
}

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

function SuperAdminPageContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [saasPlans, setSaasPlans] = useState<SaasPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'companies' | 'requests' | 'pricing' | 'billing' | 'stats'>('companies');

  // Notification Modal State
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlanItem | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Plan Form State
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [planBadge, setPlanBadgeInput] = useState('');
  const [planPriceMensuel, setPlanPriceMensuel] = useState('0');
  const [planPriceAnnuel, setPlanPriceAnnuel] = useState('0');
  const [planMaxVehicles, setPlanMaxVehicles] = useState('5');
  const [planMaxUsers, setPlanMaxUsers] = useState('50');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [planPopular, setPlanPopular] = useState(false);

  // Company Form State
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [companyPlan, setCompanyPlan] = useState('DECOUVERTE');
  const [companyMaxVehicles, setCompanyMaxVehicles] = useState('3');
  const [companyMaxUsers, setCompanyMaxUsers] = useState('20');
  const [companyExpiresAt, setCompanyExpiresAt] = useState('');

  // Admin Form State
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Subscription Edit Form State
  const [editPlan, setEditPlan] = useState('DECOUVERTE');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editMaxVehicles, setEditMaxVehicles] = useState('3');
  const [editMaxUsers, setEditMaxUsers] = useState('20');
  const [editExpiresAt, setEditExpiresAt] = useState('');

  // Payment Requests State
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des compagnies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaasPlans = async () => {
    try {
      const res = await api.get('/api/saas-plans');
      setSaasPlans(res.data);
    } catch (err) {
      console.error('Erreur chargement offres SaaS:', err);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      const res = await api.get('/api/payment-requests');
      setPaymentRequests(res.data);
    } catch (err) {
      console.error('Erreur chargement demandes de paiement:', err);
    }
  };

  const handleApprovePayment = async (requestId: string) => {
    try {
      await api.patch(`/api/payment-requests/${requestId}/approve`);
      notify('success', 'Paiement Approuvé !', 'Le règlement a été validé avec succès. La licence et les quotas ont été automatiquement mis à jour.');
      fetchPaymentRequests();
      fetchCompanies();
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

  useEffect(() => {
    fetchCompanies();
    fetchSaasPlans();
    fetchPaymentRequests();
  }, []);

  // Auto fill quota fields based on selected plan (Creation)
  const handlePlanChange = (plan: string) => {
    setCompanyPlan(plan);
    const dateExpires = new Date();
    if (plan === 'DECOUVERTE') {
      setCompanyMaxVehicles('3');
      setCompanyMaxUsers('20');
      dateExpires.setDate(dateExpires.getDate() + 90); // 3 mois d'essai gratuit
      setCompanyExpiresAt(dateExpires.toISOString().split('T')[0]);
    } else if (plan === 'ESSENTIEL') {
      setCompanyMaxVehicles('10');
      setCompanyMaxUsers('150');
      dateExpires.setFullYear(dateExpires.getFullYear() + 1); // 1 an
      setCompanyExpiresAt(dateExpires.toISOString().split('T')[0]);
    } else if (plan === 'PREMIUM') {
      setCompanyMaxVehicles('50');
      setCompanyMaxUsers('1000');
      dateExpires.setFullYear(dateExpires.getFullYear() + 1); // 1 an
      setCompanyExpiresAt(dateExpires.toISOString().split('T')[0]);
    }
  };

  // Auto fill quota fields based on selected plan (Edition)
  const handleEditPlanChange = (plan: string) => {
    setEditPlan(plan);
    const dateExpires = new Date();
    if (plan === 'DECOUVERTE') {
      setEditMaxVehicles('3');
      setEditMaxUsers('20');
      dateExpires.setDate(dateExpires.getDate() + 90);
      setEditExpiresAt(dateExpires.toISOString().split('T')[0]);
    } else if (plan === 'ESSENTIEL') {
      setEditMaxVehicles('10');
      setEditMaxUsers('150');
      dateExpires.setFullYear(dateExpires.getFullYear() + 1);
      setEditExpiresAt(dateExpires.toISOString().split('T')[0]);
    } else if (plan === 'PREMIUM') {
      setEditMaxVehicles('50');
      setEditMaxUsers('1000');
      dateExpires.setFullYear(dateExpires.getFullYear() + 1);
      setEditExpiresAt(dateExpires.toISOString().split('T')[0]);
    }
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      notify('warning', 'Champ obligatoire', 'Le nom de la compagnie est obligatoire.');
      return;
    }

    try {
      await api.post('/api/companies', {
        name: companyName,
        subdomain: subdomain ? subdomain.toLowerCase().trim() : null,
        plan: companyPlan,
        maxVehicles: parseInt(companyMaxVehicles, 10),
        maxUsers: parseInt(companyMaxUsers, 10),
        subscriptionExpiresAt: companyExpiresAt ? new Date(companyExpiresAt) : null,
      });
      notify('success', 'Compagnie créée', 'La compagnie a été créée avec succès.');
      setIsCompanyModalOpen(false);
      setCompanyName('');
      setSubdomain('');
      setCompanyPlan('DECOUVERTE');
      setCompanyMaxVehicles('3');
      setCompanyMaxUsers('20');
      setCompanyExpiresAt('');
      fetchCompanies();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur de création', err.response?.data?.error || 'Erreur lors de la création de la compagnie.');
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    if (!nom || !prenom || !telephone || !password) {
      notify('warning', 'Champs requis', 'Tous les champs obligatoires sont requis.');
      return;
    }

    try {
      await api.post(`/api/companies/${selectedCompany.id}/admin`, {
        nom,
        prenom,
        telephone,
        email: email ? email.trim() : null,
        password,
      });
      notify('success', 'Administrateur créé', `Administrateur créé avec succès pour ${selectedCompany.name}.`);
      setIsAdminModalOpen(false);
      setNom('');
      setPrenom('');
      setTelephone('');
      setEmail('');
      setPassword('');
      fetchCompanies();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur de création', err.response?.data?.error || "Erreur lors de la création de l'administrateur.");
    }
  };

  const openPlanModal = (plan?: SaasPlanItem) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanCode(plan.code);
      setPlanName(plan.name);
      setPlanBadgeInput(plan.badge || '');
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
      setPlanBadgeInput('');
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
      fetchSaasPlans();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur d\'enregistrement', err.response?.data?.error || 'Erreur lors de l\'enregistrement de l\'offre.');
    }
  };

  const handleEditSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      await api.patch(`/api/companies/${selectedCompany.id}/subscription`, {
        plan: editPlan,
        status: editStatus,
        maxVehicles: parseInt(editMaxVehicles, 10),
        maxUsers: parseInt(editMaxUsers, 10),
        subscriptionExpiresAt: editExpiresAt ? new Date(editExpiresAt) : null,
      });
      notify('success', 'Abonnement mis à jour', 'L\'abonnement de la compagnie a été mis à jour avec succès.');
      setIsSubModalOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur de mise à jour', err.response?.data?.error || "Erreur lors de la mise à jour de l'abonnement.");
    }
  };

  const handleApproveCompany = async (companyId: string, companyName: string) => {
    try {
      await api.patch(`/api/companies/${companyId}/approve`);
      notify('success', 'Inscription Validée', `La compagnie ${companyName} a été activée avec succès !`);
      fetchCompanies();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur de validation', err.response?.data?.error || "Erreur lors de la validation de la compagnie.");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Illimité';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = (expiryStr: string | null) => {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  };

  const openAdminModal = (company: Company) => {
    setSelectedCompany(company);
    setIsAdminModalOpen(true);
  };

  const openSubModal = (company: Company) => {
    setSelectedCompany(company);
    setEditPlan(company.plan);
    setEditStatus(company.status);
    setEditMaxVehicles(String(company.maxVehicles));
    setEditMaxUsers(String(company.maxUsers));
    setEditExpiresAt(company.subscriptionExpiresAt ? company.subscriptionExpiresAt.split('T')[0] : '');
    setIsSubModalOpen(true);
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'DECOUVERTE':
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
      case 'ESSENTIEL':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'PREMIUM':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const getStatusBadge = (status: string, expiryStr: string | null) => {
    if (isExpired(expiryStr)) {
      return 'bg-red-500/10 text-red-400 border border-red-500/25';
    }
    return status === 'ACTIVE' 
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-zinc-800 text-zinc-400 border border-zinc-700';
  };

  const getStatusLabel = (status: string, expiryStr: string | null) => {
    if (isExpired(expiryStr)) return 'Expiré';
    return status === 'ACTIVE' ? 'Actif' : 'Suspendu';
  };

  const handleTriggerExpirations = async () => {
    try {
      const res = await api.post('/api/users/check-expirations');
      const { expiredUsersCount, expiredCompaniesCount } = res.data;
      notify(
        'success',
        'Vérification des expirations',
        `Purge terminée : ${expiredUsersCount || 0} abonné(s) et ${expiredCompaniesCount || 0} compagnie(s) expirée(s) suspendu(e)s.`
      );
      fetchCompanies();
    } catch (err: any) {
      console.error(err);
      notify('error', 'Erreur d\'expiration', 'Erreur lors du déclenchement de la vérification des expirations.');
    }
  };

  return (
    <div className="min-h-full bg-black p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Console d'Administration SaaS
            </h1>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              BabiTrack Core
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Supervisez la santé globale des locataires, abonnements, revenus et quotas de la plateforme BabiTrack.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleTriggerExpirations}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-3 min-h-[44px] text-sm font-semibold w-full sm:w-auto transition duration-150 cursor-pointer shadow-sm"
            title="Exécuter la vérification d'expiration et suspendre les comptes échus"
          >
            <RefreshCw className="h-4 w-4 text-orange-500" />
            <span>Purger les expirations</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCompanyModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 min-h-[44px] text-sm font-semibold w-full sm:w-auto transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Créer une compagnie
          </button>
        </div>
      </div>

      {/* Top Executive KPI Cards */}
      {(() => {
        const activeCompanies = companies.filter(c => c.status !== 'DRAFT' && c.status !== 'PENDING_APPROVAL');
        const totalVehiclesCount = activeCompanies.reduce((acc, curr) => acc + (curr._count?.vehicles || 0), 0);
        const totalUsersCount = activeCompanies.reduce((acc, curr) => acc + (curr._count?.users || 0), 0);
        const totalSubscriptionsCount = activeCompanies.reduce((acc, curr) => acc + (curr._count?.subscriptions || 0), 0);

        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Compagnies Actives</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Building2 className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">{activeCompanies.length}</span>
                <span className="text-[11px] font-semibold text-zinc-400">/ {companies.length} au total</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 block">100% Licences Gérées</span>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Abonnés & Élèves</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <UserPlus className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">{totalUsersCount}</span>
                <span className="text-[11px] font-semibold text-zinc-400">inscrits</span>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 block">Global Multi-Locataires</span>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Flotte de Bus Globale</span>
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Bus className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">{totalVehiclesCount}</span>
                <span className="text-[11px] font-semibold text-zinc-400">véhicules</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 block">GPS Temps Réel Actif</span>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Forfaits & Abonnements</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <CreditCard className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">{totalSubscriptionsCount}</span>
                <span className="text-[11px] font-semibold text-zinc-400">plans</span>
              </div>
              <span className="text-[10px] font-semibold text-orange-400 block">Recouvrement Automatique</span>
            </div>
          </div>
        );
      })()}



      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-16 text-center text-zinc-500 backdrop-blur-xl">
          <Building className="h-12 w-12 text-zinc-600 mx-auto mb-3 animate-pulse" />
          <p className="font-semibold text-zinc-400">Aucune compagnie enregistrée</p>
          <p className="text-xs text-zinc-500 mt-1">
            Enregistrez votre première compagnie cliente en cliquant sur le bouton ci-dessus.
          </p>
        </div>
      ) : (
        /* Companies Grid with usage gauges */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.filter(c => c.status !== 'DRAFT' && c.status !== 'PENDING_APPROVAL').map((company, companyIdx) => {
            const hasAdmin = company.users && company.users.length > 0;
            const primaryAdmin = hasAdmin ? company.users[0] : null;

            // Usage percentages
            const vehiclePercent = Math.min(100, (company._count.vehicles / company.maxVehicles) * 100);
            const userPercent = Math.min(100, (company._count.users / company.maxUsers) * 100);

            return (
              <div
                key={`company-grid-${company.id || companyIdx}`}
                className={`relative overflow-hidden rounded-2xl border bg-[#121212] p-6 backdrop-blur-xl transition duration-150 hover:-translate-y-1 ${
                  isExpired(company.subscriptionExpiresAt) ? 'border-red-500/30 bg-red-950/5' : 'border-zinc-800'
                }`}
              >
                {/* Header card info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <Building2 className="h-5.5 w-5.5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{company.name}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <Globe className="h-3 w-3" />
                        {company.subdomain ? `${company.subdomain}.babitrack.com` : 'Pas de sous-domaine'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getPlanBadge(company.plan)}`}>
                      {company.plan}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(company.status, company.subscriptionExpiresAt)}`}>
                      {getStatusLabel(company.status, company.subscriptionExpiresAt)}
                    </span>
                  </div>
                </div>

                {/* Expiry section */}
                <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-4 mb-4">
                  <span className="flex items-center gap-1 text-zinc-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Créé le {formatDate(company.createdAt)}
                  </span>
                  <span className={`font-semibold ${isExpired(company.subscriptionExpiresAt) ? 'text-red-400' : 'text-zinc-400'}`}>
                    Fin : {formatDate(company.subscriptionExpiresAt)}
                  </span>
                </div>

                {/* Resource Limits meters */}
                <div className="space-y-3 mb-6 border-b border-zinc-800 pb-5">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Utilisation des Ressources
                  </span>
                  
                  {/* Vehicles Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Véhicules de flotte</span>
                      <span className="font-semibold text-zinc-300">
                        {company._count.vehicles} / {company.maxVehicles}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          vehiclePercent >= 90 ? 'bg-red-500' : vehiclePercent >= 70 ? 'bg-amber-500' : 'bg-orange-500'
                        }`} 
                        style={{ width: `${vehiclePercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Users Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Abonnés & Collaborateurs</span>
                      <span className="font-semibold text-zinc-300">
                        {company._count.users} / {company.maxUsers}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          userPercent >= 90 ? 'bg-red-500' : userPercent >= 70 ? 'bg-amber-500' : 'bg-orange-500'
                        }`} 
                        style={{ width: `${userPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Tenant Admin Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Administrateur Principal
                    </span>
                  </div>

                  {hasAdmin && primaryAdmin ? (
                    <div className="space-y-2 bg-black/40 rounded-xl border border-zinc-800/40 p-3.5 text-xs">
                      <div className="flex items-center gap-2 text-zinc-200">
                        <UserIcon className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-semibold truncate">
                          {primaryAdmin.prenom} {primaryAdmin.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{primaryAdmin.telephone}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 rounded-xl border border-red-500/10 bg-red-950/5 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-red-400">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Aucun admin associé
                      </div>
                      <button
                        onClick={() => openAdminModal(company)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/25 py-1.5 text-xs font-bold tracking-wide transition duration-150 cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Associer un administrateur
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub edit action button */}
                <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={() => openSubModal(company)}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Gérer l'abonnement
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Custom Notification Modal Popup */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />


      {/* Add Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCompanyModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Créer une compagnie</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Enregistrez un nouveau client d'entreprise et configurez son forfait initial.
            </p>

            <form onSubmit={handleCreateCompanySubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Nom de l'entreprise
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: SOTRA Scolaire"
                    required
                  />
                </div>
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Sous-domaine
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: sotra (laisse vide si aucun)"
                  />
                </div>
              </div>

              {/* Select Plan */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Forfait initial
                </label>
                <select
                  value={companyPlan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="DECOUVERTE">Découverte (3 mois gratuits - 3 bus / 20 usagers)</option>
                  <option value="ESSENTIEL">Essentiel (1 an - 10 bus / 150 usagers)</option>
                  <option value="PREMIUM">Premium (1 an - 50 bus / 1000 usagers)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Max Vehicles */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Limite Véhicules</label>
                  <input
                    type="number"
                    value={companyMaxVehicles}
                    onChange={(e) => setCompanyMaxVehicles(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                    min="1"
                    required
                  />
                </div>

                {/* Max Users */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Limite Usagers</label>
                  <input
                    type="number"
                    value={companyMaxUsers}
                    onChange={(e) => setCompanyMaxUsers(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Date d'expiration</label>
                <input
                  type="date"
                  value={companyExpiresAt}
                  onChange={(e) => setCompanyExpiresAt(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {isSubModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setIsSubModalOpen(false);
                setSelectedCompany(null);
              }}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Gérer l'abonnement</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Ajustez le forfait, le statut de service et les limites de quota pour <span className="text-orange-500 font-bold">{selectedCompany.name}</span>.
            </p>

            <form onSubmit={handleEditSubscriptionSubmit} className="space-y-4">
              {/* Select Plan */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Plan d'abonnement
                </label>
                <select
                  value={editPlan}
                  onChange={(e) => handleEditPlanChange(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="DECOUVERTE">Découverte (3 mois gratuits)</option>
                  <option value="ESSENTIEL">Essentiel (10 bus / 150 usagers)</option>
                  <option value="PREMIUM">Premium (50 bus / 1000 usagers)</option>
                  <option value="CUSTOM">Sur Mesure (Quotas personnalisés)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Statut de la Compagnie
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="ACTIVE">Actif (Accès autorisé)</option>
                  <option value="SUSPENDED">Suspendu (Accès bloqué)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Max Vehicles */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Limite Véhicules</label>
                  <input
                    type="number"
                    value={editMaxVehicles}
                    onChange={(e) => setEditMaxVehicles(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                    min="1"
                    required
                  />
                </div>

                {/* Max Users */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Limite Usagers</label>
                  <input
                    type="number"
                    value={editMaxUsers}
                    onChange={(e) => setEditMaxUsers(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Date d'expiration</label>
                <input
                  type="date"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubModalOpen(false);
                    setSelectedCompany(null);
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin User Modal */}
      {isAdminModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setIsAdminModalOpen(false);
                setSelectedCompany(null);
              }}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Associer un administrateur</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Créez le compte d'administration initial pour la compagnie <span className="text-orange-500 font-bold">{selectedCompany.name}</span>.
            </p>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Nom */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Nom de famille"
                    required
                  />
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Prénom"
                    required
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: 0102030405"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: contact@sotra.ci"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Mot de passe</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Mot de passe sécurisé"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                    aria-label="Afficher ou masquer le mot de passe"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setSelectedCompany(null);
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition duration-150 cursor-pointer shadow-md shadow-orange-600/10"
                >
                  Créer l'Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit SaaS Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl p-6 lg:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {editingPlan ? `Modifier l'offre : ${editingPlan.name}` : 'Créer une nouvelle offre SaaS'}
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Définissez les caractéristiques, tarifs et quotas attribués aux transporteurs.
            </p>

            <form onSubmit={handleSavePlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Code Unique (ex: ESSENTIEL)</label>
                  <input
                    type="text"
                    value={planCode}
                    onChange={(e) => setPlanCode(e.target.value)}
                    disabled={!!editingPlan}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 uppercase font-mono disabled:opacity-50"
                    placeholder="EX: PRO_PLUS"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nom de l'offre</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200"
                    placeholder="ex: Essentiel Pro"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Prix Mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={planPriceMensuel}
                    onChange={(e) => setPlanPriceMensuel(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200"
                    placeholder="150000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Prix Annuel (FCFA)</label>
                  <input
                    type="number"
                    value={planPriceAnnuel}
                    onChange={(e) => setPlanPriceAnnuel(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200"
                    placeholder="1500000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Quota Bus Max</label>
                  <input
                    type="number"
                    value={planMaxVehicles}
                    onChange={(e) => setPlanMaxVehicles(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200"
                    placeholder="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Quota Usagers Max</label>
                  <input
                    type="number"
                    value={planMaxUsers}
                    onChange={(e) => setPlanMaxUsers(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200"
                    placeholder="150"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Badge / Etiquette (Optionnel)</label>
                <input
                  type="text"
                  value={planBadge}
                  onChange={(e) => setPlanBadgeInput(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200"
                  placeholder="ex: Populaire, Gratuit 3 mois, PME"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Fonctionnalités & Options Incluses ({selectedFeatures.length} sélectionnée(s))
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto p-3 bg-black border border-zinc-800 rounded-2xl">
                  {PREDEFINED_PLATFORM_FEATURES.map((feat, fIdx) => {
                    const isChecked = selectedFeatures.includes(feat);
                    return (
                      <label
                        key={`predefined-feat-${fIdx}`}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer text-xs ${
                          isChecked
                            ? 'border-orange-500/40 bg-orange-500/10 text-white font-semibold'
                            : 'border-zinc-800 bg-[#121212] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(feat)}
                          className="mt-0.5 h-4 w-4 rounded border-zinc-800 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="flex-1 leading-snug">{feat}</span>
                      </label>
                    );
                  })}

                  {/* Render any additional custom features already selected */}
                  {selectedFeatures
                    .filter((f) => !PREDEFINED_PLATFORM_FEATURES.includes(f))
                    .map((customFeat, cIdx) => (
                      <div
                        key={`custom-feat-${cIdx}`}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl border border-orange-500/40 bg-orange-500/10 text-white font-semibold text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          {customFeat}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFeature(customFeat)}
                          className="text-zinc-400 hover:text-red-400 text-xs px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>

                {/* Add Custom Feature Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    placeholder="Ajouter une option sur-mesure..."
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFeature}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
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

      {/* Modern Custom Notification Modal Popup */}
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SuperAdminPageContent />
    </Suspense>
  );
}
