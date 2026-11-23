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
  const [editingSlot, setEditingSlot] = useState<{ slot: ScheduleSlot; studentId: string } | null>(null);
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

  // Kanban Columns: Scheduled (Planifiée), Completed (Terminée/Validée), Cancelled (Annulée)
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

  const handleStatusChange = (studentId: string, slotId: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    updateScheduleSlot(studentId, slotId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top Header */}
      <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Gestion & Éditeur du Planning (Unités 1 Heure)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              {allSlotsWithStudent.length} Heures Programmées
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Jours d&apos;ouverture configurés : <strong className="text-slate-800 dark:text-slate-200">Du Samedi au Jeudi</strong> ({settings.start_hour} à {settings.end_hour}) • Système Kanban pour éditer et valider les séances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher: Kanban vs Table */}
          <div className="flex p-1 bg-slate-100 dark:bg-surface-elevated rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'kanban' 
                  ? 'bg-surface text-slate-900 dark:text-white shadow-xs font-black' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Tableau Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table' 
                  ? 'bg-surface text-slate-900 dark:text-white shadow-xs font-black' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste & Tableau</span>
            </button>
          </div>

          <Link
            href="/settings"
            className="px-4 py-2 bg-surface hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-border-subtle"
          >
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>Réglages Horaires</span>
          </Link>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 text-xs transition-colors">
        {/* Discipline Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">Discipline :</span>
          {(['all', 'code', 'creneau', 'circulation'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer capitalize ${
                filterType === type 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-surface-hover border border-border-subtle'
              }`}
            >
              {type === 'all' ? 'Toutes disciplines' : type === 'code' ? 'Code (Théorie)' : type === 'creneau' ? 'Créneau (Piste)' : 'Circulation (Route)'}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-slate-400">Filtrer par date :</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-border-subtle rounded-xl font-mono text-xs bg-white dark:bg-surface-elevated font-bold text-slate-900 dark:text-white"
          >
            <option value="all">Toutes les dates</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. VIEW 1: KANBAN SCHEDULE EDITOR (3 STATUS COLUMNS) */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: SÉANCES PROGRAMMÉES */}
          <div className="bg-slate-50 dark:bg-surface-elevated/40 p-5 rounded-3xl border border-border-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Séances Programmées</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold text-xs">
                {scheduledSlots.length}
              </span>
            </div>

            <div className="space-y-3">
              {scheduledSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link 
                        href={`/candidates/${slot.studentId}`}
                        className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-600 block transition"
                      >
                        {slot.student_name}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Date: <strong className="text-slate-700 dark:text-slate-300">{slot.date}</strong>
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      slot.type === 'code' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      slot.type === 'creneau' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {slot.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border-subtle">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900">
                      {slot.time_start} - {slot.time_end} (1h)
                    </span>
                    <span className="text-[11px] text-slate-500">{slot.instructor_name}</span>
                  </div>

                  {/* Kanban Quick Action Buttons to Move / Edit */}
                  <div className="pt-2 flex items-center justify-between border-t border-border-subtle text-xs gap-1.5">
                    <button
                      onClick={() => handleStatusChange(slot.studentId, slot.id, 'completed')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                      title="Valider l'heure comme effectuée"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Terminer</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(slot.studentId, slot.id, 'cancelled')}
                      className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-400 hover:text-slate-700 font-bold text-[11px] transition cursor-pointer"
                      title="Marquer comme annulée / reportée"
                    >
                      Annuler
                    </button>

                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, slot })}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Supprimer du planning"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {scheduledSlots.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  Aucune séance en attente pour ces filtres.
                </p>
              )}
            </div>
          </div>

          {/* COLUMN 2: SÉANCES EFFECTUÉES / VALIDÉES */}
          <div className="bg-slate-50 dark:bg-surface-elevated/40 p-5 rounded-3xl border border-border-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Séances Effectuées</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs">
                {completedSlots.length}
              </span>
            </div>

            <div className="space-y-3">
              {completedSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="bg-surface p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-3 bg-emerald-50/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link 
                        href={`/candidates/${slot.studentId}`}
                        className="font-black text-sm text-slate-900 dark:text-white hover:text-emerald-600 block transition"
                      >
                        {slot.student_name}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Date: <strong className="text-slate-700 dark:text-slate-300">{slot.date}</strong>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Effectuée (1h)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border-subtle">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {slot.time_start} - {slot.time_end}
                    </span>
                    <span className="text-[11px] text-slate-500">{slot.instructor_name}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border-subtle text-xs">
                    <button
                      onClick={() => handleStatusChange(slot.studentId, slot.id, 'scheduled')}
                      className="text-[11px] text-slate-400 hover:text-blue-600 font-bold transition"
                    >
                      ← Rebasculer en &quot;Programmée&quot;
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, slot })}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {completedSlots.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  Aucune séance validée pour l&apos;instant.
                </p>
              )}
            </div>
          </div>

          {/* COLUMN 3: SÉANCES ANNULÉES / À REPLANIFIER */}
          <div className="bg-slate-50 dark:bg-surface-elevated/40 p-5 rounded-3xl border border-border-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Annulées / À Replanifier</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs">
                {cancelledSlots.length}
              </span>
            </div>

            <div className="space-y-3">
              {cancelledSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-xs space-y-3 opacity-75"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-sm text-slate-800 dark:text-slate-200 block line-through">
                        {slot.student_name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Était prévue le {slot.date} ({slot.time_start})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Annulée
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border-subtle text-xs">
                    <button
                      onClick={() => handleStatusChange(slot.studentId, slot.id, 'scheduled')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition"
                    >
                      Replanifier cette séance
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, slot })}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cancelledSlots.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  Aucune séance annulée.
                </p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. VIEW 2: TRADITIONAL LIST & TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-surface rounded-3xl border border-border-subtle shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-400 font-bold border-b border-border-subtle uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Horaire (Unité 1h)</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Candidat</th>
                  <th className="p-4">Discipline</th>
                  <th className="p-4">Moniteur</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 text-right">Actions</th>
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
                      <Link href={`/candidates/${slot.studentId}`} className="hover:text-blue-600 transition">
                        {slot.student_name}
                      </Link>
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
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        slot.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : slot.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      }`}>
                        {slot.status === 'completed' ? 'Effectuée' : slot.status === 'cancelled' ? 'Annulée' : 'Programmée'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStatusChange(slot.studentId, slot.id, slot.status === 'completed' ? 'scheduled' : 'completed')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated dark:hover:bg-surface-hover rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          {slot.status === 'completed' ? 'Remettre en cours' : 'Marquer terminée'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, slot })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
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
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Supprimer la séance"
        message={`Êtes-vous certain de vouloir retirer la séance de ${deleteConfirm.slot?.student_name} du ${deleteConfirm.slot?.date} (${deleteConfirm.slot?.time_start}) ?`}
        warningNote="Cette opération libérera le créneau horaire."
        confirmText="Supprimer la séance"
        onConfirm={() => {
          if (deleteConfirm.slot) {
            const student = students.find(s => (s.schedule_slots || []).some(sl => sl.id === deleteConfirm.slot?.id));
            if (student) {
              deleteScheduleSlot(student.id, deleteConfirm.slot.id);
            }
          }
          setDeleteConfirm({ isOpen: false, slot: null });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, slot: null })}
      />

    </div>
  );
}
