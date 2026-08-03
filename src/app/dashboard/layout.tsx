'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { useRouter } from 'next/navigation';
import { Menu, Bus, Shield } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Si on est en train de charger, afficher un écran de chargement
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

  // Si non authentifié
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black flex-col md:flex-row">
      {/* Mobile Top Header (hidden on desktop) */}
      <header className="md:hidden flex h-16 w-full shrink-0 items-center justify-between px-4 bg-black border-b border-zinc-800 z-30">
        <div className="flex items-center gap-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 shadow-md shadow-orange-600/10">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white uppercase">
              BabiTrack
            </span>
            <span className="block text-[8px] font-semibold text-zinc-500 uppercase tracking-widest">
              {(user?.company as any)?.name || 'SaaS Admin'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-orange-500/50 transition cursor-pointer"
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

      {/* Sidebar - Drawer on Mobile, Fixed Panel on Desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 md:z-auto shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar onCloseMobile={() => setMobileOpen(false)} />
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
