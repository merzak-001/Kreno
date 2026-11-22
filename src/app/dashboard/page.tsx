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
  Eye,
  TrendingUp,
  FileText
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
      {/* Welcome Banner: Rich Midnight Navy & Sapphire Glow */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#111C38] to-[#0B132B] rounded-3xl p-7 text-white shadow-xl relative overflow-hidden flex items-center justify-between border border-blue-900/50">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono tracking-wide">
              Plateforme SaaS Auto-École • KRENO PRO
            </span>
            <span className="text-xs text-slate-400">• Session active</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1.5">
            Tableau de Bord Général
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Gestion intégrée des candidats, planification par unités de 1h, suivi des 3 examens officiels et édition des bordereaux A4.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-3 relative z-10">
          <Link
            href="/candidates"
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Consulter le Registre des Candidats</span>
          </Link>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* KPI Cards: Structured 4-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Candidates */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Dossiers</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center font-bold shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1 font-medium">Candidats actifs inscrits</span>
          </div>
        </div>

        {/* 2. Étape 1: Code */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">1. Épreuve Code</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center font-bold shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.codeReady}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 block mt-1 font-semibold">En cours d&apos;apprentissage</span>
          </div>
        </div>

        {/* 3. Étape 2: Créneau */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">2. Épreuve Créneau</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center font-bold shadow-2xs">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.creneauReady}</span>
            <span className="text-xs text-purple-600 dark:text-purple-400 block mt-1 font-semibold">Code validé, sur piste</span>
          </div>
        </div>

        {/* 4. Étape 3: Conduite & Succès */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">3. Conduite & Succès</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center font-bold shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats.graduated}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1 font-medium">
              Permis délivrés • <strong className="text-slate-900 dark:text-slate-200">{stats.circulationReady}</strong> en circuit
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming 1-Hour Sessions & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Upcoming 1-Hour Schedule Sessions */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-subtle p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Prochaines Séances de Formation (Unité 1h)</h3>
                <p className="text-[11px] text-slate-400">Planning hebdomadaire conforme aux réglages</p>
              </div>
            </div>
            <Link href="/schedule" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1">
              <span>Voir le planning complet</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingSlots.length > 0 ? (
              upcomingSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="p-3.5 rounded-xl border border-border-subtle bg-slate-50/70 dark:bg-surface-elevated flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs shadow-xs">
                      {slot.time_start} - {slot.time_end}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{slot.student_name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Conduite en circulation'} • Moniteur : <strong className="text-slate-700 dark:text-slate-300">{slot.instructor_name}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold bg-white dark:bg-surface border border-border-subtle px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 shadow-2xs">
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
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Situation Financière</h3>
                  <p className="text-[11px] text-slate-400">Recettes & Acomptes</p>
                </div>
              </div>
              {!isOwner && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">
                  Privé
                </span>
              )}
            </div>

            {isOwner ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-surface-elevated rounded-xl border border-border-subtle">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Total des contrats :</span>
                  <strong className="text-sm font-mono text-slate-900 dark:text-white font-black">{stats.totalRevenue.toLocaleString()} DZD</strong>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <span className="text-xs text-emerald-900 dark:text-emerald-300 font-bold">Versements encaissés :</span>
                  <strong className="text-sm font-mono text-emerald-700 dark:text-emerald-300 font-black">{stats.totalPaid.toLocaleString()} DZD</strong>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                  <span className="text-xs text-amber-900 dark:text-amber-300 font-bold">Créances en attente :</span>
                  <strong className="text-sm font-mono text-amber-700 dark:text-amber-300 font-black">{stats.outstanding.toLocaleString()} DZD</strong>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 dark:bg-surface-elevated rounded-xl border border-dashed border-border-subtle text-slate-400 space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Données financières masquées</p>
                <p className="text-[11px] text-slate-400">Basculez en mode Gérant dans la barre latérale pour afficher.</p>
              </div>
            )}
          </div>

          {isOwner && (
            <div className="pt-4 border-t border-border-subtle mt-4 text-right">
              <Link href="/finances" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center justify-end gap-1">
                <span>Consulter le registre financier</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Candidate List Preview: Structured Table with Clickable Rows */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-colors">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Candidats Récents & Progression dans le Cycle</h3>
            <p className="text-[11px] text-slate-400">Cliquez sur une ligne pour ouvrir la Fiche Synthèse officielle.</p>
          </div>
          <Link 
            href="/candidates"
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1"
          >
            <span>Voir tous les candidats</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-400 font-bold border-b border-border-subtle uppercase tracking-wider text-[10px]">
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
                    className="hover:bg-slate-50 dark:hover:bg-surface-elevated/70 transition cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">{st.dossier_number}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400">{st.first_name} {st.last_name}</span>
                      <span className="text-[10px] text-slate-400">Né le {st.birth_date}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-xs border shadow-2xs ${getCategoryBadgeClass(st.requested_category)}`}>
                        Cat. {st.requested_category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 font-semibold">{st.phone_number}</td>
                    <td className="p-3.5 text-center">
                      {codePassed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">Validé</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-medium">En cours</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {creneauPassed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">Validé</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-medium">En cours</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {circPassed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">Validé</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-medium">En cours</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(st);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated dark:hover:bg-surface-hover text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer border border-border-subtle shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Fiche Synthèse</span>
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
