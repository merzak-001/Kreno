'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DollarSign, CheckCircle2, Clock, ChevronRight, Download, Receipt, Plus, Eye } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { Student, getCategoryBadgeClass } from '@/types/kreno';
import { CandidateSummaryModal } from '@/components/CandidateSummaryModal';
import { PaymentModal } from '@/components/PaymentModal';

export default function FinancesPage() {
  const { students, userRole } = useKreno();
  const isOwner = userRole === 'owner';

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  if (!isOwner) {
    return (
      <div className="bg-surface p-12 rounded-3xl border border-border-subtle text-center space-y-3 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Accès Restreint</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ce registre comptable et financier est strictement réservé au Propriétaire (Gérant).
        </p>
      </div>
    );
  }

  const totalContractRevenue = students.reduce((acc, s) => acc + (s.total_package_price || 0), 0);
  const totalCollected = students.reduce((acc, s) => acc + (s.amount_paid || 0), 0);
  const totalOutstanding = Math.max(0, totalContractRevenue - totalCollected);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Registre Comptable & Recettes Financières</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suivi des versements, acomptes échelonnés, frais d&apos;examen et soldes des contrats d&apos;apprentissage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-emerald-700 dark:text-emerald-300 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            Trésorerie Encaissée : {totalCollected.toLocaleString()} DZD
          </div>
          {students.length > 0 && (
            <button
              onClick={() => {
                setSelectedStudent(students[0]);
                setIsPaymentOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Versement</span>
            </button>
          )}
        </div>
      </div>

      {/* Structured KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block font-bold uppercase tracking-wider">Total Forfaits Facturés</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalContractRevenue.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">Montant total des dossiers signés</span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs bg-emerald-50/20 dark:bg-emerald-950/20">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-sans block font-bold uppercase tracking-wider">Versements Déjà Encaissés</span>
          <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1.5">{totalCollected.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans mt-0.5 block font-medium">Règlements reçus (Espèces / Virement)</span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs bg-amber-50/20 dark:bg-amber-950/20">
          <span className="text-xs text-amber-800 dark:text-amber-300 font-sans block font-bold uppercase tracking-wider">Créances Restantes à Encaisser</span>
          <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1.5">{totalOutstanding.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-sans mt-0.5 block font-medium">Soldes dus par les candidats</span>
        </div>
      </div>

      {/* Detailed Payments Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-400 font-bold border-b border-border-subtle uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Dossier</th>
                <th className="p-4">Candidat</th>
                <th className="p-4">Permis</th>
                <th className="p-4 font-mono">Prix Forfait</th>
                <th className="p-4 font-mono">Total Versé</th>
                <th className="p-4 font-mono">Reste Dû</th>
                <th className="p-4 text-center">État du Paiement</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono">
              {students.map(st => {
                const balance = Math.max(0, (st.total_package_price || 0) - (st.amount_paid || 0));
                return (
                  <tr 
                    key={st.id} 
                    onClick={() => {
                      setSelectedStudent(st);
                      setIsSummaryOpen(true);
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-surface-elevated/70 transition cursor-pointer"
                  >
                    <td className="p-4 font-bold text-slate-600 dark:text-slate-400">{st.dossier_number}</td>
                    <td className="p-4 font-sans font-bold text-slate-900 dark:text-white">
                      {st.last_name} {st.first_name}
                    </td>
                    <td className="p-4 font-sans">
                      <span className={`px-2.5 py-1 rounded-md font-bold border text-xs shadow-2xs ${getCategoryBadgeClass(st.requested_category)}`}>
                        Cat. {st.requested_category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-bold">{(st.total_package_price || 0).toLocaleString()} DZD</td>
                    <td className="p-4 text-emerald-700 dark:text-emerald-300 font-bold">{(st.amount_paid || 0).toLocaleString()} DZD</td>
                    <td className="p-4 text-amber-700 dark:text-amber-400 font-bold">{balance.toLocaleString()} DZD</td>
                    <td className="p-4 text-center font-sans">
                      {balance === 0 ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold shadow-2xs">
                          Payé (100%)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold shadow-2xs">
                          Reste {balance.toLocaleString()} DZD
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedStudent(st);
                            setIsPaymentOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Encaisser
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(st);
                            setIsSummaryOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-surface-elevated rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer border border-transparent hover:border-border-subtle"
                          title="Fiche Synthèse Popup"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CandidateSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        student={selectedStudent}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
}
