'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import EditProfileModal from '../../components/EditProfileModal';
import {
  Building2,
  LogOut,
  User as UserIcon,
  Shield,
  Bus,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  UserPlus,
  Coins,
  Receipt,
  BarChart3,
  Layers
} from 'lucide-react';

function SuperAdminNavItems({ onCloseMobile }: { onCloseMobile: () => void }) {
  const pathname = usePathname();

  const superAdminNav = [
    { name: 'Compagnies', href: '/superadmin', icon: Building2 },
    { name: 'Demandes', href: '/superadmin/requests', icon: UserPlus },
    { name: 'Tarification', href: '/superadmin/pricing', icon: Coins },
    { name: 'Facturation', href: '/superadmin/billing', icon: Receipt },
    { name: 'Statistiques', href: '/superadmin/stats', icon: BarChart3 },
  ];

  return (
    <ul className="space-y-1.5">
      {superAdminNav.map((item) => {
        const isActive = item.href === '/superadmin' 
          ? pathname === '/superadmin' 
          : pathname.startsWith(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onCloseMobile}
              className={`
                group flex items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-bold min-h-[44px] leading-6 transition duration-150 cursor-pointer
                ${isActive 
                  ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/10 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-950/20' 
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white border border-transparent'
                }
              `}
            >
              <div className="flex items-center gap-x-3">
                <item.icon
                  className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Loading state fallback
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-zinc-400">Chargement de la session...</span>
        </div>
      </div>
    );
  }

  // Double check authentication
  if (!isAuthenticated) {
    return null;
  }

  const isCompaniesActive = pathname === '/superadmin';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex h-16 w-full shrink-0 items-center justify-between px-4 bg-black border-b border-zinc-800 z-30">
        <div className="flex items-center gap-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 shadow-md shadow-orange-600/10">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white uppercase">
              BabiTrack
            </span>
            <span className="block text-[8px] font-semibold text-orange-400 uppercase tracking-widest">
              Super Admin
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-6 w-6 text-orange-500" />
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Super Admin - Drawer on Mobile, Panel on Desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 md:z-auto shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex h-full w-full flex-col bg-[#121212] border-r border-zinc-800">
          {/* Brand Header */}
          <div className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-zinc-800 bg-black">
            <div className="flex items-center gap-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-600/20 ring-1 ring-orange-400/30">
                <Shield className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <span className="text-md font-extrabold tracking-wider text-white uppercase block">
                  BabiTrack
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  Super Admin Console
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-y-7 px-4 py-6 overflow-y-auto">
            <ul role="list" className="flex flex-1 flex-col justify-between h-full space-y-6">
              <li>
                <div className="px-2 mb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    MODULES PLATEFORME SAAS
                  </span>
                </div>
                <Suspense fallback={<div className="text-xs text-zinc-500 p-2">Chargement du menu...</div>}>
                  <SuperAdminNavItems onCloseMobile={() => setMobileOpen(false)} />
                </Suspense>
              </li>

              {/* System Health & Logged in Super Admin Section */}
              <li className="space-y-3">
                {/* System Status Card */}
                <div className="rounded-2xl bg-black/80 border border-zinc-800 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      INFRASTRUCTURE SÉCURISÉE
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300">Statut Réseau</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      100% Opérationnel
                    </span>
                  </div>
                </div>

                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between rounded-xl bg-[#121212] border border-zinc-800 p-3 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon className="h-4 w-4 text-orange-400" />
                    ) : (
                      <Sun className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-zinc-200">{theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>

                {/* User Profile Footer */}
                <div className="flex items-center gap-x-3 px-2 py-3 border-t border-zinc-800 pt-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 shrink-0">
                    <UserIcon className="h-4.5 w-4.5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-100 truncate">
                      {user?.prenom} {user?.nom}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                      SUPER ADMIN
                    </span>
                  </div>
                  <button
                    onClick={() => setEditProfileOpen(true)}
                    className="group p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition cursor-pointer"
                    title="Modifier mon profil"
                  >
                    <Settings className="h-4 w-4 text-zinc-400 group-hover:text-white transition" />
                  </button>
                  <button
                    onClick={logout}
                    className="group p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-950/20 border border-transparent hover:border-red-500/10 transition cursor-pointer"
                    title="Déconnexion"
                  >
                    <LogOut className="h-4 w-4 text-zinc-500 group-hover:text-red-400 transition" />
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0">
        <main className="flex-1 overflow-y-auto bg-black p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </div>
  );
}
