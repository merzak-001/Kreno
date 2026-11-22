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
      <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Planning Général des Séances (Unités de 01 Heure)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jours d&apos;ouverture configurés: <strong className="text-slate-800 dark:text-slate-200">Du Samedi au Jeudi</strong> ({settings.start_hour} à {settings.end_hour}) • Unité fixe d&apos;une heure.
          </p>
        </div>

        <Link
          href="/settings"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Ajuster les Jours & Horaires d&apos;Ouverture</span>
        </Link>
      </div>

      {/* Unavailable Period Alert */}
      {settings.unavailable_periods.length > 0 && (
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
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
      <div className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 text-xs transition-colors">
        {/* Discipline Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-slate-400 mr-2">Discipline :</span>
          {(['all', 'code', 'creneau', 'circulation'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer capitalize ${
                filterType === type 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-surface-hover border border-border-subtle'
              }`}
            >
              {type === 'all' ? 'Toutes les séances' : type === 'code' ? 'Code de la Route' : type === 'creneau' ? 'Créneau' : 'Circulation'}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-slate-400">Filtrer par date :</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-border-subtle rounded-lg font-mono text-xs bg-white dark:bg-surface-elevated font-bold text-slate-900 dark:text-white"
          >
            <option value="all">Toutes les dates</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Slots Grid & Schedule Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-400 font-bold border-b border-border-subtle uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Horaire (01h)</th>
                <th className="p-4">Date</th>
                <th className="p-4">Candidat</th>
                <th className="p-4">Discipline</th>
                <th className="p-4">Moniteur</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSlots.map(slot => (
                <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-surface-elevated/70 transition">
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {slot.time_start} - {slot.time_end}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {slot.date}
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    {slot.student_name}
                  </td>
                  <td className="p-4 capitalize">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      slot.type === 'code' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                        : slot.type === 'creneau'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                    }`}>
                      {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                    {slot.instructor_name}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800/60">
                      Confirmé (1h)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
