'use client';

import React, { useState } from 'react';
import { Search, UserPlus, ShieldCheck, UserCheck, Sun, Moon, History } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { AuditLogModal } from '@/components/AuditLogModal';

interface HeaderProps {
  onOpenRegister: () => void;
}

export function Header({ onOpenRegister }: HeaderProps) {
  const { searchQuery, setSearchQuery, userRole, theme, setTheme } = useKreno();
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const isOwner = userRole === 'owner';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header 
        className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors"
      >
        {/* Search Input */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un candidat (Nom, Prénom, NIN, Téléphone)..."
              className="w-full pr-4 pl-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-850 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Action Buttons, Theme Switcher, Audit Log & Status Badge */}
        <div className="flex items-center gap-3">
          
          {/* Audit Log / Journal d'audit Button */}
          <button
            onClick={() => setIsAuditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-800 transition cursor-pointer text-xs font-bold"
            title="Consulter le journal d'audit des modifications"
          >
            <History className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Journal d&apos;Audit</span>
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
            title={theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Role Pill */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
            isOwner 
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          }`}>
            {isOwner ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            <span>{isOwner ? 'Mode Propriétaire (Gérant)' : 'Mode Secrétariat (Accueil)'}</span>
          </div>

          {/* Quick Student Register Button */}
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Candidat</span>
          </button>
        </div>
      </header>

      {/* Global Audit Log Modal */}
      <AuditLogModal 
        isOpen={isAuditOpen} 
        onClose={() => setIsAuditOpen(false)} 
      />
    </>
  );
}
