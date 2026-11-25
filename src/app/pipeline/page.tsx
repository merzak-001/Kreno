'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MapPin, 
  User, 
  DollarSign, 
  Plus, 
  Printer, 
  Users, 
  Car, 
  Eye, 
  Check, 
  AlertTriangle, 
  Trash2,
  Edit
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { Student, ExamType, ExamResult, ExamRecord, getCategoryBadgeClass } from '@/types/kreno';
import { NewExamSessionModal } from '@/components/NewExamSessionModal';
import { ExamSessionPrintModal } from '@/components/ExamSessionPrintModal';
import { CandidateSummaryModal } from '@/components/CandidateSummaryModal';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ExamSessionGroup {
  date: string;
  center: string;
  examiner: string;
  isPast: boolean;
  entries: { student: Student; exam: ExamRecord }[];
  totalCandidates: number;
  categoriesCount: Record<string, number>;
  examTypesCount: { code: number; creneau: number; circulation: number };
  passedCount: number;
  failedCount: number;
  pendingCount: number;
  totalFees: number;
  feesPaidTotal: number;
  unpaidFeesCount: number;
}

export default function PipelinePage() {
  const { students, updateExamResultById, toggleExamFeePayment, deleteExamSession, deleteExamRecord, userRole } = useKreno();

  // Modals state
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ExamSessionGroup | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activePrintSession, setActivePrintSession] = useState<ExamSessionGroup | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warningNote?: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const isOwner = userRole === 'owner';

  // Group all exams across students by Date + Center
  const sessionGroups: ExamSessionGroup[] = useMemo(() => {
    const map = new Map<string, ExamSessionGroup>();

    students.forEach(student => {
      student.exams.forEach(exam => {
        if (!exam.exam_date) return;
        const key = `${exam.exam_date}___${exam.exam_center || 'Centre Principal'}`;

        if (!map.has(key)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPast = new Date(exam.exam_date) < today;
          map.set(key, {
            date: exam.exam_date,
            center: exam.exam_center || 'Centre Principal',
            examiner: exam.examiner_name || 'Ingénieur d\'État',
            isPast,
            entries: [],
            totalCandidates: 0,
            categoriesCount: {},
            examTypesCount: { code: 0, creneau: 0, circulation: 0 },
            passedCount: 0,
            failedCount: 0,
            pendingCount: 0,
            totalFees: 0,
            feesPaidTotal: 0,
            unpaidFeesCount: 0,
          });
        }

        const group = map.get(key)!;
        group.entries.push({ student, exam });
        group.totalCandidates++;

        const cat = student.requested_category;
        group.categoriesCount[cat] = (group.categoriesCount[cat] || 0) + 1;

        group.examTypesCount[exam.exam_type]++;

        if (exam.result === 'passed') group.passedCount++;
        else if (exam.result === 'failed') group.failedCount++;
        else group.pendingCount++;

        const fee = exam.fee_amount || 2000;
        group.totalFees += fee;
        if (exam.fee_paid) {
          group.feesPaidTotal += fee;
        } else {
          group.unpaidFeesCount++;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [students]);

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleExpand = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const handlePrintSession = (session: ExamSessionGroup) => {
    setActivePrintSession(session);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Ingénieurs d&apos;État
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">• Sessions Officielles Daïra</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Sessions d&apos;Examen & Bordereaux
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organisation des journées d&apos;examen, saisie des résultats officiels et impression des listes d&apos;émargement A4.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSession(null);
            setIsNewSessionOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-medium transition shadow-xs shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Session d&apos;Examen</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessionGroups.length > 0 ? (
          sessionGroups.map(session => {
            const dateKey = `${session.date}___${session.center}`;
            const isExpanded = expandedDates[dateKey] !== false; // default open

            return (
              <div 
                key={dateKey} 
                className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-all"
              >
                {/* Session Header Card */}
                <div 
                  onClick={() => toggleExpand(dateKey)}
                  className="p-5 flex items-center justify-between flex-wrap gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50 transition border-b border-border-subtle"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-mono font-semibold text-sm shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                      {session.totalCandidates}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white font-mono">
                          {session.date}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          session.isPast 
                            ? 'bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle' 
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {session.isPast ? 'Session Clôturée' : 'Session À Venir'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{session.center}</span>
                        <span>•</span>
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Examinateur : {session.examiner}</span>
                      </p>
                    </div>
                  </div>

                  {/* Summary counts & actions */}
                  <div className="flex items-center gap-4 text-xs" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                        {session.passedCount} Admis
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium">
                        {session.failedCount} Ajournés
                      </span>
                      {session.pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                          {session.pendingCount} En attente
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handlePrintSession(session)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition cursor-pointer shadow-xs"
                      title="Imprimer le bordereau officiel A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Bordereau A4</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(dateKey)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Candidate Entries Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 dark:text-slate-400 border-b border-border-subtle text-[10px] uppercase font-semibold tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Candidat</th>
                          <th className="py-2.5 px-4">Épreuve</th>
                          <th className="py-2.5 px-4">Tentative</th>
                          <th className="py-2.5 px-4">Frais D&apos;examen</th>
                          <th className="py-2.5 px-4">Résultat Examen</th>
                          <th className="py-2.5 px-4 text-right">Fiche</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {session.entries.map(({ student, exam }) => (
                          <tr key={exam.id} className="hover:bg-slate-50/60 dark:hover:bg-surface-elevated/40 transition">
                            
                            {/* Candidate info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadgeClass(student.requested_category)}`}>
                                  Cat. {student.requested_category}
                                </span>
                                <div>
                                  <Link 
                                    href={`/candidates/${student.id}`}
                                    className="font-medium text-slate-900 dark:text-white hover:text-blue-600 transition"
                                  >
                                    {student.first_name} {student.last_name}
                                  </Link>
                                  <span className="font-mono text-[11px] text-slate-400 block">
                                    {student.dossier_number}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Exam Type */}
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                                {exam.exam_type === 'code' ? 'Code théorique' : exam.exam_type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                              </span>
                            </td>

                            {/* Attempt number */}
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              #{exam.attempt_number} / 15
                            </td>

                            {/* Fees toggle */}
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleExamFeePayment(student.id, exam.id, !exam.fee_paid)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                                  exam.fee_paid
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {exam.fee_paid ? 'Payé (2,000 DZD)' : 'À Encaisser'}
                              </button>
                            </td>

                            {/* Result selector */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => updateExamResultById(student.id, exam.id, 'passed')}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                                    exam.result === 'passed'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  }`}
                                >
                                  Admis
                                </button>

                                <button
                                  onClick={() => updateExamResultById(student.id, exam.id, 'failed')}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                                    exam.result === 'failed'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                  }`}
                                >
                                  Ajourné
                                </button>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/candidates/${student.id}`}
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-600 rounded-lg transition inline-block"
                                title="Voir le profil"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            );
          })
        ) : (
          <div className="bg-surface p-12 rounded-2xl border border-border-subtle text-center space-y-3">
            <Award className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aucune session programmée</h3>
            <p className="text-xs text-slate-400">
              Cliquez sur &quot;Nouvelle Session d&apos;Examen&quot; pour convoquer des élèves avec l&apos;ingénieur d&apos;État.
            </p>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      <NewExamSessionModal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        editSession={editingSession || null}
      />

      {/* Print Session Modal */}
      {activePrintSession && (
        <ExamSessionPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          sessionDate={activePrintSession.date}
          sessionCenter={activePrintSession.center}
          examinerName={activePrintSession.examiner}
          entries={activePrintSession.entries}
        />
      )}

      {/* Candidate Quick Summary Modal */}
      <CandidateSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        student={selectedStudent}
      />

    </div>
  );
}
