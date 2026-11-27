'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
  X
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { KrenoLogo } from '@/components/KrenoLogo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, accountRole, authEmail, setUserRole, school, settings } = useKreno();
  const isOwner = userRole === 'owner';
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleRoleToggle = () => {
    if (isOwner) {
      setUserRole('secretary');
    } else {
      setPinInput('');
      setPinError(false);
      setIsPinModalOpen(true);
    }
  };

  const handleUnlockOwner = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = (settings.owner_pin || '1234').trim();
    if (pinInput.trim() === expectedPin) {
      setUserRole('owner');
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

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
    { 
      path: '/security', 
      label: 'Sécurité & PIN', 
      icon: ShieldCheck, 
      ownerOnly: true 
    },
  ];

  const handleLogout = async () => {
    localStorage.removeItem('kreno_role');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

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
              <KrenoLogo className="w-10 h-10 rounded-xl shadow-md shadow-blue-900/40 shrink-0" />
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
              <span className="text-slate-400 text-[11px] font-medium truncate max-w-[120px]" title={authEmail || ''}>
                {authEmail || 'Session active'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                isOwner 
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isOwner ? 'Gérant' : 'Secrétariat'}
              </span>
            </div>

            {accountRole === 'owner' && (
              <button
                onClick={handleRoleToggle}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-200 rounded-lg text-xs font-medium transition border border-white/10 cursor-pointer"
                title={isOwner ? 'Passer en mode Secrétaire' : 'Déverrouiller le mode Gérant (PIN requis)'}
              >
                {isOwner ? <UserCheck className="w-3.5 h-3.5 text-slate-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isOwner ? 'Passer en Secrétaire' : 'Déverrouiller Gérant'}</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium transition border border-rose-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Owner PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUnlockOwner}
            className="bg-surface rounded-2xl w-full max-w-xs border border-border-subtle shadow-2xl p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Accès Gérant</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1.5">
                Entrez le code PIN du Gérant :
              </label>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-mono text-center text-base tracking-widest"
              />
              {pinError && (
                <p className="text-rose-600 font-semibold mt-1.5">Code PIN incorrect.</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
              >
                Valider
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
