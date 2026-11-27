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
  X
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
      label: 'Candidats', 
      icon: Users, 
      ownerOnly: false 
    },
    { 
      path: '/pipeline', 
      label: 'Sessions d\'examen', 
      icon: Award, 
      ownerOnly: false 
    },
    { 
      path: '/schedule', 
      label: 'Planning des séances', 
      icon: Calendar, 
      ownerOnly: false 
    },
    { 
      path: '/mentors', 
      label: 'Moniteurs', 
      icon: UserCheck, 
      ownerOnly: false 
    },
    { 
      path: '/vehicles', 
      label: 'Parc véhicules', 
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
      label: 'Paramètres', 
      icon: Settings, 
      ownerOnly: true 
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside 
        className={`fixed left-0 top-0 w-64 2xl:w-72 bg-sidebar-bg text-slate-100 flex flex-col justify-between shrink-0 h-screen border-r border-sidebar-border z-50 transition-transform duration-200 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-sidebar-border flex items-center justify-between bg-black/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-900/40 border border-blue-400/30">
                K
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white">{school.name}</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-medium border border-blue-500/30">
                    DZ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono tracking-tight">
                  Agrément {school.agrement_number}
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Gestion Quotidienne
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              
              if (item.ownerOnly && !isOwner) {
                return null;
              }

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold' 
                      : 'text-slate-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Role Switcher */}
        <div className="p-4 border-t border-sidebar-border bg-black/15">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-sidebar-border space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Session active</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                isOwner 
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isOwner ? 'Gérant' : 'Secrétariat'}
              </span>
            </div>

            <button
              onClick={() => setUserRole(isOwner ? 'secretary' : 'owner')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-200 rounded-lg text-xs font-medium transition border border-white/10 cursor-pointer"
              title="Basculer entre vue Gérant et Secrétariat"
            >
              {isOwner ? <UserCheck className="w-3.5 h-3.5 text-slate-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />}
              <span>Basculer en {isOwner ? 'Secrétaire' : 'Gérant'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
