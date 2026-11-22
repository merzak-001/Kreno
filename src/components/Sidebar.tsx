'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Award, 
  Car, 
  DollarSign, 
  Settings, 
  LayoutDashboard, 
  Calendar,
  ShieldCheck, 
  UserCheck, 
  KeyRound
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';

export function Sidebar() {
  const pathname = usePathname();
  const { userRole, setUserRole, school } = useKreno();
  const isOwner = userRole === 'owner';

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Tableau de bord', 
      icon: LayoutDashboard, 
      ownerOnly: false 
    },
    { 
      path: '/candidates', 
      label: 'Candidats & Dossiers', 
      icon: Users, 
      ownerOnly: false 
    },
    { 
      path: '/pipeline', 
      label: 'Sessions d\'Examens & Résultats', 
      icon: Award, 
      ownerOnly: false 
    },
    { 
      path: '/schedule', 
      label: 'Planning des Séances (1h)', 
      icon: Calendar, 
      ownerOnly: false 
    },
    { 
      path: '/vehicles', 
      label: 'Parc Véhicules', 
      icon: Car, 
      ownerOnly: false 
    },
    { 
      path: '/finances', 
      label: 'Finances & Recettes', 
      icon: DollarSign, 
      ownerOnly: true 
    },
    { 
      path: '/settings', 
      label: 'Paramètres & Horaires', 
      icon: Settings, 
      ownerOnly: true 
    },
  ];

  return (
    <aside 
      className="fixed left-0 top-0 w-72 bg-sidebar-bg text-slate-100 flex flex-col justify-between shrink-0 h-screen border-r border-sidebar-border z-40 transition-colors select-none"
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm border border-white/10">
              K
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                KRENO <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-blue-400 border border-primary/30 font-mono font-semibold">PRO</span>
              </h1>
              <p className="text-xs text-slate-400 truncate max-w-[170px]">{school.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Principal
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            const locked = item.ownerOnly && !isOwner;

            if (locked) {
              return (
                <div
                  key={item.path}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-500 text-xs font-medium opacity-50 cursor-not-allowed bg-black/20"
                  title="Réservé au Propriétaire (Gérant)"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-black/30 rounded text-slate-500 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Privé
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active 
                    ? 'bg-primary text-white shadow-xs font-semibold' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher & User Profile */}
      <div className="p-4 border-t border-sidebar-border bg-black/20">
        <div className="mb-3 px-1">
          <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>Rôle Actif (Simulation):</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${isOwner ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-primary/20 text-blue-300 border border-primary/30'}`}>
              {isOwner ? 'Gérant' : 'Secrétaire'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/30 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setUserRole('owner')}
              className={`py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isOwner 
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Gérant
            </button>
            <button
              onClick={() => setUserRole('secretary')}
              className={`py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !isOwner 
                  ? 'bg-primary text-white font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Secrétaire
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-slate-300">
            {isOwner ? 'GER' : 'SEC'}
          </div>
          <div className="truncate text-xs">
            <p className="font-semibold text-slate-200 truncate">
              {isOwner ? 'Ahmed Benali (Gérant)' : 'Bureau Secrétariat'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {isOwner ? 'Agrément N° 19/2021' : 'Accueil & Inscriptions'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
