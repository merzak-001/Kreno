'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Award, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Car, 
  ChevronRight,
  Calendar,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { ExamType, Student, getCategoryBadgeClass } from '@/types/kreno';
import { CandidateSummaryModal } from '@/components/CandidateSummaryModal';

export default function DashboardPage() {
  const { students, userRole } = useKreno();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isOwner = userRole === 'owner';

  // Statistics calculation
  const stats = useMemo(() => {
    const total = students.length;
    let codeReady = 0;
    let creneauReady = 0;
    let circulationReady = 0;
    let graduated = 0;
    let totalRevenue = 0;
    let totalPaid = 0;

    students.forEach(st => {
      totalRevenue += st.total_package_price || 0;
      totalPaid += st.amount_paid || 0;

      const passedCode = st.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
      const passedCreneau = st.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
      const passedCirculation = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');

      if (passedCirculation) {
        graduated++;
      } else if (passedCreneau) {
        circulationReady++;
      } else if (passedCode) {
        creneauReady++;
      } else {
        codeReady++;
      }
    });

    return {
      total,
      codeReady,
      creneauReady,
      circulationReady,
      graduated,
      totalRevenue,
      totalPaid,
      outstanding: Math.max(0, totalRevenue - totalPaid),
    };
  }, [students]);

  // Upcoming scheduled 1-hour slots
  const upcomingSlots = useMemo(() => {
    const allSlots = students.flatMap(s => s.schedule_slots || []);
    return allSlots
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [students]);

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-slate-900 dark:bg-slate-900/90 rounded-2xl p-6 md:p-7 text-white shadow-xs relative overflow-hidden flex items-center justify-between border border-border-subtle">
        <div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-blue-300 border border-primary/30 inline-block mb-3">
            Plateforme Intégrée Auto-École • KRENO
          </span>
          <h2 className="text-xl md:text-2xl font-bold mb-1 tracking-tight">
            Tableau de Bord Général
          </h2>
          <p className="text-xs text-slate-300">
            Gestion des plannings en unités de 1h, suivi des 3 examens et édition des dossiers officiels.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/candidates"
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            Consulter le Registre des Candidats
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Candidates */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Dossiers</span>
            <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary border border-primary-subtle-border flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-200 font-mono">{stats.total}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Candidats actifs</span>
          </div>
        </div>

        {/* 2. Étape 1: Code */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">1. Épreuve Code</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-200 font-mono">{stats.codeReady}</span>
            <span className="text-xs text-slate-400 block mt-0.5">En cours d&apos;apprentissage</span>
          </div>
        </div>

        {/* 3. Étape 2: Créneau */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">2. Épreuve Créneau</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-200 font-mono">{stats.creneauReady}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Code validé, manoeuvres</span>
          </div>
        </div>

        {/* 4. Étape 3: Conduite & Diplômés */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">3. Conduite & Succès</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-200 font-mono">{stats.graduated}</span>
            <span className="text-xs text-slate-400 block mt-0.5">{stats.circulationReady} en circuit routier</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming 1-Hour Sessions & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Upcoming 1-Hour Schedule Sessions */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-subtle p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Prochaines Séances de Formation (Unité 1h)</h3>
            </div>
            <Link href="/schedule" className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1">
              <span>Voir le planning complet</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingSlots.length > 0 ? (
              upcomingSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="p-4 rounded-xl border border-border-subtle bg-slate-50/70 dark:bg-slate-900/30 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-primary text-white font-mono font-semibold text-xs">
                      {slot.time_start} - {slot.time_end}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-200">{slot.student_name}</h4>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Conduite en circulation'} • Moniteur : {slot.instructor_name}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-medium bg-surface border border-border-subtle px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300">
                    {slot.date}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune séance planifiée pour le moment.</p>
            )}
          </div>
        </div>

        {/* Right: Financial Recap (Owner Only) */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Situation Financière</h3>
              </div>
              {!isOwner && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full font-medium">
                  Réservé au Propriétaire
                </span>
              )}
            </div>

            {isOwner ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-border-subtle">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total des contrats signés:</span>
                  <strong className="text-sm font-mono text-slate-900 dark:text-slate-200">{stats.totalRevenue.toLocaleString()} DZD</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Versements encaissés:</span>
                  <strong className="text-sm font-mono text-emerald-700 dark:text-emerald-300 font-bold">{stats.totalPaid.toLocaleString()} DZD</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Créances en attente:</span>
                  <strong className="text-sm font-mono text-amber-700 dark:text-amber-300 font-bold">{stats.outstanding.toLocaleString()} DZD</strong>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-border-subtle text-slate-400">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Données financières masquées en mode Secrétaire</p>
                <p className="text-[11px] mt-1 text-slate-400">Basculer en mode Gérant dans la barre latérale pour afficher.</p>
              </div>
            )}
          </div>

          {isOwner && (
            <div className="pt-4 border-t border-border-subtle mt-4 text-right">
              <Link href="/finances" className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center justify-end gap-1">
                Consulter le registre financier <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Candidate List preview with clickable row */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-colors">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Candidats Récents & Progression</h3>
            <p className="text-[11px] text-slate-400">Cliquez sur une ligne pour ouvrir la Fiche Synthèse du candidat.</p>
          </div>
          <Link 
            href="/candidates"
            className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1"
          >
            <span>Voir tous les candidats</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-semibold border-b border-border-subtle">
              <tr>
                <th className="p-3.5">N° Dossier</th>
                <th className="p-3.5">Candidat</th>
                <th className="p-3.5">Catégorie</th>
                <th className="p-3.5">Téléphone</th>
                <th className="p-3.5 text-center">Code</th>
                <th className="p-3.5 text-center">Créneau</th>
                <th className="p-3.5 text-center">Conduite</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {students.slice(0, 5).map(st => {
                const codePassed = st.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
                const creneauPassed = st.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
                const circPassed = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');

                return (
                  <tr 
                    key={st.id} 
                    onClick={() => handleRowClick(st)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono text-slate-500 font-semibold group-hover:text-primary">{st.dossier_number}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-200 block group-hover:text-primary">{st.first_name} {st.last_name}</span>
                      <span className="text-[10px] text-slate-400">Né le {st.birth_date}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-xs border ${getCategoryBadgeClass(st.requested_category)}`}>
                        Cat. {st.requested_category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{st.phone_number}</td>
                    <td className="p-3.5 text-center">
                      {codePassed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium text-[10px] border border-emerald-200/50 dark:border-emerald-800/30">Validé</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">En cours</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {creneauPassed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium text-[10px] border border-emerald-200/50 dark:border-emerald-800/30">Validé</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">En cours</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {circPassed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium text-[10px] border border-emerald-200/50 dark:border-emerald-800/30">Validé</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">En cours</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(st);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition inline-flex items-center gap-1 cursor-pointer border border-border-subtle"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Fiche Synthèse
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Summary Modal */}
      <CandidateSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
}
