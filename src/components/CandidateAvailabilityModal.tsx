'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Check, Sparkles, X } from 'lucide-react';
import { Student, DayOfWeek } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { DateInput } from '@/components/DateInput';

interface CandidateAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onConfirmed?: () => void;
}

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'saturday', label: 'Samedi' },
  { id: 'sunday', label: 'Dimanche' },
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
];

export function CandidateAvailabilityModal({
  isOpen,
  onClose,
  student,
  onConfirmed
}: CandidateAvailabilityModalProps) {
  const { settings, generateScheduleForStudent, updateStudent } = useKreno();

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    () => student?.availability?.days ?? ['saturday', 'monday', 'wednesday']
  );
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'any'>(
    () => student?.availability?.time ?? 'morning'
  );
  const [maxPerDay, setMaxPerDay] = useState<number>(
    () => student?.availability?.max_per_day ?? 2
  );
  const [startDate, setStartDate] = useState(() => student?.availability?.start_date ?? '');

  useEscapeKey(isOpen, onClose);

  if (!isOpen || !student) return null;

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) return;

    let effectiveStartDate = startDate;
    if (!effectiveStartDate) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      effectiveStartDate = `${yy}-${mm}-${dd}`;
    }

    // Generate or reflow remaining scheduled hours into the chosen availability days
    const slots = generateScheduleForStudent(student, selectedDays, preferredTime, effectiveStartDate, maxPerDay);
    updateStudent(student.id, {
      schedule_slots: slots,
      availability: {
        days: selectedDays,
        time: preferredTime,
        start_date: effectiveStartDate,
        max_per_day: maxPerDay,
      },
    });

    if (onConfirmed) onConfirmed();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl w-full max-w-lg shadow-2xl border border-border-subtle overflow-hidden text-slate-900 dark:text-white flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-start justify-between bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Disponibilités du Candidat (Programme 30h)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {student.first_name} {student.last_name} • Catégorie {student.requested_category}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-elevated transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-5 text-xs">
          
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs space-y-1">
            <span className="font-black block flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Répartition Automatique de 30 Heures :
            </span>
            <p className="text-[11px] text-blue-800 dark:text-blue-300">
              Le système va rechercher les <strong>créneaux libres dans l&apos;emploi du temps global</strong> (sans conflit avec d&apos;autres élèves) pour placer 10h de Code, 10h de Créneau et 10h de Conduite.
            </p>
          </div>

          {/* 1. Days Selection */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2">
              Jours de disponibilité hebdomadaire : *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DAYS.map(d => {
                const isSelected = selectedDays.includes(d.id);
                const isSchoolDay = settings.working_days.includes(d.id);

                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={!isSchoolDay}
                    onClick={() => toggleDay(d.id)}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex items-center justify-between ${
                      !isSchoolDay 
                        ? 'opacity-40 bg-slate-100 dark:bg-surface-elevated text-slate-400 cursor-not-allowed border-transparent'
                        : isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{d.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-[11px] text-rose-600 font-bold mt-1.5">
                Veuillez cocher au moins un jour de présence.
              </p>
            )}
          </div>

          {/* 2. Preferred Time of day */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Créneau horaire préféré :</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'morning', label: 'Matinée', desc: '08:00 - 12:00' },
                { id: 'afternoon', label: 'Après-midi', desc: '14:00 - 17:00' },
                { id: 'any', label: 'Toute heure', desc: 'Selon disponibilité' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPreferredTime(t.id as 'morning' | 'afternoon' | 'any')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    preferredTime === t.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/20'
                      : 'border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <strong className="block text-xs">{t.label}</strong>
                  <span className="text-[10px] text-slate-400 font-mono">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Max Hours Per Day & Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                Séances max par jour :
              </label>
              <select
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              >
                <option value={1}>1 heure / jour</option>
                <option value={2}>2 heures / jour (Recommandé)</option>
                <option value={3}>3 heures / jour</option>
                <option value={8}>Remplir la journée</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                Date de début :
              </label>
              <DateInput
                value={startDate}
                onChange={setStartDate}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold transition"
            >
              Plus tard
            </button>
            <button
              type="submit"
              disabled={selectedDays.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black text-xs transition shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Générer le Planning (30h Sans Conflit)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
