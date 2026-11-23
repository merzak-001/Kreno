'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronRight, 
  Filter, 
  CalendarDays,
  Columns3,
  List,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Sparkles
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { ScheduleSlot, LicenseCategory, getCategoryBadgeClass } from '@/types/kreno';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function SchedulePage() {
  const { students, settings, updateScheduleSlot, deleteScheduleSlot } = useKreno();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterType, setFilterType] = useState<'all' | 'code' | 'creneau' | 'circulation'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; slot: ScheduleSlot | null }>({
    isOpen: false,
    slot: null,
  });

  // Extract all slots with their studentId attached
  const allSlotsWithStudent = useMemo(() => {
    return students.flatMap(s => 
      (s.schedule_slots || []).map(slot => ({
        ...slot,
        studentId: s.id,
      }))
    );
  }, [students]);

  // Unique dates in schedule
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(allSlotsWithStudent.map(s => s.date))).sort();
    return dates;
  }, [allSlotsWithStudent]);

  // Filtered slots
  const filteredSlots = useMemo(() => {
    return allSlotsWithStudent.filter(slot => {
      const matchesType = filterType === 'all' || slot.type === filterType;
      const matchesDate = selectedDate === 'all' || slot.date === selectedDate;
      return matchesType && matchesDate;
    }).sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.time_start.localeCompare(b.time_start);
    });
  }, [allSlotsWithStudent, filterType, selectedDate]);

  // Kanban Columns
  const scheduledSlots = useMemo(() => 
    filteredSlots.filter(s => s.status === 'scheduled' || !s.status), 
    [filteredSlots]
  );

  const completedSlots = useMemo(() => 
    filteredSlots.filter(s => s.status === 'completed'), 
    [filteredSlots]
  );

  const cancelledSlots = useMemo(() => 
    filteredSlots.filter(s => s.status === 'cancelled'), 
    [filteredSlots]
  );

  const handleStatusChange = (slot: ScheduleSlot & { studentId: string }, newStatus: ScheduleSlot['status']) => {
    updateScheduleSlot(slot.studentId, slot.id, { status: newStatus });
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Unité Légale 1 Heure
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">• Quota 30h Algérie</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Planning des Séances d&apos;Apprentissage
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des cours de Code (10h), Manœuvres Créneau (10h) et Circulation (10h).
          </p>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                viewMode === 'kanban' 
                  ? 'bg-surface text-blue-600 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Tableau Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                viewMode === 'table' 
                  ? 'bg-surface text-blue-600 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Vue Liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">Discipline :</span>
          {[
            { id: 'all', label: 'Toutes les séances' },
            { id: 'code', label: '1. Code théorique' },
            { id: 'creneau', label: '2. Créneau sur piste' },
            { id: 'circulation', label: '3. Circulation routière' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium border ${
                filterType === f.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg font-medium text-slate-700 dark:text-slate-200 text-xs"
          >
            <option value="all">Toutes les dates ({uniqueDates.length} jours)</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Scheduled */}
          <div className="bg-slate-50/70 dark:bg-surface-elevated/40 p-4 rounded-2xl border border-border-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Séances Planifiées ({scheduledSlots.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {scheduledSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="bg-surface p-3.5 rounded-xl border border-border-subtle shadow-xs space-y-2 hover:border-blue-400/40 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadgeClass(slot.category)}`}>
                        Cat. {slot.category}
                      </span>
                      <Link 
                        href={`/candidates/${slot.studentId}`}
                        className="font-semibold text-xs text-slate-900 dark:text-white block mt-1 hover:text-blue-600 transition"
                      >
                        {slot.student_name}
                      </Link>
                    </div>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-medium text-xs">
                      {slot.time_start} - {slot.time_end}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                    {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-border-subtle pt-2">
                    <span className="font-mono">{slot.date}</span>
                    <button
                      onClick={() => handleStatusChange(slot, 'completed')}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded font-medium border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                    >
                      Valider 1h
                    </button>
                  </div>
                </div>
              ))}
              {scheduledSlots.length === 0 && (
                <p className="text-xs text-slate-400 py-8 text-center italic">Aucune séance planifiée.</p>
              )}
            </div>
          </div>

          {/* Column 2: Completed */}
          <div className="bg-slate-50/70 dark:bg-surface-elevated/40 p-4 rounded-2xl border border-border-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Séances Effectuées ({completedSlots.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {completedSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="bg-surface p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadgeClass(slot.category)}`}>
                        Cat. {slot.category}
                      </span>
                      <Link 
                        href={`/candidates/${slot.studentId}`}
                        className="font-semibold text-xs text-slate-900 dark:text-white block mt-1 hover:text-emerald-600 transition"
                      >
                        {slot.student_name}
                      </Link>
                    </div>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                      Effectuée (1h)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                    {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-border-subtle pt-2">
                    <span className="font-mono">{slot.date} • {slot.time_start}</span>
                    <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Validée
                    </span>
                  </div>
                </div>
              ))}
              {completedSlots.length === 0 && (
                <p className="text-xs text-slate-400 py-8 text-center italic">Aucune séance effectuée.</p>
              )}
            </div>
          </div>

          {/* Column 3: Cancelled */}
          <div className="bg-slate-50/70 dark:bg-surface-elevated/40 p-4 rounded-2xl border border-border-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Séances Annulées ({cancelledSlots.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {cancelledSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="bg-surface p-3.5 rounded-xl border border-border-subtle shadow-xs space-y-2 opacity-70"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadgeClass(slot.category)}`}>
                        Cat. {slot.category}
                      </span>
                      <strong className="font-semibold text-xs text-slate-900 dark:text-white block mt-1">
                        {slot.student_name}
                      </strong>
                    </div>
                    <span className="font-mono text-slate-400 text-xs">
                      Annulée
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 capitalize">
                    {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-border-subtle pt-2">
                    <span className="font-mono">{slot.date} • {slot.time_start}</span>
                    <button
                      onClick={() => handleStatusChange(slot, 'scheduled')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition cursor-pointer"
                    >
                      Reprogrammer
                    </button>
                  </div>
                </div>
              ))}
              {cancelledSlots.length === 0 && (
                <p className="text-xs text-slate-400 py-8 text-center italic">Aucune séance annulée.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 dark:text-slate-400 border-b border-border-subtle text-[10px] uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Candidat</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4">Moniteur</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSlots.map(slot => (
                <tr key={slot.id} className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50 transition">
                  <td className="py-3 px-4 font-mono">
                    <span className="font-medium text-slate-900 dark:text-white block">{slot.date}</span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400">{slot.time_start} - {slot.time_end}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/candidates/${slot.studentId}`} className="font-medium text-slate-900 dark:text-white hover:text-blue-600 transition">
                      {slot.student_name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">
                    {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {slot.instructor_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      slot.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : slot.status === 'cancelled'
                        ? 'bg-slate-100 dark:bg-surface-elevated text-slate-500 border-border-subtle'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}>
                      {slot.status === 'completed' ? 'Effectuée' : slot.status === 'cancelled' ? 'Annulée' : 'Planifiée'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {slot.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(slot, 'completed')}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium border border-emerald-200 transition cursor-pointer"
                        >
                          Valider
                        </button>
                      )}
                      <button
                        onClick={() => deleteScheduleSlot(slot.studentId, slot.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
