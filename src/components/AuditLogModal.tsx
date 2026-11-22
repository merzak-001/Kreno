'use client';

import React, { useState } from 'react';
import { History, X, Search, Filter, ShieldCheck, UserCheck, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { AuditLogEntry } from '@/types/kreno';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const { auditLogs } = useKreno();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'secretary'>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter(log => {
    if (filterRole !== 'all' && log.user_role !== filterRole) return false;
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTarget = log.target_name.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchType = log.target_type.toLowerCase().includes(q);
      if (!matchTarget && !matchDetails && !matchType) return false;
    }
    return true;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'cancel_payment':
      case 'delete':
      case 'delete_session':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Suppression / Annulation</span>;
      case 'add_payment':
      case 'create':
      case 'create_session':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900">Création / Ajout</span>;
      case 'update':
      case 'record_result':
      case 'toggle_fee':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Modification</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Action</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-border-subtle overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Topbar */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-200">
                Journal d&apos;Audit & Historique des Modifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Traçabilité complète des actions : créations, modifications, encaissements et suppressions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par candidat, montant, détail..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border-subtle rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-1.5 bg-surface border border-border-subtle rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="all">Tous les rôles</option>
              <option value="owner">Propriétaire (Gérant)</option>
              <option value="secretary">Secrétaire</option>
            </select>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-border-subtle rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="all">Toutes les actions</option>
              <option value="cancel_payment">Annulation paiement</option>
              <option value="add_payment">Ajout paiement</option>
              <option value="create">Création candidat</option>
              <option value="update">Modification candidat</option>
              <option value="delete">Suppression candidat</option>
              <option value="create_session">Création session</option>
              <option value="delete_session">Suppression session</option>
              <option value="record_result">Verdict examen</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-xs font-medium">Aucun événement ne correspond à vos filtres.</p>
            </div>
          ) : (
            <div className="border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle bg-surface">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex items-start justify-between gap-4 text-xs">
                  
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.user_role === 'owner' 
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {log.user_role === 'owner' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        <span>{log.user_role === 'owner' ? 'Gérant' : 'Secrétaire'}</span>
                      </span>

                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {log.target_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({log.target_type})
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-xs">
                      {log.details}
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                    <div>{log.timestamp.split('T')[0]}</div>
                    <div className="text-[10px] text-slate-500">{log.timestamp.split('T')[1]?.substring(0, 5) || ''}</div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
          <span>Total : {filteredLogs.length} action(s) consignée(s)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
