'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronRight, 
  Filter, 
  AlertTriangle,
  CalendarDays
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';

export default function SchedulePage() {
  const { students, settings } = useKreno();
  const [filterType, setFilterType] = useState<'all' | 'code' | 'creneau' | 'circulation'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  // Extract all 1-hour slots
  const allSlots = useMemo(() => {
    return students.flatMap(s => s.schedule_slots || []);
  }, [students]);

  // Unique dates in schedule
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(allSlots.map(s => s.date))).sort();
    return dates;
  }, [allSlots]);

  // Filtered slots
  const filteredSlots = useMemo(() => {
    return allSlots.filter(slot => {
      const matchesType = filterType === 'all' || slot.type === filterType;
      const matchesDate = selectedDate === 'all' || slot.date === selectedDate;
      return matchesType && matchesDate;
    }).sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.time_start.localeCompare(b.time_start);
    });
  }, [allSlots, filterType, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Planning Général des Séances (Unités de 01 Heure)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jours d&apos;ouverture configurés: <strong className="text-slate-800 dark:text-slate-200">Du Samedi au Jeudi</strong> ({settings.start_hour} à {settings.end_hour}) • Unité fixe d&apos;une heure.
          </p>
        </div>

        <Link
          href="/settings"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Ajuster les Jours & Horaires d&apos;Ouverture</span>
        </Link>
      </div>

      {/* Unavailable Period Alert */}
      {settings.unavailable_periods.length > 0 && (
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Périodes d&apos;Indisponibilité / Fermetures Exceptionnelles:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
              {settings.unavailable_periods.map(p => (
                <li key={p.id}>
                  Le <strong>{p.date}</strong> ({p.period === 'full_day' ? 'Journée entière' : p.period === 'morning' ? 'Matinée' : 'Après-midi'}) — {p.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-4 text-xs transition-colors">
        {/* Discipline Filter */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 dark:text-slate-400 mr-2">Discipline:</span>
          {(['all', 'code', 'creneau', 'circulation'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer capitalize ${
                filterType === type 
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'all' ? 'Toutes les séances' : type}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Filtrer par date:</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
          >
            <option value="all">Toutes les dates</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Slots Grid & Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Créneau Horaire (Unité 1h)</th>
              <th className="p-4">Candidat</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Type de Séance</th>
              <th className="p-4">Moniteur Assigné</th>
              <th className="p-4">Objectifs / Notes</th>
              <th className="p-4 text-right">Fiche Candidat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSlots.length > 0 ? (
              filteredSlots.map(slot => (
                <tr key={slot.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{slot.date}</td>
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {slot.time_start} - {slot.time_end} (1h)
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{slot.student_name}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Cat. {slot.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      slot.type === 'code' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      slot.type === 'creneau' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {slot.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{slot.instructor_name}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{slot.notes || 'Séance normale de 1h'}</td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/candidates/${slot.student_id}`}
                      className="text-emerald-600 hover:text-emerald-500 font-bold inline-flex items-center gap-1"
                    >
                      Profil <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  Aucune séance programmée pour ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
