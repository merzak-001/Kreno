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
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Registre Comptable & Recettes Financières</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suivi des versements, acomptes échelonnés, frais d&apos;examen et soldes des contrats d&apos;apprentissage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-emerald-700 dark:text-emerald-300 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
            Trésorerie Encaissée: {totalCollected.toLocaleString()} DZD
          </div>
          {students.length > 0 && (
            <button
              onClick={() => {
                setSelectedStudent(students[0]);
                setIsPaymentOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouveau Versement
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">Total Forfaits Facturés:</span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalContractRevenue.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-slate-400 font-sans">Montant total des dossiers signés</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 shadow-xs bg-emerald-50/20 dark:bg-emerald-950/20">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-sans block">Versements Déjà Encaissés:</span>
          <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{totalCollected.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans">Règlements reçus (Espèces / Virement)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/60 shadow-xs bg-amber-50/20 dark:bg-amber-950/20">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-sans block">Créances Restantes à Encaisser:</span>
          <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">{totalOutstanding.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-sans">Soldes dus par les candidats</span>
        </div>
      </div>

      {/* Detailed Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {students.map(st => {
              const balance = Math.max(0, (st.total_package_price || 0) - (st.amount_paid || 0));
              return (
                <tr 
                  key={st.id} 
                  onClick={() => {
                    setSelectedStudent(st);
                    setIsSummaryOpen(true);
                  }}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <td className="p-4 font-bold text-slate-600 dark:text-slate-400">{st.dossier_number}</td>
                  <td className="p-4 font-sans font-bold text-slate-900 dark:text-white">
                    {st.last_name} {st.first_name}
                  </td>
                  <td className="p-4 font-sans">
                    <span className={`px-2 py-0.5 rounded font-bold border text-xs ${getCategoryBadgeClass(st.requested_category)}`}>
                      Cat. {st.requested_category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-800 dark:text-slate-200 font-bold">{(st.total_package_price || 0).toLocaleString()} DZD</td>
                  <td className="p-4 text-emerald-700 dark:text-emerald-400 font-bold">{(st.amount_paid || 0).toLocaleString()} DZD</td>
                  <td className="p-4 text-amber-700 dark:text-amber-400 font-bold">{balance.toLocaleString()} DZD</td>
                  <td className="p-4 text-center font-sans">
                    {balance === 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        Payé (100%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
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
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Ajouter un versement"
                      >
                        + Versement
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(st);
                          setIsSummaryOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
