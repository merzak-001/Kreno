'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Calendar, Plus, CheckCircle2, User, Award, DollarSign, Filter, Search, MapPin, UserCheck, Check, ChevronDown } from 'lucide-react';
import { Student, ExamType, ExamSessionCandidateSelection, LicenseCategory } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface NewExamSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewExamSessionModal({ isOpen, onClose }: NewExamSessionModalProps) {
  const { students, createExamDaySession, settings, engineers, addEngineer, examCenters, addExamCenter } = useKreno();

  const [date, setDate] = useState('2026-12-05');
  const [center, setCenter] = useState('');
  const [examiner, setExaminer] = useState(''); // mandatory and initially empty
  const [activeFilter, setActiveFilter] = useState<'all' | 'code' | 'creneau' | 'circulation'>('all');
  const [search, setSearch] = useState('');

  // Search/Filter states for Engineer Combobox
  const [engineerSearch, setEngineerSearch] = useState('');
  const [isEngineerOpen, setIsEngineerOpen] = useState(false);
  const engineerRef = useRef<HTMLDivElement>(null);

  // Search/Filter states for Center Combobox
  const [centerSearch, setCenterSearch] = useState('');
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);

  // Quick add engineer inline modal state
  const [isAddingEngineer, setIsAddingEngineer] = useState(false);
  const [newEngineerName, setNewEngineerName] = useState('');
  const [newEngineerTitle, setNewEngineerTitle] = useState('Ingénieur d\'État');

  // Quick add center inline modal state
  const [isAddingCenter, setIsAddingCenter] = useState(false);
  const [newCenterName, setNewCenterName] = useState('');

  // Remember last selected center in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastCenter = localStorage.getItem('kreno_last_center');
      if (lastCenter) {
        setCenter(lastCenter);
        setCenterSearch(lastCenter);
      } else if (examCenters.length > 0) {
        setCenter(examCenters[0].name);
        setCenterSearch(examCenters[0].name);
      } else {
        setCenter('Centre d\'Examen Aïn Oulmene');
        setCenterSearch('Centre d\'Examen Aïn Oulmene');
      }
    }
  }, [examCenters]);

  // Click outside listener for comboboxes
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (engineerRef.current && !engineerRef.current.contains(event.target as Node)) {
        setIsEngineerOpen(false);
      }
      if (centerRef.current && !centerRef.current.contains(event.target as Node)) {
        setIsCenterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      return { readyFor: 'circulation', reason: 'Créneau validé -> Prêt pour Conduite' };
    }
    if (passedCode) {
      return { readyFor: 'creneau', reason: 'Code validé -> Prêt pour Créneau' };
    }
    return { readyFor: 'code', reason: 'En attente épreuve Code' };
  };

  // Helper for category fee
  const getFeeForCategory = (cat: LicenseCategory): number => {
    return settings.category_exam_fees?.[cat] ?? settings.standard_exam_fee ?? 2000;
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

  // Filter engineers for search
  const filteredEngineers = useMemo(() => {
    const q = engineerSearch.toLowerCase().trim();
    if (!q) return engineers;
    return engineers.filter(e => e.name.toLowerCase().includes(q) || (e.title && e.title.toLowerCase().includes(q)));
  }, [engineers, engineerSearch]);

  // Filter centers for search
  const filteredCenters = useMemo(() => {
    const q = centerSearch.toLowerCase().trim();
    if (!q) return examCenters;
    return examCenters.filter(c => c.name.toLowerCase().includes(q) || (c.commune && c.commune.toLowerCase().includes(q)));
  }, [examCenters, centerSearch]);

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const toggleSelect = (student: Student) => {
    const isSelected = !!selectedMap[student.id];
    if (isSelected) {
      const copy = { ...selectedMap };
      delete copy[student.id];
      setSelectedMap(copy);
    } else {
      const { readyFor } = getCandidateEligibility(student);
      const catFee = getFeeForCategory(student.requested_category);
      setSelectedMap(prev => ({
        ...prev,
        [student.id]: {
          exam_type: readyFor,
          fee_paid: false, // Default is NOT paid: candidate will pay on the day of the exam
          fee_amount: catFee,
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

  const handleQuickAddEngineer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEngineerName.trim()) return;
    const added = addEngineer(newEngineerName, newEngineerTitle);
    setExaminer(added.name);
    setEngineerSearch(added.name);
    setNewEngineerName('');
    setIsAddingEngineer(false);
    setIsEngineerOpen(false);
  };

  const handleQuickAddCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterName.trim()) return;
    const added = addExamCenter(newCenterName);
    setCenter(added.name);
    setCenterSearch(added.name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kreno_last_center', added.name);
    }
    setNewCenterName('');
    setIsAddingCenter(false);
    setIsCenterOpen(false);
  };

  const selectedCount = Object.keys(selectedMap).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examiner.trim()) {
      alert('Veuillez obligatoirement sélectionner ou ajouter l\'Ingénieur de l\'examen.');
      return;
    }
    if (!center.trim()) {
      alert('Veuillez sélectionner le Centre / Piste d\'examen.');
      return;
    }
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

    if (typeof window !== 'undefined') {
      localStorage.setItem('kreno_last_center', center);
    }

    createExamDaySession(date, center, examiner, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Maximum modal width (7xl) with plenty of breathing room */}
      <div className="bg-surface rounded-2xl w-full max-w-7xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100 max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
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
                Recherchez l&apos;Ingénieur et le Centre dans les listes déroulantes, puis cliquez sur une ligne pour inscrire un candidat.
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
            
            {/* Top Parameters Grid: Date, Centre (Searchable), Ingénieur (Searchable & Empty by default) */}
            <div className="p-4 bg-slate-100/90 dark:bg-slate-850 rounded-xl border border-slate-300 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              
              {/* 1. Date */}
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                  Date de la Session <span className="text-rose-500">*</span> :
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* 2. Centre d'examen (Searchable Combobox + Quick Add) */}
              <div className="relative" ref={centerRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold">
                    Centre / Piste d&apos;Examen <span className="text-rose-500">*</span> :
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCenter(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nouveau
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    value={centerSearch}
                    onChange={(e) => {
                      setCenterSearch(e.target.value);
                      setCenter(e.target.value);
                      setIsCenterOpen(true);
                    }}
                    onFocus={() => setIsCenterOpen(true)}
                    placeholder="Tapez pour chercher le centre..."
                    className="w-full px-3 py-2 pr-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {isCenterOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl py-1 text-xs">
                    {filteredCenters.length > 0 ? (
                      filteredCenters.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setCenter(c.name);
                            setCenterSearch(c.name);
                            setIsCenterOpen(false);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('kreno_last_center', c.name);
                            }
                          }}
                          className={`px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between ${
                            center === c.name ? 'bg-blue-100/60 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span>{c.name}</span>
                          {c.commune && <span className="text-[10px] text-slate-400">{c.commune}</span>}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-slate-400 italic">Aucun centre trouvé</div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Ingénieur (Searchable Combobox + Quick Add + Empty by default) */}
              <div className="relative" ref={engineerRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold">
                    Ingénieur d&apos;État <span className="text-rose-500 font-black">* (Obligatoire)</span> :
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingEngineer(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nouveau
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={engineerSearch}
                    onChange={(e) => {
                      setEngineerSearch(e.target.value);
                      setExaminer(e.target.value);
                      setIsEngineerOpen(true);
                    }}
                    onFocus={() => setIsEngineerOpen(true)}
                    placeholder="Tapez le nom de l'Ingénieur..."
                    className={`w-full px-3 py-2 pr-8 bg-white dark:bg-slate-900 border rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      !examiner ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    required
                  />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {isEngineerOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl py-1 text-xs">
                    {filteredEngineers.length > 0 ? (
                      filteredEngineers.map(eng => (
                        <div
                          key={eng.id}
                          onClick={() => {
                            setExaminer(eng.name);
                            setEngineerSearch(eng.name);
                            setIsEngineerOpen(false);
                          }}
                          className={`px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between ${
                            examiner === eng.name ? 'bg-blue-100/60 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="font-bold">{eng.name}</span>
                          <span className="text-[10px] text-slate-400">{eng.title || 'Ingénieur'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-slate-400 italic">Aucun ingénieur trouvé</div>
                    )}
                  </div>
                )}

                {!examiner && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1 font-semibold">
                    Champ obligatoire : choisissez ou ajoutez l&apos;Ingénieur d&apos;État.
                  </span>
                )}
              </div>
            </div>

            {/* Quick Add Engineer Modal Popup */}
            {isAddingEngineer && (
              <div className="p-4 bg-blue-50 dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-600 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Ajout Rapide d&apos;un Ingénieur de la Circulation et de la Sécurité Routière
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingEngineer(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nom et Titre de l&apos;Ingénieur * :
                    </label>
                    <input
                      type="text"
                      value={newEngineerName}
                      onChange={(e) => setNewEngineerName(e.target.value)}
                      placeholder="ex: Ing. M. Makhloufi"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Grade / Fonction :
                    </label>
                    <input
                      type="text"
                      value={newEngineerTitle}
                      onChange={(e) => setNewEngineerTitle(e.target.value)}
                      placeholder="ex: Ingénieur d'État en Chef"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingEngineer(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAddEngineer}
                    disabled={!newEngineerName.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    Enregistrer et Sélectionner
                  </button>
                </div>
              </div>
            )}

            {/* Quick Add Center Modal Popup */}
            {isAddingCenter && (
              <div className="p-4 bg-emerald-50 dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Ajout Rapide d&apos;un Centre ou Piste d&apos;Examen
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingCenter(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nom du Centre / Piste * :
                  </label>
                  <input
                    type="text"
                    value={newCenterName}
                    onChange={(e) => setNewCenterName(e.target.value)}
                    placeholder="ex: Centre d'Examen Aïn Oulmene (Piste Municipale)"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCenter(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAddCenter}
                    disabled={!newCenterName.trim()}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    Enregistrer et Sélectionner
                  </button>
                </div>
              </div>
            )}

            {/* Candidate Picker Header & Search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Candidats Prêts à Convoquer ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    💡 <strong>Cliquez n&apos;importe où sur la ligne</strong> pour sélectionner ou désélectionner un candidat.
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

              {/* Candidates Table - Wide, Clean & Discreet (without intrusive fee input boxes) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 w-12 text-center">Choix</th>
                        <th className="p-3 min-w-[220px]">Candidat & Dossier</th>
                        <th className="p-3 w-24">Permis</th>
                        <th className="p-3 min-w-[220px]">Épreuve à Présenter</th>
                        <th className="p-3 text-right min-w-[140px]">Solde Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {eligibleCandidates.map(st => {
                        const isSelected = !!selectedMap[st.id];
                        const { readyFor, reason } = getCandidateEligibility(st);
                        const currentSelection = selectedMap[st.id];
                        
                        // Remaining dues owed by the candidate
                        const remainingOwed = Math.max(0, (st.total_package_price || 0) - (st.amount_paid || 0));

                        return (
                          <tr 
                            key={st.id}
                            onClick={() => toggleSelect(st)}
                            className={`cursor-pointer transition select-none ${
                              isSelected 
                                ? 'bg-blue-100/70 dark:bg-blue-950/70 font-semibold border-l-4 border-l-blue-600' 
                                : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(st)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white text-sm block whitespace-nowrap">
                                {st.first_name} {st.last_name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                                {st.dossier_number} • Tél: {st.phone_number}
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
                                  className="w-full max-w-[220px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-600 dark:border-blue-500 rounded-lg font-bold text-xs text-blue-900 dark:text-blue-200 focus:outline-none"
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
                            <td className="p-3 text-right font-mono whitespace-nowrap">
                              {remainingOwed === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">0 DZD (Soldé)</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  {remainingOwed.toLocaleString()} DZD dû
                                </span>
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
              {examiner && (
                <span className="ml-3 text-slate-500 font-medium hidden sm:inline">
                  • Ingénieur : <strong className="text-slate-800 dark:text-slate-200">{examiner}</strong>
                </span>
              )}
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
                disabled={selectedCount === 0 || !examiner.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  selectedCount > 0 && examiner.trim()
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
