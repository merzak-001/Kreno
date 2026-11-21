'use client';

import React, { useState, useMemo } from 'react';
import { X, Calendar, Plus, CheckCircle2, User, Award, DollarSign, Filter, Search } from 'lucide-react';
import { Student, ExamType, ExamSessionCandidateSelection } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';

interface NewExamSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewExamSessionModal({ isOpen, onClose }: NewExamSessionModalProps) {
  const { students, createExamDaySession, settings } = useKreno();

  const [date, setDate] = useState('2026-12-05');
  const [center, setCenter] = useState('Centre d\'Examen Aïn Oulmene');
  const [examiner, setExaminer] = useState('M. Makhloufi (Inspecteur Principal)');
  const [activeFilter, setActiveFilter] = useState<'all' | 'code' | 'creneau' | 'circulation'>('all');
  const [search, setSearch] = useState('');

  // Selected candidates map: student_id -> { exam_type, fee_paid, fee_amount }
  const [selectedMap, setSelectedMap] = useState<Record<string, { exam_type: ExamType; fee_paid: boolean; fee_amount: number }>>({});

  // Helper to determine candidate readiness
  const getCandidateEligibility = (st: Student): { readyFor: ExamType; reason: string } => {
    const passedCode = st.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
    const passedCreneau = st.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
    const passedCirc = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');

    if (passedCirc) {
      return { readyFor: 'circulation', reason: 'Permis déjà décroché' };
    }
    if (passedCreneau) {
      return { readyFor: 'circulation', reason: 'Créneau validé -> Prêt pour Conduite (Circulation)' };
    }
    if (passedCode) {
      return { readyFor: 'creneau', reason: 'Code validé -> Prêt pour Créneau (Manoeuvres)' };
    }
    return { readyFor: 'code', reason: 'En attente de l\'épreuve théorique du Code' };
  };

  // Filter candidates list
  const eligibleCandidates = useMemo(() => {
    return students.filter(st => {
      const { readyFor, reason } = getCandidateEligibility(st);
      if (reason === 'Permis déjà décroché') return false;

      const matchesFilter = activeFilter === 'all' || readyFor === activeFilter;
      const q = search.toLowerCase();
      const matchesSearch = 
        st.first_name.toLowerCase().includes(q) ||
        st.last_name.toLowerCase().includes(q) ||
        st.dossier_number.toLowerCase().includes(q) ||
        st.nin.includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [students, activeFilter, search]);

  if (!isOpen) return null;

  const toggleSelect = (student: Student) => {
    const isSelected = !!selectedMap[student.id];
    if (isSelected) {
      const copy = { ...selectedMap };
      delete copy[student.id];
      setSelectedMap(copy);
    } else {
      const { readyFor } = getCandidateEligibility(student);
      setSelectedMap(prev => ({
        ...prev,
        [student.id]: {
          exam_type: readyFor,
          fee_paid: true,
          fee_amount: settings.standard_exam_fee || 2000,
        }
      }));
    }
  };

  const updateSelectedExamType = (studentId: string, examType: ExamType) => {
    if (!selectedMap[studentId]) return;
    setSelectedMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        exam_type: examType,
      }
    }));
  };

  const updateSelectedFeePaid = (studentId: string, feePaid: boolean) => {
    if (!selectedMap[studentId]) return;
    setSelectedMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        fee_paid: feePaid,
      }
    }));
  };

  const selectedCount = Object.keys(selectedMap).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCount === 0) {
      alert('Veuillez sélectionner au moins un candidat à présenter à cette session d\'examen.');
      return;
    }

    const payload: ExamSessionCandidateSelection[] = Object.entries(selectedMap).map(([student_id, data]) => ({
      student_id,
      exam_type: data.exam_type,
      fee_amount: data.fee_amount,
      fee_paid: data.fee_paid,
    }));

    createExamDaySession(date, center, examiner, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Programmer une Nouvelle Journée d&apos;Examen Hebdomadaire
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sélectionnez la date de la session, le centre, et cochez les candidats prêts pour le Code, le Créneau ou la Conduite.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Session Info Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Date de l&apos;examen (Session):
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Centre / Piste d&apos;Examen:
                </label>
                <input
                  type="text"
                  value={center}
                  onChange={(e) => setCenter(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="ex: Centre Aïn Oulmene"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Inspecteur / Commission Daïra:
                </label>
                <input
                  type="text"
                  value={examiner}
                  onChange={(e) => setExaminer(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="ex: M. Makhloufi (Inspecteur)"
                  required
                />
              </div>
            </div>

            {/* Candidate Picker Header & Search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Candidats Prêts à Convoquer ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cochez les candidats que vous emmenez à cette date d&apos;examen. Vous pouvez combiner Code, Créneau et Conduite.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 text-xs">
                  {[
                    { id: 'all', label: 'Tous les éligibles' },
                    { id: 'code', label: '1. Code' },
                    { id: 'creneau', label: '2. Créneau' },
                    { id: 'circulation', label: '3. Conduite' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                        activeFilter === tab.id
                          ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidates Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <tr>
                      <th className="p-3 w-10 text-center">Choix</th>
                      <th className="p-3">Candidat</th>
                      <th className="p-3">Permis</th>
                      <th className="p-3">Épreuve à Présenter</th>
                      <th className="p-3 text-center">Frais d&apos;Examen (2 000 DZD)</th>
                      <th className="p-3 text-right">Solde Forfait</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {eligibleCandidates.map(st => {
                      const isSelected = !!selectedMap[st.id];
                      const { readyFor, reason } = getCandidateEligibility(st);
                      const currentSelection = selectedMap[st.id];
                      const remaining = Math.max(0, (st.total_package_price || 0) - (st.amount_paid || 0));

                      return (
                        <tr 
                          key={st.id}
                          onClick={() => toggleSelect(st)}
                          className={`cursor-pointer transition ${
                            isSelected 
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-medium' 
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(st)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {st.first_name} {st.last_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {st.dossier_number} • {st.phone_number}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold border border-slate-200 dark:border-slate-700">
                              Cat. {st.requested_category}
                            </span>
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <select
                                value={currentSelection?.exam_type || readyFor}
                                onChange={(e) => updateSelectedExamType(st.id, e.target.value as ExamType)}
                                className="px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700 rounded-lg font-bold text-xs text-emerald-800 dark:text-emerald-300"
                              >
                                <option value="code">1. Code Théorique</option>
                                <option value="creneau">2. Créneau (Piste)</option>
                                <option value="circulation">3. Conduite (Circulation)</option>
                              </select>
                            ) : (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {reason}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentSelection?.fee_paid || false}
                                  onChange={(e) => updateSelectedFeePaid(st.id, e.target.checked)}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded"
                                />
                                <span className={`text-[11px] font-bold ${
                                  currentSelection?.fee_paid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                                }`}>
                                  {currentSelection?.fee_paid ? 'Réglé (2000 DZD)' : 'Non réglé'}
                                </span>
                              </label>
                            ) : (
                              <span className="text-slate-400 text-[11px]">2 000 DZD</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {remaining === 0 ? (
                              <span className="text-emerald-600 font-bold text-[11px]">Soldé</span>
                            ) : (
                              <span className="text-amber-600 font-bold text-[11px]">Reste {remaining.toLocaleString()} DZD</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Footer Submit */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0">
            <div className="text-xs">
              <span className="text-slate-500">Candidats sélectionnés pour le {date} :</span>{' '}
              <strong className="text-emerald-600 font-mono text-sm">{selectedCount}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={selectedCount === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                  selectedCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Valider la Session & Inscrire {selectedCount} Candidat{selectedCount > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
