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
  Columns3, 
  ListFilter,
  Trash2
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

  // Expanded dates state (accordion): which session rows are open
  // By default, open the most recent/upcoming session
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // View toggle: 'sessions' (Weekly Exam Days - User Requested) or 'kanban' (3 Columns Cycle)
  const [viewMode, setViewMode] = useState<'sessions' | 'kanban'>('sessions');

  // Group all exams across students by exam_date
  const examSessions: ExamSessionGroup[] = useMemo(() => {
    const map: Record<string, { student: Student; exam: ExamRecord }[]> = {};

    students.forEach(st => {
      (st.exams || []).forEach(ex => {
        if (!ex.exam_date) return;
        if (!map[ex.exam_date]) map[ex.exam_date] = [];
        map[ex.exam_date].push({ student: st, exam: ex });
      });
    });

    // Sort dates descending
    const sortedDates = Object.keys(map).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return sortedDates.map(date => {
      const entries = map[date];
      const center = entries.find(e => e.exam.exam_center)?.exam.exam_center || 'Centre d\'Examen Aïn Oulmene';
      const examiner = entries.find(e => e.exam.examiner_name)?.exam.examiner_name || 'M. Makhloufi (Inspecteur)';

      const categoriesCount: Record<string, number> = {};
      const examTypesCount = { code: 0, creneau: 0, circulation: 0 };
      let passedCount = 0;
      let failedCount = 0;
      let pendingCount = 0;
      let totalFees = 0;
      let feesPaidTotal = 0;
      let unpaidFeesCount = 0;

      entries.forEach(({ student, exam }) => {
        // Categories
        categoriesCount[student.requested_category] = (categoriesCount[student.requested_category] || 0) + 1;

        // Exam types
        if (exam.exam_type === 'code') examTypesCount.code++;
        if (exam.exam_type === 'creneau') examTypesCount.creneau++;
        if (exam.exam_type === 'circulation') examTypesCount.circulation++;

        // Results
        if (exam.result === 'passed') passedCount++;
        else if (exam.result === 'failed') failedCount++;
        else pendingCount++;

        // Fees
        const fee = exam.fee_amount || 2000;
        totalFees += fee;
        if (exam.fee_paid) feesPaidTotal += fee;
        else unpaidFeesCount++;
      });

      const today = new Date().toISOString().split('T')[0];
      const isPast = date < today;

      return {
        date,
        center,
        examiner,
        isPast,
        entries,
        totalCandidates: entries.length,
        categoriesCount,
        examTypesCount,
        passedCount,
        failedCount,
        pendingCount,
        totalFees,
        feesPaidTotal,
        unpaidFeesCount,
      };
    });
  }, [students]);

  // Auto-expand first session on mount
  React.useEffect(() => {
    if (examSessions.length > 0 && Object.keys(expandedDates).length === 0) {
      setExpandedDates({ [examSessions[0].date]: true });
    }
  }, [examSessions, expandedDates]);

  const toggleAccordion = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const handleOpenPrint = (session: ExamSessionGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePrintSession(session);
    setIsPrintModalOpen(true);
  };

  const handleResultChange = (studentId: string, examId: string, result: ExamResult) => {
    updateExamResultById(studentId, examId, result);
  };

  const handleToggleFee = (studentId: string, examId: string, currentPaid: boolean) => {
    toggleExamFeePayment(studentId, examId, !currentPaid);
  };

  // Group candidates into the 3 sequential exam stages for the Kanban view
  const codeCandidates = useMemo(() => students.filter(
    s => !s.exams.some(e => e.exam_type === 'code' && e.result === 'passed')
  ), [students]);

  const creneauCandidates = useMemo(() => students.filter(
    s => s.exams.some(e => e.exam_type === 'code' && e.result === 'passed') &&
         !s.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed')
  ), [students]);

  const circulationCandidates = useMemo(() => students.filter(
    s => s.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed') &&
         !s.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed')
  ), [students]);

  // Overall statistics
  const totalExamsConducted = examSessions.reduce((acc, s) => acc + s.totalCandidates, 0);
  const totalPassedAll = examSessions.reduce((acc, s) => acc + s.passedCount, 0);
  const totalFeesAll = examSessions.reduce((acc, s) => acc + s.feesPaidTotal, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Sessions d&apos;Examens
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sélectionnez vos candidats pour chaque date d&apos;examen, suivez les résultats et imprimez le bordereau officiel A4.
          </p>
        </div>

        {/* View Toggle & New Session Button */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100 dark:bg-surface-elevated rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('sessions')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'sessions'
                  ? 'bg-surface text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Par Date d&apos;Examen
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-surface text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" /> Par Épreuve (3 Étapes)
            </button>
          </div>

          <button
            onClick={() => setIsNewSessionOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Programmer un Examen</span>
          </button>
        </div>
      </div>

      {/* Discreet Summary Pill */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          <strong>{examSessions.length}</strong> journée{examSessions.length > 1 ? 's' : ''} d&apos;examen • <strong>{totalExamsConducted}</strong> passages enregistrés • <strong>{totalPassedAll}</strong> admis
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Cliquez sur une session pour afficher la liste déroulante des candidats
        </span>
      </div>

      {/* VIEW 1: WEEKLY EXAM DAYS LIST (ACCORDION TABLE) */}
      {viewMode === 'sessions' && (
        <div className="space-y-3">
          {examSessions.map(session => {
            const isExpanded = !!expandedDates[session.date];
            const passRate = session.totalCandidates > 0 ? Math.round((session.passedCount / session.totalCandidates) * 100) : 0;

            return (
              <div 
                key={session.date}
                className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Accordion Summary Row - Spacious & Simple */}
                <div 
                  onClick={() => toggleAccordion(session.date)}
                  className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-surface-elevated/40 transition select-none"
                >
                  {/* Left: Date & Center */}
                  <div className="flex items-center gap-3.5 min-w-[260px]">
                    <div className="w-11 h-11 rounded-xl bg-primary-subtle text-primary border border-primary-subtle-border flex flex-col items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          {session.date}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          !session.isPast 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {!session.isPast ? 'À venir' : 'Clôturée'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {session.center} • {session.examiner}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Total candidates & exam types */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-surface-elevated font-black text-xs text-slate-800 dark:text-slate-200 border border-border-subtle">
                      {session.totalCandidates} Candidat{session.totalCandidates > 1 ? 's' : ''}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {session.examTypesCount.code > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60 text-[11px]">
                          {session.examTypesCount.code} Code
                        </span>
                      )}
                      {session.examTypesCount.creneau > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/60 text-[11px]">
                          {session.examTypesCount.creneau} Créneau
                        </span>
                      )}
                      {session.examTypesCount.circulation > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800/60 text-[11px]">
                          {session.examTypesCount.circulation} Conduite
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Results, Fees & Print button */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Results */}
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white block">
                        {session.passedCount} / {session.totalCandidates} Admis
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {session.pendingCount > 0 ? `${session.pendingCount} en attente` : `${passRate}% succès`}
                      </span>
                    </div>

                    {/* Fees situation */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      session.unpaidFeesCount === 0
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                    }`}>
                      {session.unpaidFeesCount === 0 ? 'Frais Réglés' : `${session.unpaidFeesCount} Impayé(s)`}
                    </span>

                    {/* Print Bordereau Button */}
                    <button
                      onClick={(e) => handleOpenPrint(session, e)}
                      className="px-3 py-1.5 bg-primary-subtle hover:bg-primary hover:text-white text-primary rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-primary-subtle-border cursor-pointer"
                      title="Imprimer le Bordereau Officiel A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bordereau A4</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({
                          isOpen: true,
                          title: `Supprimer la session du ${session.date}`,
                          message: `Êtes-vous certain de vouloir supprimer cette session ? Tous les candidats inscrits (${session.totalCandidates}) seront déprogrammés pour cette date.`,
                          warningNote: 'Cette opération est irréversible et sera enregistrée dans le journal d\'audit.',
                          confirmText: 'Supprimer la session',
                          onConfirm: () => {
                            deleteExamSession(session.date);
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          },
                        });
                      }}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Supprimer cette session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-surface-elevated flex items-center justify-center text-slate-500 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Drop-down Expandable Panel */}
                {isExpanded && (
                  <div className="border-t border-card-border bg-slate-50/50 dark:bg-slate-950/40 p-4 transition-all animate-in fade-in duration-150">
                    <div className="border border-card-border rounded-xl overflow-hidden bg-card-bg shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-card-bg text-slate-500 dark:text-slate-400 font-semibold border-b border-card-border">
                          <tr>
                            <th className="p-3 w-10 text-center">N°</th>
                            <th className="p-3">Candidat & Dossier</th>
                            <th className="p-3">Permis</th>
                            <th className="p-3">Épreuve Présentée</th>
                            <th className="p-3 text-center">Frais d&apos;Examen (2 000 DZD)</th>
                            <th className="p-3 text-center">Solde Forfait</th>
                            <th className="p-3 text-center">Verdict Officiel (1-Clic)</th>
                            <th className="p-3 text-right">Fiche</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border">
                          {session.entries.map(({ student, exam }, idx) => {
                            const isPaid = exam.fee_paid;
                            const fee = exam.fee_amount || 2000;
                            const remaining = Math.max(0, (student.total_package_price || 0) - (student.amount_paid || 0));

                            return (
                              <tr 
                                key={exam.id} 
                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                              >
                                <td className="p-3 text-center font-mono font-bold text-slate-400">
                                  {idx + 1}
                                </td>

                                <td className="p-3">
                                  <span className="font-bold text-slate-900 dark:text-slate-200 block">
                                    {student.first_name} {student.last_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {student.dossier_number} • NIN: {student.nin}
                                  </span>
                                </td>

                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded-md font-bold border text-xs ${getCategoryBadgeClass(student.requested_category)}`}>
                                    Cat. {student.requested_category}
                                  </span>
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                      exam.exam_type === 'code'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                        : exam.exam_type === 'creneau'
                                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    }`}>
                                      {exam.exam_type === 'code' ? '1. Code' : exam.exam_type === 'creneau' ? '2. Créneau' : '3. Conduite'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      #{exam.attempt_number || 1}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                      isPaid
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    }`}>
                                      {isPaid ? 'Payé (2 000 DZD)' : 'Impayé (2 000 DZD)'}
                                    </span>
                                    <button
                                      onClick={() => handleToggleFee(student.id, exam.id, isPaid)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                                        isPaid 
                                          ? 'text-slate-400 hover:text-rose-600' 
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                      }`}
                                      title={isPaid ? 'Marquer comme non réglé' : 'Encaisser les frais maintenant'}
                                    >
                                      {isPaid ? 'Annuler' : 'Encaisser'}
                                    </button>
                                  </div>
                                </td>

                                <td className="p-3 text-center font-mono">
                                  {remaining === 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Soldé</span>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                      Reste {remaining.toLocaleString()} DZD
                                    </span>
                                  )}
                                </td>

                                {/* Interactive 1-click Result Buttons */}
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleResultChange(student.id, exam.id, 'passed')}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                        exam.result === 'passed'
                                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30 font-black'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40'
                                      }`}
                                      title="Déclarer Admis (Succès)"
                                    >
                                      <Check className="w-3 h-3" /> Admis
                                    </button>

                                    <button
                                      onClick={() => handleResultChange(student.id, exam.id, 'failed')}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                        exam.result === 'failed'
                                          ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30 font-black'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40'
                                      }`}
                                      title="Déclarer Ajourné (Échec)"
                                    >
                                      <XCircle className="w-3 h-3" /> Ajourné
                                    </button>

                                    <button
                                      onClick={() => handleResultChange(student.id, exam.id, 'absent_unexcused')}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                        exam.result === 'absent_unexcused'
                                          ? 'bg-amber-600 text-white shadow-xs'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-700 dark:hover:bg-amber-950/40'
                                      }`}
                                      title="Déclarer Absent"
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </td>

                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setIsSummaryOpen(true);
                                      }}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                                      title="Consulter Fiche Synthèse"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          title: `Retirer ${student.first_name} ${student.last_name}`,
                                          message: `Voulez-vous retirer ce candidat de l'épreuve de ${exam.exam_type.toUpperCase()} programmée le ${session.date} ?`,
                                          warningNote: 'Cette opération supprime la convocation pour cette session.',
                                          confirmText: 'Retirer de la session',
                                          onConfirm: () => {
                                            deleteExamRecord(student.id, exam.id);
                                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                          },
                                        });
                                      }}
                                      className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                      title="Retirer ce candidat de la session"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: KANBAN 3 SEQUENTIAL COLUMNS */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Code */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-card-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-200">Étape 1: Code de la Route</h3>
                  <span className="text-[10px] text-slate-400">Examen Théorique</span>
                </div>
              </div>
              <span className="text-[11px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full font-mono">
                {codeCandidates.length}
              </span>
            </div>

            <div className="space-y-3">
              {codeCandidates.map(st => (
                <div 
                  key={st.id} 
                  onClick={() => {
                    setSelectedStudent(st);
                    setIsSummaryOpen(true);
                  }}
                  className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-card-border shadow-2xs space-y-3 hover:border-blue-700 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-200 text-xs block hover:text-blue-600">
                        {st.first_name} {st.last_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{st.dossier_number}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                      Cat. {st.requested_category}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500">
                    <span>Prêt pour session</span>
                    <span className="text-blue-600 font-bold">Théorie</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Créneau */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-card-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">2</span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-200">Étape 2: Créneau (Kreno)</h3>
                  <span className="text-[10px] text-slate-400">Épreuve sur Piste</span>
                </div>
              </div>
              <span className="text-[11px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full font-mono">
                {creneauCandidates.length}
              </span>
            </div>

            <div className="space-y-3">
              {creneauCandidates.map(st => (
                <div 
                  key={st.id} 
                  onClick={() => {
                    setSelectedStudent(st);
                    setIsSummaryOpen(true);
                  }}
                  className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-card-border shadow-2xs space-y-3 hover:border-blue-700 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-200 text-xs block hover:text-blue-600">
                        {st.first_name} {st.last_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{st.dossier_number}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                      Cat. {st.requested_category}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500">
                    <span>Code validé</span>
                    <span className="text-purple-600 font-bold">Manoeuvres</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Circulation */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-card-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">3</span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-200">Étape 3: Conduite (Circulation)</h3>
                  <span className="text-[10px] text-slate-400">Circuit Routier Final</span>
                </div>
              </div>
              <span className="text-[11px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full font-mono">
                {circulationCandidates.length}
              </span>
            </div>

            <div className="space-y-3">
              {circulationCandidates.map(st => (
                <div 
                  key={st.id} 
                  onClick={() => {
                    setSelectedStudent(st);
                    setIsSummaryOpen(true);
                  }}
                  className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-card-border shadow-2xs space-y-3 hover:border-blue-700 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-200 text-xs block hover:text-blue-600">
                        {st.first_name} {st.last_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{st.dossier_number}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                      Cat. {st.requested_category}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500">
                    <span>Créneau validé</span>
                    <span className="text-blue-600 font-bold">Circulation</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Modals */}
      <NewExamSessionModal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
      />

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

      <CandidateSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        student={selectedStudent}
      />

      {/* Confirmation Modal to Prevent Accidental Deletions */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        warningNote={confirmModal.warningNote}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
