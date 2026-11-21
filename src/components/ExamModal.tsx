'use client';

import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle, XCircle, AlertCircle, Calendar, MapPin, User, DollarSign } from 'lucide-react';
import { Student, ExamType, ExamResult } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  initialType?: ExamType;
  initialMode?: 'program' | 'result';
}

export function ExamModal({ 
  isOpen, 
  onClose, 
  student, 
  initialType = 'code',
  initialMode = 'program'
}: ExamModalProps) {
  const { programExam, recordExamResult, settings } = useKreno();

  const [mode, setMode] = useState<'program' | 'result'>(initialMode);
  const [examType, setExamType] = useState<ExamType>(initialType);
  const [examDate, setExamDate] = useState<string>('2026-11-28');
  const [examCenter, setExamCenter] = useState<string>('Centre Aïn Oulmene');
  const [examinerName, setExaminerName] = useState<string>('M. Makhloufi (Inspecteur)');
  const [feeAmount, setFeeAmount] = useState<number>(settings.standard_exam_fee || 2000);
  const [feePaid, setFeePaid] = useState<boolean>(true);
  const [result, setResult] = useState<ExamResult>('passed');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialType) setExamType(initialType);
    if (initialMode) setMode(initialMode);
  }, [initialType, initialMode, isOpen]);

  if (!isOpen || !student) return null;

  // Progression check
  const hasPassedCode = student.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
  const hasPassedCreneau = student.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'program') {
      programExam(
        student.id,
        examType,
        examDate,
        examCenter,
        feeAmount,
        feePaid,
        examinerName
      );
    } else {
      recordExamResult(
        student.id,
        examType,
        result,
        examDate,
        examinerName,
        notes
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {mode === 'program' ? 'Programmer une Épreuve d\'Examen' : 'Enregistrer le Résultat d\'Examen'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidat: <strong className="text-slate-800 dark:text-slate-200">{student.first_name} {student.last_name}</strong> ({student.dossier_number})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="p-6 pb-2 space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('program')}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                mode === 'program'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              1. Programmer l&apos;Examen & Frais
            </button>
            <button
              type="button"
              onClick={() => setMode('result')}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                mode === 'result'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              2. Saisir le Résultat Officiel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Exam Stage Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Épreuve d&apos;examen (Cycle séquentiel obligatoire):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExamType('code')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                    examType === 'code' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>1. Code</span>
                  <span className="text-[10px] font-normal text-slate-500">Théorique</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExamType('creneau')}
                  disabled={!hasPassedCode}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                    !hasPassedCode 
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400' 
                      : examType === 'creneau'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 cursor-pointer'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
                  }`}
                >
                  <span>2. Créneau</span>
                  <span className="text-[10px] font-normal text-slate-500">Manoeuvres</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExamType('circulation')}
                  disabled={!hasPassedCreneau}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                    !hasPassedCreneau 
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400' 
                      : examType === 'circulation'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 cursor-pointer'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
                  }`}
                >
                  <span>3. Conduite</span>
                  <span className="text-[10px] font-normal text-slate-500">Circulation</span>
                </button>
              </div>
            </div>

            {/* Date & Center */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date de l&apos;examen:
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Centre d&apos;examen / Piste:
                </label>
                <input
                  type="text"
                  value={examCenter}
                  onChange={(e) => setExamCenter(e.target.value)}
                  placeholder="ex: Centre Aïn Oulmene"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Examiner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nom de l&apos;Inspecteur / Examinateur d&apos;État:
              </label>
              <input
                type="text"
                value={examinerName}
                onChange={(e) => setExaminerName(e.target.value)}
                placeholder="ex: M. Makhloufi"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Mode-specific Fields */}
            {mode === 'program' ? (
              /* Program Fields: Fee and Fee Paid status */
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Frais d&apos;Examen Officiels:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-right"
                    />
                    <span className="text-xs font-bold text-slate-500">DZD</span>
                  </div>
                </div>

                <label className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feePaid}
                    onChange={(e) => setFeePaid(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Frais d&apos;examen réglés par le candidat (Encaissés au bureau)
                  </span>
                </label>
              </div>
            ) : (
              /* Result Fields: Result & Notes */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Verdict Officiel de la Commission:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setResult('passed')}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        result === 'passed'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Admis (Succès)
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult('failed')}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        result === 'failed'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Ajourné (Échec)
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult('absent_unexcused')}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        result === 'absent_unexcused'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Absent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Observations de l&apos;examinateur (facultatif):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ex: Faute de priorité au rond-point ou Manoeuvre réussie"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {mode === 'program' ? 'Valider la Programmation' : 'Enregistrer le Résultat'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
