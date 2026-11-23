'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DollarSign, CheckCircle2, Clock, ChevronRight, Download, Receipt, Plus, Eye } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { Student, getCategoryBadgeClass } from '@/types/kreno';
import { PaymentModal } from '@/components/PaymentModal';

export default function FinancesPage() {
  const router = useRouter();
  const { students, userRole } = useKreno();
  const isOwner = userRole === 'owner';

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  if (!isOwner) {
    return (
      <div className="bg-surface p-12 rounded-2xl border border-border-subtle text-center space-y-3 shadow-xs">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Accès Restreint</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ce registre comptable et financier est strictement réservé au Propriétaire (Gérant).
        </p>
      </div>
    );
  }

  const totalContractRevenue = students.reduce((acc, s) => acc + (s.total_package_price || 0), 0);
  const totalCollected = students.reduce((acc, s) => acc + (s.amount_paid || 0), 0);
  const totalOutstanding = Math.max(0, totalContractRevenue - totalCollected);

  // All itemized payments across all students
  const allPayments = students.flatMap(s => 
    (s.payments || []).map(p => ({
      ...p,
      studentName: `${s.first_name} ${s.last_name}`,
      dossierNumber: s.dossier_number,
      category: s.requested_category,
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              Module Propriétaire
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">• Trésorerie & Facturation DZD</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Registre Comptable & Recettes Financières
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des versements, acomptes échelonnés, frais d&apos;examen et soldes des contrats d&apos;apprentissage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold text-sm bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            Trésorerie Encaissée : {totalCollected.toLocaleString()} DZD
          </div>
          {students.length > 0 && (
            <button
              onClick={() => {
                setSelectedStudent(students[0]);
                setIsPaymentOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-medium transition shadow-xs shadow-blue-600/20 cursor-pointer"
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
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block font-medium uppercase tracking-wider">Total Forfaits Facturés</span>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1.5">{totalContractRevenue.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">Montant total des dossiers signés</span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-sans block font-medium uppercase tracking-wider">Recettes Encaissées</span>
          <h3 className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5">+{totalCollected.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">
            Taux de recouvrement: {totalContractRevenue > 0 ? Math.round((totalCollected / totalContractRevenue) * 100) : 0}%
          </span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs">
          <span className="text-xs text-amber-700 dark:text-amber-300 font-sans block font-medium uppercase tracking-wider">Créances en Attente</span>
          <h3 className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1.5">{totalOutstanding.toLocaleString()} DZD</h3>
          <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">Reste à percevoir sur dossiers en cours</span>
        </div>
      </div>

      {/* Itemized Payments History */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Historique Général des Quittances Émises</h3>
          <span className="text-xs text-slate-400 font-mono">{allPayments.length} versements enregistrés</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 dark:text-slate-400 border-b border-border-subtle text-[10px] uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">N° Quittance / Date</th>
                <th className="py-3 px-4">Candidat</th>
                <th className="py-3 px-4">Mode & Libellé</th>
                <th className="py-3 px-4 font-mono text-right">Montant Encaissé</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-sans">
              {allPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50 transition">
                  <td className="py-3 px-4 font-mono">
                    <strong className="text-slate-900 dark:text-white block font-medium">{p.receipt_number || 'Reçu'}</strong>
                    <span className="text-[11px] text-slate-400">{p.date}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900 dark:text-white block">{p.studentName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{p.dossierNumber} • Cat. {p.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 font-medium text-[10px] capitalize">
                      {p.method}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{p.notes || p.type}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <strong className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                      +{p.amount.toLocaleString()} DZD
                    </strong>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/candidates/${p.student_id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                      <span>Fiche</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedStudent && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          student={selectedStudent}
        />
      )}

    </div>
  );
}
