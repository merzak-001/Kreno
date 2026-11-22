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
        className="h-20 bg-surface border-b border-border-subtle px-8 flex items-center justify-between sticky top-0 z-30 transition-colors"
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
              className="w-full pr-4 pl-10 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Action Buttons, Theme Switcher, Audit Log & Status Badge */}
        <div className="flex items-center gap-3">
          
          {/* Audit Log / Journal d'audit Button */}
          <button
            onClick={() => setIsAuditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer text-xs font-medium"
            title="Consulter le journal d'audit des modifications"
          >
            <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Journal d&apos;Audit</span>
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer shadow-2xs"
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
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' 
              : 'bg-primary-subtle text-primary border-primary-subtle-border'
          }`}>
            {isOwner ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-primary" />}
            <span>{isOwner ? 'Mode Propriétaire (Gérant)' : 'Mode Secrétariat (Accueil)'}</span>
          </div>

          {/* Quick Student Register Button */}
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
