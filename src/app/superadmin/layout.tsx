'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LogOut,
  User as UserIcon,
  Shield,
  Bus,
  Menu,
  X
} from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-zinc-800 bg-black">
            <div className="flex items-center gap-x-3">
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
                    Super Admin
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-y-7 px-4 py-6 overflow-y-auto">
            <ul role="list" className="flex flex-1 flex-col justify-between h-full">
              <li>
                <ul className="-mx-2 space-y-1">
                  <li>
                    <Link
                      href="/superadmin"
                      onClick={() => setMobileOpen(false)}
                      className={`
                        group flex items-center gap-x-3 rounded-xl px-3.5 py-3 text-sm font-semibold min-h-[44px] leading-6 transition duration-150 cursor-pointer
                        ${isCompaniesActive 
                          ? 'bg-orange-600/10 text-orange-500 border border-orange-500/20' 
                          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white border border-transparent'
                        }
                      `}
                    >
                      <Building2
                        className={`h-5 w-5 shrink-0 ${isCompaniesActive ? 'text-orange-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                        aria-hidden="true"
                      />
                      Compagnies & SaaS
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Logged in Super Admin Section */}
              <li>
                <div className="rounded-2xl bg-black border border-zinc-800 p-4 mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    SYSTÈME HÔTE
                  </span>
                  <p className="mt-1 text-sm font-bold text-zinc-200 truncate">
                    BabiTrack Hosting
                  </p>
                </div>

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
                    className="group p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-950/20 border border-transparent hover:border-red-500/10 transition cursor-pointer"
                    title="Déconnexion"
                  >
                    <LogOut className="h-5 w-5 text-zinc-500 group-hover:text-red-400 transition" />
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
    </div>
  );
}
