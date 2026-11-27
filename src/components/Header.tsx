'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Sun, Moon, History, Menu, RefreshCw } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { AuditLogModal } from '@/components/AuditLogModal';

interface HeaderProps {
  onOpenRegister: () => void;
  onOpenSidebar?: () => void;
}

export function Header({ onOpenRegister, onOpenSidebar }: HeaderProps) {
  const { searchQuery, setSearchQuery, theme, setTheme, userRole, syncStatus, refreshFromSupabase } = useKreno();
  const isOwner = userRole === 'owner';
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header 
        className="h-16 bg-surface/95 dark:bg-surface/90 backdrop-blur-md border-b border-border-subtle px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-30 transition-colors w-full"
      >
        {/* Mobile Menu Button + Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="p-2 rounded-xl border border-border-subtle bg-surface hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-600 dark:text-slate-300 transition lg:hidden cursor-pointer shrink-0"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher candidat, NIN, téléphone..."
              className="w-full pr-4 pl-10 py-2 bg-slate-100/80 dark:bg-surface-elevated border border-border-subtle rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Action Buttons & Theme Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Sync Status Pill */}
          <button
            onClick={() => refreshFromSupabase()}
            title="État de synchronisation Supabase (cliquer pour actualiser)"
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : syncStatus === 'syncing'
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                : syncStatus === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-surface-elevated text-slate-500 border-border-subtle'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>
              {syncStatus === 'synced'
                ? 'Synchronisé'
                : syncStatus === 'syncing'
                ? 'Synchro...'
                : syncStatus === 'error'
                ? 'Erreur synchro'
                : 'Mode local'}
            </span>
          </button>
          
          {/* Audit Log Button (Owner only) */}
          {isOwner && (
            <button
              onClick={() => setIsAuditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-subtle bg-surface hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-300 transition cursor-pointer text-xs font-medium"
              title="Consulter le journal d'audit des modifications"
            >
              <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Journal d&apos;Audit</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border-subtle bg-surface hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title={mounted && theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Quick Student Register Button */}
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-medium shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouveau Dossier</span>
          </button>
        </div>
      </header>

      {/* Audit Log Modal */}
      {isOwner && (
        <AuditLogModal 
          isOpen={isAuditOpen} 
          onClose={() => setIsAuditOpen(false)} 
        />
      )}
    </>
  );
}
