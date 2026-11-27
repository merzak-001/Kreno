'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  CalendarDays,
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
  Plus,
  X,
  Users,
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import {
  DayOfWeek,
  Mentor,
  ScheduleSlot,
  SessionDiscipline,
  getCategoryBadgeClass,
  getCategoryDotClass,
  getDisciplineMeta,
} from '@/types/kreno';
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

function parseLocalIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
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
  const {
    students,
    mentors,
    settings,
    userRole,
    addScheduleSlot,
    updateScheduleSlot,
    resolveScheduleSlot,
    deleteScheduleSlot,
    getSlotCapacityLimit,
  } = useKreno();
  const isOwner = userRole === 'owner';

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const [viewMode, setViewMode] = useState<'day' | 'agenda' | 'history'>('day');
  const [selectedMentor, setSelectedMentor] = useState<string>(
    () => searchParams.get('mentor') || 'all'
  );
  const [filterType, setFilterType] = useState<'all' | SessionDiscipline>('all');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'absent' | 'cancelled'>('all');
  const [agendaAnchorDate, setAgendaAnchorDate] = useState<string>(todayIso);
  const [dayViewDate, setDayViewDate] = useState<string>(todayIso);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Drag & Drop state
  const [draggedSlot, setDraggedSlot] = useState<SlotWithStudent | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  // Simple modals: Session details/actions, Confirmation for Absent/Cancelled, Quick Add
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [pendingResolution, setPendingResolution] = useState<{
    slot: SlotWithStudent;
    action: 'absent' | 'cancelled';
  } | null>(null);
  const [quickAddCell, setQuickAddCell] = useState<{
    date: string;
    timeStart: string;
    timeEnd: string;
  } | null>(null);
  const [quickAddStudentId, setQuickAddStudentId] = useState<string>('');
  const [quickAddType, setQuickAddType] = useState<SessionDiscipline>('code');
  const [quickAddMentor, setQuickAddMentor] = useState<string>('');

  const allSlotsWithStudent: SlotWithStudent[] = students.flatMap((s) =>
    (s.schedule_slots || []).map((slot) => ({
      ...slot,
      studentId: s.id,
    }))
  );

  const activeSlot = activeSlotId
    ? allSlotsWithStudent.find((s) => s.id === activeSlotId) || null
    : null;

  const isMentorEligibleForSlot = (m: Mentor, type: SessionDiscipline, category: string) =>
    m.is_active &&
    m.specialties.includes(type) &&
    m.license_categories.includes(category as ScheduleSlot['category']);

  const filteredSlots = allSlotsWithStudent
    .filter((slot) => {
      const matchesMentor = selectedMentor === 'all' || slot.instructor_name === selectedMentor;
      const matchesType = filterType === 'all' || slot.type === filterType;
      return matchesMentor && matchesType;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start));

  const mentorCounts = new Map<string, number>();
  allSlotsWithStudent.forEach((s) => {
    if (s.status !== 'cancelled' && s.status !== 'absent') {
      mentorCounts.set(s.instructor_name, (mentorCounts.get(s.instructor_name) || 0) + 1);
    }
  });

  // Working days for the selected week
  const weekDays = useMemo(() => {
    const startSat = getStartOfAlgerianWeek(parseLocalIso(agendaAnchorDate));
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
    const d = parseLocalIso(agendaAnchorDate);
    d.setDate(d.getDate() + deltaWeeks * 7);
    setAgendaAnchorDate(toIsoDate(d));
  };

  const shiftDay = (deltaDays: number) => {
    const d = parseLocalIso(dayViewDate);
    d.setDate(d.getDate() + deltaDays);
    setDayViewDate(toIsoDate(d));
  };

  // Hourly rows
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

  const slotsByCell = new Map<string, SlotWithStudent[]>();
  filteredSlots.forEach((slot) => {
    const key = `${slot.date}_${slot.time_start}`;
    const list = slotsByCell.get(key) || [];
    list.push(slot);
    slotsByCell.set(key, list);
  });

  const dayViewSlots = filteredSlots.filter((s) => s.date === dayViewDate);

  const historySlots = filteredSlots
    .filter((s) => {
      const isFinalized = s.status === 'completed' || s.status === 'absent' || s.status === 'cancelled';
      if (!isFinalized) return false;
      if (historyFilter !== 'all' && s.status !== historyFilter) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.time_start.localeCompare(a.time_start));

  const executeStatusChange = (slot: SlotWithStudent, newStatus: ScheduleSlot['status']) => {
    if (newStatus === 'completed') {
      resolveScheduleSlot(slot.studentId, slot.id, 'completed');
      setNotice({ type: 'success', text: `Séance de ${slot.student_name} marquée Effectuée.` });
    } else if (newStatus === 'absent') {
      const res = resolveScheduleSlot(slot.studentId, slot.id, 'absent_student');
      setNotice({
        type: 'error',
        text: res?.addedSlot
          ? `Absence enregistrée (${slot.student_name}) : +1h payante (+${res.extraFee} DZD) programmée le ${res.addedSlot.date} à ${res.addedSlot.time_start}.`
          : `Absence enregistrée pour ${slot.student_name}.`,
      });
    } else if (newStatus === 'cancelled') {
      const res = resolveScheduleSlot(slot.studentId, slot.id, 'cancelled_school');
      setNotice({
        type: 'success',
        text: res?.addedSlot
          ? `Annulation école (${slot.student_name}) : +1h gratuite ajoutée le ${res.addedSlot.date} à ${res.addedSlot.time_start}.`
          : `Séance annulée pour ${slot.student_name}.`,
      });
    } else {
      resolveScheduleSlot(slot.studentId, slot.id, 'scheduled');
      setNotice({ type: 'success', text: `Séance de ${slot.student_name} remise en Planifiée.` });
    }
  };

  const requestStatusChange = (slot: SlotWithStudent, newStatus: ScheduleSlot['status']) => {
    if (newStatus === 'absent' || newStatus === 'cancelled') {
      setPendingResolution({ slot, action: newStatus });
      return;
    }
    executeStatusChange(slot, newStatus);
  };

  const handleAssignMentor = (slot: SlotWithStudent, newMentorName: string) => {
    if (!newMentorName || newMentorName === slot.instructor_name) return;

    const targetMentor = mentors.find((m) => m.name === newMentorName);
    if (!targetMentor || !isMentorEligibleForSlot(targetMentor, slot.type, slot.category)) {
      setNotice({
        type: 'error',
        text: `${newMentorName} n'est pas habilité pour ${getDisciplineMeta(slot.type).fullLabel} (Permis ${slot.category}).`,
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

    const hasIncompatibleActivity =
      slot.type === 'code'
        ? existingWithTarget.some((s) => s.type !== 'code')
        : existingWithTarget.some((s) => s.type !== slot.type || s.category !== slot.category);

    if (hasIncompatibleActivity) {
      setNotice({
        type: 'error',
        text: `${newMentorName} encadre déjà une autre catégorie ou discipline à ${slot.time_start} le ${slot.date}.`,
      });
      return;
    }

    if (existingWithTarget.length >= targetLimit) {
      setNotice({
        type: 'error',
        text: `${newMentorName} est complet (${existingWithTarget.length}/${targetLimit}) le ${slot.date} à ${slot.time_start}.`,
      });
      return;
    }

    updateScheduleSlot(slot.studentId, slot.id, { instructor_name: newMentorName });
    setNotice({
      type: 'success',
      text: `Séance de ${slot.student_name} transférée à ${newMentorName}.`,
    });
  };

  const handleDropOnCell = (targetIso: string, targetTime: string, targetEndTime: string) => {
    if (!draggedSlot) return;
    if (draggedSlot.date !== targetIso || draggedSlot.time_start !== targetTime) {
      const samePersonBusy = allSlotsWithStudent.some(
        (s) =>
          s.id !== draggedSlot.id &&
          s.studentId === draggedSlot.studentId &&
          s.status !== 'cancelled' &&
          s.status !== 'absent' &&
          s.date === targetIso &&
          s.time_start === targetTime
      );
      if (samePersonBusy) {
        setNotice({
          type: 'error',
          text: `${draggedSlot.student_name} a déjà une séance à ${targetTime} le ${targetIso}.`,
        });
        setDraggedSlot(null);
        setDropTargetKey(null);
        return;
      }

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
        setNotice({
          type: 'error',
          text: `${draggedSlot.instructor_name} encadre déjà une autre discipline ou catégorie à ${targetTime} le ${targetIso}.`,
        });
        setDraggedSlot(null);
        setDropTargetKey(null);
        return;
      }

      const targetCap = getSlotCapacityLimit(draggedSlot.type, draggedSlot.category);
      if (mentorSlotsAtTarget.length >= targetCap) {
        setNotice({
          type: 'error',
          text: `${draggedSlot.instructor_name} est complet (${mentorSlotsAtTarget.length}/${targetCap}) à ${targetTime} le ${targetIso}.`,
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
      setNotice({
        type: 'success',
        text: `Séance de ${draggedSlot.student_name} déplacée au ${formatShortFR(targetIso)} à ${targetTime}.`,
      });
    }
    setDraggedSlot(null);
    setDropTargetKey(null);
  };

  const openQuickAdd = (date: string, timeStart: string, timeEnd: string) => {
    const defaultStudent = students[0]?.id || '';
    setQuickAddStudentId(defaultStudent);
    setQuickAddType('code');
    const st = students.find((s) => s.id === defaultStudent);
    const eligible = st
      ? mentors.filter((m) => isMentorEligibleForSlot(m, 'code', st.requested_category))
      : mentors.filter((m) => m.is_active);
    setQuickAddMentor(eligible[0]?.name || '');
    setQuickAddCell({ date, timeStart, timeEnd });
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddCell || !quickAddStudentId || !quickAddMentor) return;
    const res = addScheduleSlot(
      quickAddStudentId,
      quickAddCell.date,
      quickAddCell.timeStart,
      quickAddCell.timeEnd,
      quickAddType,
      quickAddMentor
    );
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Impossible d’ajouter la séance.' });
      return;
    }
    setNotice({
      type: 'success',
      text: `Séance ajoutée le ${formatShortFR(quickAddCell.date)} à ${quickAddCell.timeStart}.`,
    });
    setQuickAddCell(null);
  };

  const statusBadge = (status: ScheduleSlot['status']) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          Effectuée
        </span>
      );
    }
    if (status === 'absent') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          Absent
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 dark:bg-surface-elevated text-slate-500 border-border-subtle">
          Annulée
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800">
        Planifiée
      </span>
    );
  };

  const quickAddSelectedStudent = students.find((s) => s.id === quickAddStudentId);
  const quickAddEligibleMentors = quickAddSelectedStudent
    ? mentors.filter((m) => isMentorEligibleForSlot(m, quickAddType, quickAddSelectedStudent.requested_category))
    : mentors.filter((m) => m.is_active);

  return (
    <div className="space-y-4 w-full">
      {/* Clean Header & 3 Simple Views */}
      <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Planning des Séances</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pointez les présences du jour ou organisez la semaine simplement.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'day'
                  ? 'bg-surface text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Aujourd&apos;hui</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-surface text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Semaine</span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'history'
                  ? 'bg-surface text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique</span>
            </button>
          </div>

          <Link
            href="/mentors"
            className="px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Moniteurs</span>
          </Link>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="bg-surface px-4 py-3 rounded-xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'Toutes', dot: '' },
            { id: 'code', label: '1. Code', dot: getDisciplineMeta('code').dotClass },
            { id: 'creneau', label: '2. Créneau', dot: getDisciplineMeta('creneau').dotClass },
            { id: 'circulation', label: '3. Route', dot: getDisciplineMeta('circulation').dotClass },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-semibold border inline-flex items-center gap-1.5 ${
                filterType === f.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.dot && (
                <span className={`w-2 h-2 rounded-full ${f.dot}`} />
              )}
              <span>{f.label}</span>
            </button>
          ))}

          <select
            value={selectedMentor}
            onChange={(e) => setSelectedMentor(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            <option value="all">Tous les moniteurs</option>
            {mentors
              .filter((m) => m.is_active)
              .map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({mentorCounts.get(m.name) || 0}h)
                </option>
              ))}
          </select>
        </div>

        {/* Date / Week Navigation */}
        {viewMode === 'day' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => shiftDay(-1)}
              className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Jour précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDayViewDate(todayIso)}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => shiftDay(1)}
              className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Jour suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-36">
              <DateInput
                value={dayViewDate}
                onChange={(val) => val && setDayViewDate(val)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg text-xs font-medium"
              />
            </div>
          </div>
        )}

        {viewMode === 'agenda' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => shiftWeek(-1)}
              className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAgendaAnchorDate(todayIso)}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cette semaine
            </button>
            <button
              onClick={() => shiftWeek(1)}
              className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-36">
              <DateInput
                value={agendaAnchorDate}
                onChange={(val) => val && setAgendaAnchorDate(val)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg text-xs font-medium"
              />
            </div>
          </div>
        )}

        {viewMode === 'history' && (
          <div className="flex items-center gap-1.5">
            {(['all', 'completed', 'absent', 'cancelled'] as const).map((hf) => (
              <button
                key={hf}
                onClick={() => setHistoryFilter(hf)}
                className={`px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer ${
                  historyFilter === hf
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900'
                    : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle'
                }`}
              >
                {hf === 'all' ? 'Tout' : hf === 'completed' ? 'Effectuées' : hf === 'absent' ? 'Absents' : 'Annulées'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-[11px] font-semibold opacity-70 hover:opacity-100 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 1. TODAY / DAY VIEW (Default, simple attendance) */}
      {viewMode === 'day' && (
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Séances du {formatShortFR(dayViewDate)} {dayViewDate === todayIso ? '(Aujourd’hui)' : ''}
            </h2>
            <span className="text-xs font-mono text-slate-400">{dayViewSlots.length} séance(s)</span>
          </div>

          {dayViewSlots.length > 0 ? (
            <div className="space-y-2.5">
              {dayViewSlots.map((slot) => {
                const disc = getDisciplineMeta(slot.type);
                return (
                  <div
                    key={slot.id}
                    className={`p-3.5 rounded-xl border border-l-4 flex items-center justify-between flex-wrap gap-3 text-xs ${disc.borderLeftClass} ${
                      slot.status === 'cancelled'
                        ? 'bg-slate-50 dark:bg-surface-elevated/40 border-border-subtle opacity-60'
                        : 'bg-surface border-border-subtle hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-800 dark:text-slate-100 font-mono font-bold">
                        {slot.time_start}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${disc.pillClass}`}>
                        {disc.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${getCategoryBadgeClass(slot.category)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getCategoryDotClass(slot.category)}`} />
                        <span>{slot.category}</span>
                      </span>
                      <div>
                        <Link
                          href={`/candidates/${slot.studentId}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600"
                        >
                          {slot.student_name}
                        </Link>
                        <span className="block text-[11px] text-slate-500">
                          Moniteur : <strong>{slot.instructor_name}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {slot.status === 'scheduled' ? (
                        <>
                          <button
                            onClick={() => requestStatusChange(slot, 'completed')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Présent</span>
                          </button>
                          <button
                            onClick={() => requestStatusChange(slot, 'absent')}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>
                          <button
                            onClick={() => requestStatusChange(slot, 'cancelled')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated text-slate-700 dark:text-slate-200 border border-border-subtle rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Annulé</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {statusBadge(slot.status)}
                          <button
                            onClick={() => requestStatusChange(slot, 'scheduled')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Annuler</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center italic">
              Aucune séance prévue le {formatShortFR(dayViewDate)}.
            </p>
          )}
        </div>
      )}

      {/* 2. SIMPLE WEEKLY AGENDA */}
      {viewMode === 'agenda' && (
        <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[920px] text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-surface-elevated/70 border-b border-border-subtle">
                  <th className="py-3 px-3 text-left font-semibold text-slate-500 w-20 border-r border-border-subtle">
                    Heure
                  </th>
                  {weekDays.map((wd) => (
                    <th
                      key={wd.iso}
                      className={`py-2.5 px-2 text-center border-r border-border-subtle last:border-r-0 ${
                        wd.isToday ? 'bg-sky-50/70 dark:bg-sky-950/30' : ''
                      }`}
                    >
                      <div className="font-bold text-slate-900 dark:text-white">{wd.label}</div>
                      <div className="text-[11px] font-mono text-slate-500">{wd.shortDate}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {hourRows.map((row) => (
                  <tr
                    key={row.time}
                    className={
                      row.isLunch
                        ? 'bg-slate-100/70 dark:bg-slate-900/40'
                        : row.isLibre
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                        : ''
                    }
                  >
                    <td className="py-2 px-3 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-r border-border-subtle align-top">
                      <div>{row.time}</div>
                      <div className="text-[10px] text-slate-400">{row.endTime}</div>
                    </td>

                    {row.isLunch ? (
                      <td
                        colSpan={weekDays.length}
                        className="py-2 text-center text-[11px] font-medium text-slate-400 italic"
                      >
                        Pause déjeuner ({settings.lunch_break_start} – {settings.lunch_break_end})
                      </td>
                    ) : (
                      weekDays.map((wd) => {
                        const cellKey = `${wd.iso}_${row.time}`;
                        const cellSlots = slotsByCell.get(cellKey) || [];
                        const isDropHere = dropTargetKey === cellKey;

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
                            className={`p-1.5 border-r border-border-subtle last:border-r-0 align-top min-h-[76px] w-[150px] group transition-colors ${
                              isDropHere ? 'bg-sky-100/70 dark:bg-sky-900/40 ring-2 ring-inset ring-sky-500' : ''
                            }`}
                          >
                            <div className="space-y-1.5">
                              {cellSlots.map((slot) => {
                                const disc = getDisciplineMeta(slot.type);
                                return (
                                  <div
                                    key={slot.id}
                                    draggable
                                    onDragStart={(e) => {
                                      setDraggedSlot(slot);
                                      e.dataTransfer.effectAllowed = 'move';
                                      e.dataTransfer.setData('text/plain', slot.id);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedSlot(null);
                                      setDropTargetKey(null);
                                    }}
                                    onClick={() => setActiveSlotId(slot.id)}
                                    className={`p-2 rounded-lg border border-l-4 text-[11px] space-y-1 transition cursor-pointer ${disc.borderLeftClass} ${
                                      slot.status === 'absent'
                                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300'
                                        : slot.status === 'cancelled'
                                        ? 'bg-slate-100/80 dark:bg-surface-elevated border-border-subtle opacity-60'
                                        : disc.cardClass
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-slate-900 dark:text-white truncate">
                                        {slot.student_name}
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border shrink-0 ${getCategoryBadgeClass(slot.category)}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${getCategoryDotClass(slot.category)}`} />
                                        <span>{slot.category}</span>
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${disc.pillClass}`}>
                                        {disc.label}
                                      </span>
                                      <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                                        {slot.instructor_name}
                                      </span>
                                    </div>

                                    {slot.status !== 'scheduled' && (
                                      <div className="pt-0.5">{statusBadge(slot.status)}</div>
                                    )}
                                  </div>
                                );
                              })}

                              <button
                                type="button"
                                onClick={() => openQuickAdd(wd.iso, row.time, row.endTime)}
                                className="w-full py-1 rounded-md border border-dashed border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-700 text-[10px] font-medium text-transparent group-hover:text-slate-400 hover:!text-blue-600 hover:!border-blue-400 transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Ajouter une séance sur ce créneau"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Ajouter</span>
                              </button>
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

      {/* 3. HISTORY VIEW */}
      {viewMode === 'history' && (
        <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 border-b border-border-subtle text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Candidat</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {historySlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold block">{slot.date}</span>
                      <span className="text-[11px] text-slate-400">{slot.time_start} – {slot.time_end}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/candidates/${slot.studentId}`} className="font-semibold hover:text-blue-600">
                        {slot.student_name}
                      </Link>
                      <span className="text-[10px] text-slate-400 block">Cat. {slot.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getDisciplineMeta(slot.type).pillClass}`}>
                        {getDisciplineMeta(slot.type).fullLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4">{statusBadge(slot.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => requestStatusChange(slot, 'scheduled')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[10px] font-semibold border border-border-subtle cursor-pointer inline-flex items-center gap-1"
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
                      Aucune séance clôturée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Clicked Card Actions */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-border-subtle shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getDisciplineMeta(activeSlot.type).pillClass}`}>
                    {getDisciplineMeta(activeSlot.type).fullLabel}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${getCategoryBadgeClass(activeSlot.category)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getCategoryDotClass(activeSlot.category)}`} />
                    <span>{activeSlot.category}</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                  {activeSlot.student_name}
                </h3>
                <p className="text-slate-500 font-mono mt-0.5">
                  {formatShortFR(activeSlot.date)} • {activeSlot.time_start} – {activeSlot.time_end}
                </p>
              </div>
              <button
                onClick={() => setActiveSlotId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-elevated cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moniteur assigné :
              </label>
              <select
                value={activeSlot.instructor_name}
                onChange={(e) => handleAssignMentor(activeSlot, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-semibold"
              >
                {!mentors.some((m) => m.name === activeSlot.instructor_name) && (
                  <option value={activeSlot.instructor_name}>{activeSlot.instructor_name}</option>
                )}
                {mentors
                  .filter((m) => isMentorEligibleForSlot(m, activeSlot.type, activeSlot.category))
                  .map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => {
                  requestStatusChange(activeSlot, 'completed');
                  setActiveSlotId(null);
                }}
                className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                Présent
              </button>
              <button
                onClick={() => {
                  const s = activeSlot;
                  setActiveSlotId(null);
                  requestStatusChange(s, 'absent');
                }}
                className="py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold cursor-pointer"
              >
                Absent
              </button>
              <button
                onClick={() => {
                  const s = activeSlot;
                  setActiveSlotId(null);
                  requestStatusChange(s, 'cancelled');
                }}
                className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated text-slate-700 dark:text-slate-200 border border-border-subtle font-semibold cursor-pointer"
              >
                Annulé
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <Link
                href={`/candidates/${activeSlot.studentId}`}
                className="text-blue-600 font-semibold hover:underline"
              >
                Ouvrir le dossier candidat →
              </Link>
              {isOwner && (
                <button
                  onClick={() => {
                    deleteScheduleSlot(activeSlot.studentId, activeSlot.id);
                    setActiveSlotId(null);
                    setNotice({ type: 'success', text: 'Séance supprimée.' });
                  }}
                  className="text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirmation before Absent (paid) or Cancelled (free) */}
      {pendingResolution && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-border-subtle shadow-2xl p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {pendingResolution.action === 'absent'
                ? `Marquer ${pendingResolution.slot.student_name} absent ?`
                : `Annuler la séance de ${pendingResolution.slot.student_name} ?`}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {pendingResolution.action === 'absent'
                ? 'Le système va compter cette heure comme absente et ajouter automatiquement 1h de rattrapage payante au prochain créneau libre.'
                : 'Annulation par l’auto-école : le système va ajouter automatiquement 1h gratuite (0 DZD) au prochain créneau libre.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingResolution(null)}
                className="px-3.5 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-semibold cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  executeStatusChange(pendingResolution.slot, pendingResolution.action);
                  setPendingResolution(null);
                }}
                className={`px-3.5 py-2 rounded-xl font-semibold text-white cursor-pointer ${
                  pendingResolution.action === 'absent'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Add 1h Session */}
      {quickAddCell && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickAddSubmit}
            className="bg-surface rounded-2xl w-full max-w-md border border-border-subtle shadow-2xl p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ajouter une séance (1h)
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {formatShortFR(quickAddCell.date)} • {quickAddCell.timeStart} – {quickAddCell.timeEnd}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddCell(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold mb-1">1. Candidat</label>
              <select
                required
                value={quickAddStudentId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setQuickAddStudentId(nextId);
                  const st = students.find((s) => s.id === nextId);
                  if (st) {
                    const elig = mentors.filter((m) => isMentorEligibleForSlot(m, quickAddType, st.requested_category));
                    setQuickAddMentor(elig[0]?.name || '');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-semibold"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.first_name} {st.last_name} (Cat. {st.requested_category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">2. Discipline</label>
              <div className="grid grid-cols-3 gap-2">
                {(['code', 'creneau', 'circulation'] as SessionDiscipline[]).map((t) => {
                  const meta = getDisciplineMeta(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setQuickAddType(t);
                        if (quickAddSelectedStudent) {
                          const elig = mentors.filter((m) =>
                            isMentorEligibleForSlot(m, t, quickAddSelectedStudent.requested_category)
                          );
                          setQuickAddMentor(elig[0]?.name || '');
                        }
                      }}
                      className={`py-2 rounded-xl border font-bold cursor-pointer transition ${
                        quickAddType === t
                          ? `${meta.pillClass} border-transparent`
                          : 'bg-slate-50 dark:bg-surface-elevated border-border-subtle text-slate-600'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">3. Moniteur</label>
              <select
                required
                value={quickAddMentor}
                onChange={(e) => setQuickAddMentor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-semibold"
              >
                {quickAddEligibleMentors.length === 0 && (
                  <option value="">Aucun moniteur habilité</option>
                )}
                {quickAddEligibleMentors.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickAddCell(null)}
                className="px-4 py-2 rounded-xl border border-border-subtle bg-slate-50 font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!quickAddStudentId || !quickAddMentor}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold cursor-pointer"
              >
                Ajouter la séance
              </button>
            </div>
          </form>
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
