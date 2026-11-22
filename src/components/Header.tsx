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
        className="h-20 bg-surface/95 dark:bg-surface/90 backdrop-blur-md border-b border-border-subtle px-8 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-2xs"
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
              className="w-full pr-4 pl-10 py-2.5 bg-slate-100/70 dark:bg-surface-elevated border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>

        {/* Action Buttons, Theme Switcher, Audit Log & Status Badge */}
        <div className="flex items-center gap-3">
          
          {/* Audit Log / Journal d'audit Button */}
          <button
            onClick={() => setIsAuditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-subtle bg-surface hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-300 transition cursor-pointer text-xs font-bold shadow-2xs"
            title="Consulter le journal d'audit des modifications"
          >
            <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Journal d&apos;Audit</span>
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border-subtle bg-surface hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-600 dark:text-slate-300 transition cursor-pointer shadow-2xs"
            title={theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Role Pill */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${
            isOwner 
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' 
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
          }`}>
            {isOwner ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            <span>{isOwner ? 'Mode Propriétaire (Gérant)' : 'Mode Secrétariat (Accueil)'}</span>
          </div>

          {/* Quick Student Register Button */}
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
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
