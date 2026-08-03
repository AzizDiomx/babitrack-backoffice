'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  Map,
  Bus,
  Bell,
  AlertTriangle,
  LogOut,
  User as UserIcon,
  Shield,
  UserCheck,
  Sun,
  Moon,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen?: boolean;
}

export default function Sidebar({ sidebarOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Abonnés', href: '/dashboard/subscribers', icon: Users },
    { name: 'Chauffeurs', href: '/dashboard/drivers', icon: UserCheck },
    { name: 'Trajets & Relais', href: '/dashboard/routes', icon: Map },
    { name: 'Véhicules', href: '/dashboard/vehicles', icon: Bus },
    { name: 'Alertes Push', href: '/dashboard/notifications', icon: Bell },
    { name: 'Signalement d\'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
    { name: 'Mon Abonnement SaaS', href: '/dashboard/subscription', icon: CreditCard },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-[#121212] border-r border-zinc-800">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-x-3 px-6 border-b border-zinc-800 bg-black">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 shadow-md shadow-orange-600/10">
          <Bus className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-md font-bold tracking-wider text-white uppercase">
            BabiTrack
          </span>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-orange-500" />
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">
              SaaS Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-y-7 px-4 py-6 overflow-y-auto">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition duration-150 cursor-pointer
                        ${isActive 
                          ? 'bg-orange-600/10 text-orange-500' 
                          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                        }
                      `}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive ? 'text-orange-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Tenant / Company Panel */}
          <li className="mt-auto">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between rounded-xl bg-[#121212] dark:bg-black border border-zinc-800 p-3 mb-3 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition duration-150 cursor-pointer"
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

            <div className="rounded-2xl bg-black border border-zinc-800 p-4 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  COMPAGNIE / LOCATAIRE
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {(user?.company as any)?.plan || 'DECOUVERTE'}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-zinc-200 truncate">
                {user?.company?.name || 'SOTRA Scolaire'}
              </p>
            </div>

            {/* Logged in User Section */}
            <div className="flex items-center gap-x-4 px-2 py-3 border-t border-zinc-800 mt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 border border-zinc-800">
                <UserIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold text-orange-500 border border-orange-500/20 uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="group p-1.5 rounded-lg hover:bg-red-950/20 border border-transparent hover:border-red-500/10 transition cursor-pointer"
                title="Déconnexion"
              >
                <LogOut className="h-5 w-5 text-zinc-500 group-hover:text-red-400 transition" />
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
