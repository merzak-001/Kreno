'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  List,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  History,
  UserX,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { DayOfWeek, ScheduleSlot, getCategoryBadgeClass } from '@/types/kreno';
import { DateInput } from '@/components/DateInput';

type SlotWithStudent = ScheduleSlot & { studentId: string };

const DAY_LABELS: Record<DayOfWeek, string> = {
  saturday: 'Samedi',
  sunday: 'Dimanche',
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
};

const JS_DAY_INDEX: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function toIsoDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatShortFR(iso: string): string {
  const parts = iso.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : iso;
}

function getStartOfAlgerianWeek(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const diffToSat = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - diffToSat);
  return d;
}

export default function SchedulePage() {
  const { students, settings, updateScheduleSlot, deleteScheduleSlot } = useKreno();

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const [viewMode, setViewMode] = useState<'agenda' | 'day' | 'history' | 'table'>('agenda');
  const [filterType, setFilterType] = useState<'all' | 'code' | 'creneau' | 'circulation'>('all');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'absent' | 'cancelled'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [agendaAnchorDate, setAgendaAnchorDate] = useState<string>(todayIso);
  const [dayViewDate, setDayViewDate] = useState<string>(todayIso);

  // Drag & Drop state
  const [draggedSlot, setDraggedSlot] = useState<SlotWithStudent | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  // Flatten all student schedule slots
  const allSlotsWithStudent: SlotWithStudent[] = useMemo(() => {
    return students.flatMap((s) =>
      (s.schedule_slots || []).map((slot) => ({
        ...slot,
        studentId: s.id,
      }))
    );
  }, [students]);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(allSlotsWithStudent.map((s) => s.date))).sort();
  }, [allSlotsWithStudent]);

  const filteredSlots = useMemo(() => {
    return allSlotsWithStudent
      .filter((slot) => {
        const matchesType = filterType === 'all' || slot.type === filterType;
        const matchesDate = viewMode !== 'table' || selectedDate === 'all' || slot.date === selectedDate;
        return matchesType && matchesDate;
      })
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return a.time_start.localeCompare(b.time_start);
      });
  }, [allSlotsWithStudent, filterType, selectedDate, viewMode]);

  // Working days for the week containing agendaAnchorDate
  const weekDays = useMemo(() => {
    const anchor = agendaAnchorDate ? new Date(agendaAnchorDate) : new Date();
    const startSat = getStartOfAlgerianWeek(Number.isNaN(anchor.getTime()) ? new Date() : anchor);

    const activeDays =
      settings.working_days.length > 0
        ? settings.working_days
        : (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as DayOfWeek[]);

    return activeDays.map((day) => {
      const offsetFromSat = (JS_DAY_INDEX[day] + 1) % 7;
      const d = new Date(startSat);
      d.setDate(startSat.getDate() + offsetFromSat);
      const iso = toIsoDate(d);
      return {
        day,
        label: DAY_LABELS[day],
        iso,
        shortDate: formatShortFR(iso),
        isToday: iso === todayIso,
      };
    });
  }, [settings.working_days, agendaAnchorDate, todayIso]);

  const shiftWeek = (deltaWeeks: number) => {
    const anchor = agendaAnchorDate ? new Date(agendaAnchorDate) : new Date();
    anchor.setDate(anchor.getDate() + deltaWeeks * 7);
    setAgendaAnchorDate(toIsoDate(anchor));
  };

  // Hourly rows
  const hourRows = useMemo(() => {
    const startH = parseInt((settings.start_hour || '08:00').split(':')[0], 10);
    const endH = parseInt((settings.end_hour || '17:00').split(':')[0], 10);
    const lunchStart = settings.lunch_break_start || '12:00';
    const lunchEnd = settings.lunch_break_end || '13:00';

    const rows: { time: string; endTime: string; isLunch: boolean }[] = [];
    for (let h = startH; h < endH; h++) {
      const time = `${String(h).padStart(2, '0')}:00`;
      const endTime = `${String(h + 1).padStart(2, '0')}:00`;
      const isLunch = time >= lunchStart && time < lunchEnd;
      rows.push({ time, endTime, isLunch });
    }
    return rows;
  }, [settings.start_hour, settings.end_hour, settings.lunch_break_start, settings.lunch_break_end]);

  // Index slots by `${date}_${time_start}`
  const slotsByCell = useMemo(() => {
    const map = new Map<string, SlotWithStudent[]>();
    filteredSlots.forEach((slot) => {
      const key = `${slot.date}_${slot.time_start}`;
      const list = map.get(key) || [];
      list.push(slot);
      map.set(key, list);
    });
    return map;
  }, [filteredSlots]);

  // Day view slots
  const dayViewSlots = useMemo(() => {
    return filteredSlots.filter((s) => s.date === dayViewDate);
  }, [filteredSlots, dayViewDate]);

  // History slots (completed, absent, cancelled), newest first
  const historySlots = useMemo(() => {
    return filteredSlots
      .filter((s) => {
        const isFinalized = s.status === 'completed' || s.status === 'absent' || s.status === 'cancelled';
        if (!isFinalized) return false;
        if (historyFilter !== 'all' && s.status !== historyFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.time_start.localeCompare(a.time_start));
  }, [filteredSlots, historyFilter]);

  const handleStatusChange = (slot: SlotWithStudent, newStatus: ScheduleSlot['status']) => {
    updateScheduleSlot(slot.studentId, slot.id, { status: newStatus });
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, slot: SlotWithStudent) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot.id);
  };

  const handleDropOnCell = (targetIso: string, targetTime: string, targetEndTime: string) => {
    if (!draggedSlot) return;
    if (draggedSlot.date !== targetIso || draggedSlot.time_start !== targetTime) {
      updateScheduleSlot(draggedSlot.studentId, draggedSlot.id, {
        date: targetIso,
        time_start: targetTime,
        time_end: targetEndTime,
      });
    }
    setDraggedSlot(null);
    setDropTargetKey(null);
  };

  const statusBadge = (status: ScheduleSlot['status']) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          Effectuée
        </span>
      );
    }
    if (status === 'absent') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          Absent
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-100 dark:bg-surface-elevated text-slate-500 border-border-subtle">
          Annulée
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
        Planifiée
      </span>
    );
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
            <span className="text-xs text-slate-400 font-medium font-mono">• Glisser-déposer actif</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Agenda &amp; Planning des Séances
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Déplacez les séances par glisser-déposer, validez les présences/absences en 1 clic et consultez l&apos;historique.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs flex-wrap">
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              viewMode === 'agenda'
                ? 'bg-surface text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Agenda Semaine</span>
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              viewMode === 'day'
                ? 'bg-surface text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Vue Jour</span>
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              viewMode === 'history'
                ? 'bg-surface text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique ({historySlots.length})</span>
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

      {/* Filter & Navigation Toolbar */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">Discipline :</span>
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'code', label: '1. Code' },
            { id: 'creneau', label: '2. Créneau' },
            { id: 'circulation', label: '3. Route' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as typeof filterType)}
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

        {/* Flexible Date & Week Navigation */}
        {viewMode === 'agenda' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => shiftWeek(-1)}
              className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAgendaAnchorDate(todayIso)}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => shiftWeek(1)}
              className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-40">
              <DateInput
                value={agendaAnchorDate}
                onChange={(val) => val && setAgendaAnchorDate(val)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg text-xs font-medium"
                title="Aller à une date"
              />
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDayViewDate(todayIso)}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
            <div className="w-40">
              <DateInput
                value={dayViewDate}
                onChange={(val) => val && setDayViewDate(val)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg text-xs font-medium"
              />
            </div>
          </div>
        )}

        {viewMode === 'history' && (
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Tout' },
              { id: 'completed', label: 'Effectuées' },
              { id: 'absent', label: 'Absents' },
              { id: 'cancelled', label: 'Annulées' },
            ].map((hf) => (
              <button
                key={hf.id}
                onClick={() => setHistoryFilter(hf.id as typeof historyFilter)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition ${
                  historyFilter === hf.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                    : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle'
                }`}
              >
                {hf.label}
              </button>
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg font-medium text-slate-700 dark:text-slate-200 text-xs"
            >
              <option value="all">Toutes les dates ({uniqueDates.length} jours)</option>
              {uniqueDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1. WEEKLY TIME-GRID AGENDA VIEW WITH DRAG & DROP */}
      {viewMode === 'agenda' && (
        <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[880px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-surface-elevated/70 border-b border-border-subtle">
                  <th className="p-3 w-20 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-r border-border-subtle">
                    Heure
                  </th>
                  {weekDays.map((wd) => (
                    <th
                      key={wd.iso}
                      onClick={() => {
                        setDayViewDate(wd.iso);
                        setViewMode('day');
                      }}
                      title="Cliquer pour ouvrir la vue jour"
                      className={`p-3 text-center border-r border-border-subtle last:border-r-0 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition ${
                        wd.isToday ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                      }`}
                    >
                      <span className={`font-semibold block ${wd.isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                        {wd.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{wd.shortDate}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {hourRows.map((row) => (
                  <tr key={row.time} className={row.isLunch ? 'bg-slate-100/70 dark:bg-slate-900/40' : ''}>
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-slate-500 border-r border-border-subtle align-top">
                      <div>{row.time}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{row.endTime}</div>
                    </td>

                    {row.isLunch ? (
                      <td colSpan={weekDays.length} className="p-2.5 text-center text-[11px] text-slate-400 italic">
                        Pause déjeuner ({settings.lunch_break_start} – {settings.lunch_break_end})
                      </td>
                    ) : (
                      weekDays.map((wd) => {
                        const cellKey = `${wd.iso}_${row.time}`;
                        const cellSlots = slotsByCell.get(cellKey) || [];
                        const activePracticalCount = cellSlots.filter(
                          (s) => s.status !== 'cancelled' && s.status !== 'absent' && s.type !== 'code'
                        ).length;
                        const hasConflict = activePracticalCount > 1;
                        const isDropTarget = dropTargetKey === cellKey;

                        return (
                          <td
                            key={cellKey}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (dropTargetKey !== cellKey) setDropTargetKey(cellKey);
                            }}
                            onDragLeave={() => {
                              if (dropTargetKey === cellKey) setDropTargetKey(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDropOnCell(wd.iso, row.time, row.endTime);
                            }}
                            className={`p-1.5 border-r border-border-subtle last:border-r-0 align-top min-w-[130px] min-h-[60px] transition-colors ${
                              isDropTarget
                                ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-2 ring-inset ring-blue-500'
                                : hasConflict
                                ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                : wd.isToday
                                ? 'bg-blue-50/20 dark:bg-blue-950/10'
                                : ''
                            }`}
                          >
                            {hasConflict && (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 mb-1 px-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Conflit ({activePracticalCount})</span>
                              </div>
                            )}
                            <div className="space-y-1.5">
                              {cellSlots.map((slot) => (
                                <div
                                  key={slot.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, slot)}
                                  onDragEnd={() => {
                                    setDraggedSlot(null);
                                    setDropTargetKey(null);
                                  }}
                                  className={`p-2 rounded-lg border text-[11px] space-y-1.5 transition cursor-grab active:cursor-grabbing ${
                                    slot.status === 'completed'
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                                      : slot.status === 'absent'
                                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                                      : slot.status === 'cancelled'
                                      ? 'bg-slate-100/70 dark:bg-surface-elevated border-border-subtle opacity-60'
                                      : 'bg-surface border-border-subtle shadow-2xs hover:border-blue-400/60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1 min-w-0">
                                      <GripVertical className="w-3 h-3 text-slate-300 shrink-0" />
                                      <Link
                                        href={`/candidates/${slot.studentId}`}
                                        className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 truncate"
                                      >
                                        {slot.student_name}
                                      </Link>
                                    </div>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] border shrink-0 ${getCategoryBadgeClass(slot.category)}`}>
                                      {slot.category}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500">
                                      {slot.type === 'code' ? 'Code' : slot.type === 'creneau' ? 'Créneau' : 'Route'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {slot.status === 'scheduled' ? (
                                        <>
                                          <button
                                            onClick={() => handleStatusChange(slot, 'completed')}
                                            className="px-1.5 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-200 cursor-pointer"
                                            title="Marquer Effectuée"
                                          >
                                            ✓
                                          </button>
                                          <button
                                            onClick={() => handleStatusChange(slot, 'absent')}
                                            className="px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-200 cursor-pointer"
                                            title="Marquer Absent"
                                          >
                                            Abs
                                          </button>
                                          <button
                                            onClick={() => handleStatusChange(slot, 'cancelled')}
                                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
                                            title="Annuler"
                                          >
                                            ✕
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => handleStatusChange(slot, 'scheduled')}
                                          className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 inline-flex items-center gap-0.5 cursor-pointer"
                                          title="Remettre en Planifiée"
                                        >
                                          <RotateCcw className="w-2.5 h-2.5" />
                                          <span>
                                            {slot.status === 'completed' ? 'Fait' : slot.status === 'absent' ? 'Absent' : 'Annulée'}
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. FLEXIBLE DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Séances du {dayViewDate}
            </h3>
            <span className="text-xs font-mono text-slate-400">{dayViewSlots.length} séance(s)</span>
          </div>

          {dayViewSlots.length > 0 ? (
            <div className="space-y-2.5">
              {dayViewSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3.5 rounded-xl border border-border-subtle bg-slate-50/70 dark:bg-surface-elevated/60 flex items-center justify-between flex-wrap gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-semibold">
                      {slot.time_start} – {slot.time_end}
                    </span>
                    <div>
                      <Link href={`/candidates/${slot.studentId}`} className="font-semibold text-slate-900 dark:text-white hover:text-blue-600">
                        {slot.student_name}
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'} • Cat. {slot.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(slot.status)}
                    <button
                      onClick={() => handleStatusChange(slot, 'completed')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Effectuée</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(slot, 'absent')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Absent</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(slot, 'cancelled')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-border-subtle rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Annuler</span>
                    </button>
                    {slot.status !== 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(slot, 'scheduled')}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Planifiée</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center italic">
              Aucune séance programmée pour le {dayViewDate}.
            </p>
          )}
        </div>
      )}

      {/* 3. HISTORY VIEW */}
      {viewMode === 'history' && (
        <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Historique des Séances (Effectuées, Absences &amp; Annulations)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">{historySlots.length} entrée(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 dark:text-slate-400 border-b border-border-subtle text-[10px] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Candidat</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Modifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {historySlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50 transition">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-medium text-slate-900 dark:text-white block">{slot.date}</span>
                      <span className="text-[11px] text-slate-400">{slot.time_start} - {slot.time_end}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/candidates/${slot.studentId}`} className="font-medium text-slate-900 dark:text-white hover:text-blue-600">
                        {slot.student_name}
                      </Link>
                      <span className="text-[10px] text-slate-400 block">Cat. {slot.category}</span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">
                      {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                    </td>
                    <td className="py-3 px-4">{statusBadge(slot.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleStatusChange(slot, 'scheduled')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[10px] font-medium border border-border-subtle transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reprogrammer</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {historySlots.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                      Aucune séance clôturée dans l&apos;historique.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 dark:text-slate-400 border-b border-border-subtle text-[10px] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Candidat</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Moniteur</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50 transition">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-medium text-slate-900 dark:text-white block">{slot.date}</span>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400">
                        {slot.time_start} - {slot.time_end}
                      </span>
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
                    <td className="py-3 px-4">{statusBadge(slot.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {slot.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(slot, 'completed')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium border border-emerald-200 transition cursor-pointer"
                          >
                            Fait
                          </button>
                        )}
                        {slot.status !== 'absent' && (
                          <button
                            onClick={() => handleStatusChange(slot, 'absent')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[10px] font-medium border border-amber-200 transition cursor-pointer"
                          >
                            Absent
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
        </div>
      )}
    </div>
  );
}
