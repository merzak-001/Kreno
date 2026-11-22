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
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-surface rounded-2xl w-full max-w-6xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Programmer une Journée d&apos;Examen Hebdomadaire
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sélectionnez la date, le centre, et cochez les candidats à convoquer pour le Code, Créneau ou Conduite.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Session Info Bar - Responsive Grid */}
            <div className="p-4 bg-slate-100/90 dark:bg-slate-850 rounded-xl border border-slate-300 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                  Date de l&apos;examen (Session) :
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                  Centre / Piste d&apos;Examen :
                </label>
                <input
                  type="text"
                  value={center}
                  onChange={(e) => setCenter(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="ex: Centre d'Examen Aïn Oulmene"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                  Inspecteur / Commission :
                </label>
                <input
                  type="text"
                  value={examiner}
                  onChange={(e) => setExaminer(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="ex: M. Makhloufi (Inspecteur Principal)"
                  required
                />
              </div>
            </div>

            {/* Candidate Picker Header & Search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Candidats Prêts à Convoquer ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cochez les candidats. Les 3 épreuves (Code, Créneau, Conduite) se déroulent le même jour.
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
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                        activeFilter === tab.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidates Table - Wide & Non-wrapping */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[750px] border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 w-12 text-center">Choix</th>
                        <th className="p-3 min-w-[200px]">Candidat & Dossier</th>
                        <th className="p-3 w-20">Permis</th>
                        <th className="p-3 min-w-[200px]">Épreuve à Présenter</th>
                        <th className="p-3 text-center min-w-[160px]">Frais d&apos;Examen (2 000 DZD)</th>
                        <th className="p-3 text-right w-32">Solde Forfait</th>
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
                                ? 'bg-blue-50/80 dark:bg-blue-950/60 font-medium' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(st)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white text-sm block whitespace-nowrap">
                                {st.first_name} {st.last_name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                                {st.dossier_number} • {st.phone_number}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                Cat. {st.requested_category}
                              </span>
                            </td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              {isSelected ? (
                                <select
                                  value={currentSelection?.exam_type || readyFor}
                                  onChange={(e) => updateSelectedExamType(st.id, e.target.value as ExamType)}
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-600 dark:border-blue-500 rounded-lg font-bold text-xs text-blue-900 dark:text-blue-200 focus:outline-none"
                                >
                                  <option value="code">1. Code Théorique</option>
                                  <option value="creneau">2. Créneau (Piste)</option>
                                  <option value="circulation">3. Conduite (Circulation)</option>
                                </select>
                              ) : (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {reason}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {isSelected ? (
                                <label className="inline-flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={currentSelection?.fee_paid || false}
                                    onChange={(e) => updateSelectedFeePaid(st.id, e.target.checked)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded"
                                  />
                                  <span className={`text-[11px] font-bold whitespace-nowrap ${
                                    currentSelection?.fee_paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                  }`}>
                                    {currentSelection?.fee_paid ? 'Réglé (2 000 DZD)' : 'Non réglé'}
                                  </span>
                                </label>
                              ) : (
                                <span className="text-slate-400 text-[11px] whitespace-nowrap">2 000 DZD</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono whitespace-nowrap">
                              {remaining === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">Soldé</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">Reste {remaining.toLocaleString()} DZD</span>
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

          </div>

          {/* Footer Submit */}
          <div className="px-6 py-4 border-t border-border-subtle bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
            <div className="text-xs">
              <span className="text-slate-600 dark:text-slate-400">Candidats sélectionnés pour le {date} :</span>{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm">{selectedCount}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={selectedCount === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  selectedCount > 0
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
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
