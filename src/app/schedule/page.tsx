'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  UserCheck,
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { DayOfWeek, Mentor, ScheduleSlot, getCategoryBadgeClass } from '@/types/kreno';
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

function SchedulePageContent() {
  const searchParams = useSearchParams();
  const { students, mentors, settings, updateScheduleSlot, resolveScheduleSlot, deleteScheduleSlot, getSlotCapacityLimit } = useKreno();

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const [viewMode, setViewMode] = useState<'agenda' | 'day' | 'history' | 'table'>('agenda');
  const [selectedMentor, setSelectedMentor] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'code' | 'creneau' | 'circulation'>('all');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'absent' | 'cancelled'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [agendaAnchorDate, setAgendaAnchorDate] = useState<string>(todayIso);
  const [dayViewDate, setDayViewDate] = useState<string>(todayIso);
  const [resolutionNotice, setResolutionNotice] = useState<{ type: 'free' | 'paid'; text: string } | null>(null);

  useEffect(() => {
    const mentorParam = searchParams.get('mentor');
    if (mentorParam) {
      setSelectedMentor(mentorParam);
    }
  }, [searchParams]);

  // Drag & Drop state
  const [draggedSlot, setDraggedSlot] = useState<SlotWithStudent | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [dropMentorTarget, setDropMentorTarget] = useState<string | null>(null);

  const isMentorEligibleForSlot = (m: Mentor, slot: SlotWithStudent) =>
    m.is_active &&
    m.specialties.includes(slot.type) &&
    m.license_categories.includes(slot.category);

  const handleAssignMentor = (slot: SlotWithStudent, newMentorName: string) => {
    if (!newMentorName || newMentorName === slot.instructor_name) return;

    const targetMentor = mentors.find((m) => m.name === newMentorName);
    if (!targetMentor || !isMentorEligibleForSlot(targetMentor, slot)) {
      const discLabel = slot.type === 'code' ? 'Code' : slot.type === 'creneau' ? 'Créneau' : 'Circulation';
      setResolutionNotice({
        type: 'paid',
        text: `Impossible : ${newMentorName} n'est pas actif ou n'est pas habilité pour ${discLabel} (Permis ${slot.category}).`,
      });
      return;
    }

    const targetLimit = getSlotCapacityLimit(slot.type, slot.category);
    const existingWithTarget = allSlotsWithStudent.filter(
      (s) =>
        s.id !== slot.id &&
        s.date === slot.date &&
        s.time_start === slot.time_start &&
        s.instructor_name === newMentorName &&
        s.status !== 'cancelled' &&
        s.status !== 'absent'
    );

    // Physical vehicle/room lock:
    // - Practical (creneau/circulation) cannot mix different categories (e.g. Cat B + Cat C) or mix creneau & circulation with the same mentor.
    // - Code cannot mix with practical lessons for the same mentor.
    const hasIncompatibleActivity =
      slot.type === 'code'
        ? existingWithTarget.some((s) => s.type !== 'code')
        : existingWithTarget.some((s) => s.type !== slot.type || s.category !== slot.category);

    if (hasIncompatibleActivity) {
      setResolutionNotice({
        type: 'paid',
        text: `Impossible : ${newMentorName} encadre déjà une autre catégorie ou discipline à ${slot.time_start} le ${slot.date} (impossible de mélanger deux véhicules/permis différents).`,
      });
      return;
    }

    const currentCount = existingWithTarget.length;
    if (currentCount >= targetLimit) {
      setResolutionNotice({
        type: 'paid',
        text: `Impossible : ${newMentorName} a déjà atteint sa capacité maximale (${currentCount}/${targetLimit}) le ${slot.date} à ${slot.time_start}.`,
      });
      return;
    }

    updateScheduleSlot(slot.studentId, slot.id, { instructor_name: newMentorName });
    setResolutionNotice({
      type: 'free',
      text: `Séance de ${slot.student_name} (${slot.date} à ${slot.time_start}) transférée à ${newMentorName}.`,
    });
  };

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
        const matchesMentor = selectedMentor === 'all' || slot.instructor_name === selectedMentor;
        const matchesType = filterType === 'all' || slot.type === filterType;
        const matchesDate = viewMode !== 'table' || selectedDate === 'all' || slot.date === selectedDate;
        return matchesMentor && matchesType && matchesDate;
      })
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return a.time_start.localeCompare(b.time_start);
      });
  }, [allSlotsWithStudent, selectedMentor, filterType, selectedDate, viewMode]);

  const mentorCounts = useMemo(() => {
    const map = new Map<string, number>();
    allSlotsWithStudent.forEach((s) => {
      if (s.status !== 'cancelled' && s.status !== 'absent') {
        map.set(s.instructor_name, (map.get(s.instructor_name) || 0) + 1);
      }
    });
    return map;
  }, [allSlotsWithStudent]);

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

  // Hourly rows (6h/day: 08h-12h + 14h-16h)
  const libreHour = settings.libre_hour || '';
  const hourRows = useMemo(() => {
    const startH = parseInt((settings.start_hour || '08:00').split(':')[0], 10);
    const endH = parseInt((settings.end_hour || '16:00').split(':')[0], 10);
    const lunchStart = settings.lunch_break_start || '12:00';
    const lunchEnd = settings.lunch_break_end || '14:00';

    const rows: { time: string; endTime: string; isLunch: boolean; isLibre: boolean }[] = [];
    for (let h = startH; h < endH; h++) {
      const time = `${String(h).padStart(2, '0')}:00`;
      const endTime = `${String(h + 1).padStart(2, '0')}:00`;
      const isLunch = time >= lunchStart && time < lunchEnd;
      const isLibre = Boolean(libreHour && !isLunch && time === libreHour);
      rows.push({ time, endTime, isLunch, isLibre });
    }
    return rows;
  }, [settings.start_hour, settings.end_hour, settings.lunch_break_start, settings.lunch_break_end, libreHour]);

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
    if (newStatus === 'completed') {
      resolveScheduleSlot(slot.studentId, slot.id, 'completed');
      setResolutionNotice(null);
    } else if (newStatus === 'absent') {
      const res = resolveScheduleSlot(slot.studentId, slot.id, 'absent_student');
      if (res?.addedSlot) {
        setResolutionNotice({
          type: 'paid',
          text: `Absence candidat (${slot.student_name}) : comptée sur le candidat + 1h payante (+${res.extraFee} DZD) programmée le ${res.addedSlot.date} à ${res.addedSlot.time_start}.`,
        });
      }
    } else if (newStatus === 'cancelled') {
      const res = resolveScheduleSlot(slot.studentId, slot.id, 'cancelled_school');
      if (res?.addedSlot) {
        setResolutionNotice({
          type: 'free',
          text: `Annulation auto-école (${slot.student_name}) : comptée sur l'école + 1h gratuite offerte le ${res.addedSlot.date} à ${res.addedSlot.time_start}.`,
        });
      }
    } else {
      resolveScheduleSlot(slot.studentId, slot.id, 'scheduled');
      setResolutionNotice(null);
    }
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
      const samePersonAlreadyInHour = allSlotsWithStudent.some(
        (s) =>
          s.id !== draggedSlot.id &&
          s.studentId === draggedSlot.studentId &&
          s.status !== 'cancelled' &&
          s.status !== 'absent' &&
          s.date === targetIso &&
          s.time_start === targetTime
      );
      if (samePersonAlreadyInHour) {
        setResolutionNotice({
          type: 'paid',
          text: `Action impossible : ${draggedSlot.student_name} a déjà une séance à ${targetTime} le ${targetIso}. Un candidat ne peut pas être programmé deux fois sur la même heure.`,
        });
        setDraggedSlot(null);
        setDropTargetKey(null);
        return;
      }

      // Check mentor physical exclusivity & capacity at target hour
      const mentorSlotsAtTarget = allSlotsWithStudent.filter(
        (s) =>
          s.id !== draggedSlot.id &&
          s.instructor_name === draggedSlot.instructor_name &&
          s.status !== 'cancelled' &&
          s.status !== 'absent' &&
          s.date === targetIso &&
          s.time_start === targetTime
      );
      const hasIncompatible =
        draggedSlot.type === 'code'
          ? mentorSlotsAtTarget.some((s) => s.type !== 'code')
          : mentorSlotsAtTarget.some((s) => s.type !== draggedSlot.type || s.category !== draggedSlot.category);
      if (hasIncompatible) {
        setResolutionNotice({
          type: 'paid',
          text: `Impossible : ${draggedSlot.instructor_name} encadre déjà une autre catégorie de permis ou discipline à ${targetTime} le ${targetIso}.`,
        });
        setDraggedSlot(null);
        setDropTargetKey(null);
        return;
      }
      const targetCap = getSlotCapacityLimit(draggedSlot.type, draggedSlot.category);
      if (mentorSlotsAtTarget.length >= targetCap) {
        setResolutionNotice({
          type: 'paid',
          text: `Impossible : ${draggedSlot.instructor_name} a déjà atteint sa capacité (${mentorSlotsAtTarget.length}/${targetCap}) à ${targetTime} le ${targetIso}.`,
        });
        setDraggedSlot(null);
        setDropTargetKey(null);
        return;
      }

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
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              Planning 6h / Jour (08h–12h • 14h–16h){libreHour ? ` • Libre ${libreHour}` : ''} • Max {settings.candidates_per_vehicle ?? 3} / voiture
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

      {/* Mentor Schedule Tabs (1 tab per mentor) */}
      <div className="bg-surface p-3 rounded-xl border border-border-subtle shadow-xs flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 shrink-0 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Moniteurs :</span>
        </span>
        <button
          onClick={() => setSelectedMentor('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 border ${
            selectedMentor === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900'
              : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle hover:bg-slate-100'
          }`}
        >
          Tous ({allSlotsWithStudent.filter((s) => s.status !== 'cancelled' && s.status !== 'absent').length}h)
        </button>
        {mentors.map((m) => {
          const isMentorDrop = dropMentorTarget === m.name;
          const isDropAllowed = !draggedSlot || isMentorEligibleForSlot(m, draggedSlot);
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMentor(m.name)}
              onDragOver={(e) => {
                if (!draggedSlot) return;
                e.preventDefault();
                if (dropMentorTarget !== m.name) setDropMentorTarget(m.name);
              }}
              onDragLeave={() => {
                if (dropMentorTarget === m.name) setDropMentorTarget(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedSlot) {
                  handleAssignMentor(draggedSlot, m.name);
                  setDraggedSlot(null);
                }
                setDropMentorTarget(null);
              }}
              title={
                draggedSlot && !isDropAllowed
                  ? `${m.name} n'est pas habilité pour cette séance`
                  : 'Cliquer pour voir son planning, ou glisser une séance compatible ici'
              }
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 border inline-flex items-center gap-1.5 ${
                isMentorDrop
                  ? isDropAllowed
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400 scale-105'
                    : 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400'
                  : draggedSlot && !isDropAllowed
                  ? 'bg-slate-100 dark:bg-surface-elevated text-slate-400 border-border-subtle opacity-50'
                  : selectedMentor === m.name
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-surface-elevated text-slate-700 dark:text-slate-200 border-border-subtle hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-0.5">
                {m.specialties.includes('code') && (
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedMentor === m.name || isMentorDrop ? 'bg-white' : 'bg-blue-500'}`} />
                )}
                {m.specialties.includes('creneau') && (
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedMentor === m.name || isMentorDrop ? 'bg-white' : 'bg-purple-500'}`} />
                )}
                {m.specialties.includes('circulation') && (
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedMentor === m.name || isMentorDrop ? 'bg-white' : 'bg-emerald-500'}`} />
                )}
              </span>
              <span>{m.name}</span>
              <span className={`text-[10px] font-mono ${selectedMentor === m.name || isMentorDrop ? 'text-blue-100' : 'text-slate-400'}`}>
                ({mentorCounts.get(m.name) || 0}h)
              </span>
            </button>
          );
        })}
        <Link
          href="/mentors"
          className="ml-auto px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 shrink-0 transition"
        >
          + Gérer moniteurs &amp; capacités
        </Link>
      </div>

      {/* Filter & Navigation Toolbar */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">Discipline :</span>
          {[
            { id: 'all', label: 'Toutes', dot: '' },
            { id: 'code', label: '1. Code', dot: 'bg-blue-500' },
            { id: 'creneau', label: '2. Créneau', dot: 'bg-purple-500' },
            { id: 'circulation', label: '3. Route', dot: 'bg-emerald-500' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium border inline-flex items-center gap-1.5 ${
                filterType === f.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.dot && (
                <span className={`w-2 h-2 rounded-full ${filterType === f.id ? 'bg-white' : f.dot}`} />
              )}
              <span>{f.label}</span>
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

      {/* Resolution Feedback Banner */}
      {resolutionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            resolutionNotice.type === 'free'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          }`}
        >
          <span className="font-medium">{resolutionNotice.text}</span>
          <button
            onClick={() => setResolutionNotice(null)}
            className="px-2 py-0.5 rounded hover:bg-black/5 text-[11px] font-semibold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

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
                  <tr key={row.time} className={row.isLunch ? 'bg-slate-100/70 dark:bg-slate-900/40' : row.isLibre ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}>
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-slate-500 border-r border-border-subtle align-top">
                      <div>{row.time}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{row.endTime}</div>
                      {row.isLibre && (
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-sans text-[9px] font-semibold">
                          Libre
                        </span>
                      )}
                    </td>

                    {row.isLunch ? (
                      <td colSpan={weekDays.length} className="p-2.5 text-center text-[11px] text-slate-400 italic">
                        Pause déjeuner ({settings.lunch_break_start} – {settings.lunch_break_end})
                      </td>
                    ) : (
                      weekDays.map((wd) => {
                        const cellKey = `${wd.iso}_${row.time}`;
                        const cellSlots = slotsByCell.get(cellKey) || [];
                        const activeInCell = cellSlots.filter(
                          (s) => s.status !== 'cancelled' && s.status !== 'absent'
                        );
                        // Check capacity limit AND physical vehicle/category exclusivity per mentor in this hour
                        const mentorSlotsMap = new Map<string, SlotWithStudent[]>();
                        activeInCell.forEach((s) => {
                          const list = mentorSlotsMap.get(s.instructor_name) || [];
                          list.push(s);
                          mentorSlotsMap.set(s.instructor_name, list);
                        });
                        const hasConflict = Array.from(mentorSlotsMap.values()).some((mSlots) => {
                          const hasCode = mSlots.some((s) => s.type === 'code');
                          const hasPractical = mSlots.some((s) => s.type !== 'code');
                          if (hasCode && hasPractical) return true;
                          if (hasPractical) {
                            const first = mSlots[0];
                            const mixedPractical = mSlots.some((s) => s.type !== first.type || s.category !== first.category);
                            if (mixedPractical) return true;
                            return mSlots.length > getSlotCapacityLimit(first.type, first.category);
                          }
                          return mSlots.length > getSlotCapacityLimit('code', mSlots[0].category);
                        });
                        const activePracticalCount = activeInCell.length;
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
                                  className={`p-2 rounded-lg border border-l-4 text-[11px] space-y-1.5 transition cursor-grab active:cursor-grabbing ${
                                    slot.type === 'code'
                                      ? 'border-l-blue-500'
                                      : slot.type === 'creneau'
                                      ? 'border-l-purple-500'
                                      : 'border-l-emerald-500'
                                  } ${
                                    slot.status === 'absent'
                                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                                      : slot.status === 'cancelled'
                                      ? 'bg-slate-100/80 dark:bg-surface-elevated border-border-subtle opacity-60'
                                      : slot.type === 'code'
                                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 hover:border-blue-400'
                                      : slot.type === 'creneau'
                                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 hover:border-purple-400'
                                      : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
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

                                  <div className="flex items-center justify-between gap-1 text-[10px]">
                                    {(() => {
                                      const eligibleMentors = mentors.filter((m) => isMentorEligibleForSlot(m, slot));
                                      const canSwitch = eligibleMentors.length > 1 || (eligibleMentors.length === 1 && eligibleMentors[0].name !== slot.instructor_name);
                                      return (
                                        <select
                                          value={slot.instructor_name}
                                          disabled={!canSwitch}
                                          onChange={(e) => handleAssignMentor(slot, e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          title={
                                            canSwitch
                                              ? 'Changer vers un autre moniteur éligible'
                                              : 'Aucun autre moniteur éligible pour cette discipline/catégorie'
                                          }
                                          className={`bg-white/70 dark:bg-surface-elevated/80 border border-border-subtle rounded px-1 py-0.5 text-[9px] font-medium text-slate-600 dark:text-slate-300 max-w-[95px] truncate ${
                                            canSwitch ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'
                                          }`}
                                        >
                                          {!eligibleMentors.some((m) => m.name === slot.instructor_name) && (
                                            <option value={slot.instructor_name}>{slot.instructor_name}</option>
                                          )}
                                          {eligibleMentors.map((m) => (
                                            <option key={m.id} value={m.name}>{m.name}</option>
                                          ))}
                                        </select>
                                      );
                                    })()}
                                    <span className="text-[9px] font-mono text-slate-400">1h</span>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                                        slot.type === 'code'
                                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                                          : slot.type === 'creneau'
                                          ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                      }`}>
                                        {slot.type === 'code' ? 'Code' : slot.type === 'creneau' ? 'Créneau' : 'Route'}
                                      </span>
                                      {slot.billing_type === 'free_makeup' && (
                                        <span className="px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-semibold">
                                          Offerte
                                        </span>
                                      )}
                                      {slot.billing_type === 'paid_extra' && (
                                        <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[9px] font-semibold">
                                          Payante
                                        </span>
                                      )}
                                    </div>
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
                                            title="Absent candidat : compté sur lui + 1h payante ajoutée"
                                          >
                                            Abs
                                          </button>
                                          <button
                                            onClick={() => handleStatusChange(slot, 'cancelled')}
                                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                                            title="Annulée par l'école : comptée sur l'école + 1h gratuite offerte"
                                          >
                                            École
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
                                            {slot.status === 'completed' ? 'Fait' : slot.status === 'absent' ? 'Absent' : 'École'}
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
                    {(() => {
                      const eligibleMentors = mentors.filter((m) => isMentorEligibleForSlot(m, slot));
                      const canSwitch = eligibleMentors.length > 1 || (eligibleMentors.length === 1 && eligibleMentors[0].name !== slot.instructor_name);
                      return (
                        <select
                          value={slot.instructor_name}
                          disabled={!canSwitch}
                          onChange={(e) => handleAssignMentor(slot, e.target.value)}
                          className={`px-2 py-1 rounded-lg border border-border-subtle bg-white dark:bg-surface text-[11px] font-medium text-slate-700 dark:text-slate-200 ${
                            canSwitch ? 'cursor-pointer' : 'opacity-65 cursor-not-allowed'
                          }`}
                          title={canSwitch ? 'Changer de moniteur' : 'Aucun autre moniteur éligible pour cette discipline/catégorie'}
                        >
                          {!eligibleMentors.some((m) => m.name === slot.instructor_name) && (
                            <option value={slot.instructor_name}>{slot.instructor_name}</option>
                          )}
                          {eligibleMentors.map((m) => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      );
                    })()}
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
                      title="Comptée sur le candidat + 1h payante ajoutée"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Absent (+1h payante)</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(slot, 'cancelled')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-border-subtle rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
                      title="Comptée sur l'école + 1h gratuite offerte"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Annulée École (+1h gratuite)</span>
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
                      {(() => {
                        const eligibleMentors = mentors.filter((m) => isMentorEligibleForSlot(m, slot));
                        const canSwitch = eligibleMentors.length > 1 || (eligibleMentors.length === 1 && eligibleMentors[0].name !== slot.instructor_name);
                        return (
                          <select
                            value={slot.instructor_name}
                            disabled={!canSwitch}
                            onChange={(e) => handleAssignMentor(slot, e.target.value)}
                            className={`px-2 py-1 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated text-xs font-medium text-slate-700 dark:text-slate-200 ${
                              canSwitch ? 'cursor-pointer' : 'opacity-65 cursor-not-allowed'
                            }`}
                            title={canSwitch ? 'Changer de moniteur' : 'Aucun autre moniteur éligible'}
                          >
                            {!eligibleMentors.some((m) => m.name === slot.instructor_name) && (
                              <option value={slot.instructor_name}>{slot.instructor_name}</option>
                            )}
                            {eligibleMentors.map((m) => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        );
                      })()}
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

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement du planning...</div>}>
      <SchedulePageContent />
    </Suspense>
  );
}
