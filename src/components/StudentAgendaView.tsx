'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { DayOfWeek, ScheduleSlot, Student } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { DateInput } from '@/components/DateInput';

interface StudentAgendaViewProps {
  student: Student;
  slots: ScheduleSlot[];
}

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

/**
 * Wide per-candidate Weekly Time-Grid Agenda with Drag & Drop rescheduling,
 * 1-click status controls (Effectuée / Absent / Annulée / Planifiée),
 * and visual markers for the candidate's preferred available days.
 */
export function StudentAgendaView({ student, slots }: StudentAgendaViewProps) {
  const { settings, updateScheduleSlot } = useKreno();
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  // Anchor to the first scheduled slot's date if available, otherwise today
  const initialAnchor = useMemo(() => {
    const firstScheduled = slots.find((s) => s.status === 'scheduled');
    return firstScheduled?.date || slots[0]?.date || todayIso;
  }, [slots, todayIso]);

  const [anchorDate, setAnchorDate] = useState<string>(initialAnchor);
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const availableDays = useMemo(
    () => student.availability?.days || [],
    [student.availability?.days]
  );

  const weekDays = useMemo(() => {
    const anchor = anchorDate ? new Date(anchorDate) : new Date();
    const startSat = getStartOfAlgerianWeek(Number.isNaN(anchor.getTime()) ? new Date() : anchor);
    const workingDays =
      settings.working_days.length > 0
        ? settings.working_days
        : (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as DayOfWeek[]);

    return workingDays.map((day) => {
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
        isAvailable: availableDays.length === 0 || availableDays.includes(day),
      };
    });
  }, [settings.working_days, anchorDate, todayIso, availableDays]);

  const hourRows = useMemo(() => {
    const startH = parseInt((settings.start_hour || '08:00').split(':')[0], 10);
    const endH = parseInt((settings.end_hour || '17:00').split(':')[0], 10);
    const lunchStart = settings.lunch_break_start || '12:00';
    const lunchEnd = settings.lunch_break_end || '13:00';

    const rows: { time: string; endTime: string; isLunch: boolean }[] = [];
    for (let h = startH; h < endH; h++) {
      const time = `${String(h).padStart(2, '0')}:00`;
      const endTime = `${String(h + 1).padStart(2, '0')}:00`;
      rows.push({ time, endTime, isLunch: time >= lunchStart && time < lunchEnd });
    }
    return rows;
  }, [settings.start_hour, settings.end_hour, settings.lunch_break_start, settings.lunch_break_end]);

  const slotsByCell = useMemo(() => {
    const map = new Map<string, ScheduleSlot[]>();
    slots.forEach((slot) => {
      const key = `${slot.date}_${slot.time_start}`;
      const list = map.get(key) || [];
      list.push(slot);
      map.set(key, list);
    });
    return map;
  }, [slots]);

  const shiftWeek = (deltaWeeks: number) => {
    const anchor = anchorDate ? new Date(anchorDate) : new Date();
    anchor.setDate(anchor.getDate() + deltaWeeks * 7);
    setAnchorDate(toIsoDate(anchor));
  };

  const weekSlotCount = useMemo(() => {
    const isoSet = new Set(weekDays.map((w) => w.iso));
    return slots.filter((s) => isoSet.has(s.date)).length;
  }, [slots, weekDays]);

  const jumpToFirstSession = () => {
    const target = slots.find((s) => s.status === 'scheduled') || slots[0];
    if (target?.date) setAnchorDate(target.date);
  };

  const handleDropOnCell = (targetIso: string, targetTime: string, targetEndTime: string) => {
    if (!draggedSlot) return;
    if (draggedSlot.date !== targetIso || draggedSlot.time_start !== targetTime) {
      updateScheduleSlot(student.id, draggedSlot.id, {
        date: targetIso,
        time_start: targetTime,
        time_end: targetEndTime,
      });
    }
    setDraggedSlot(null);
    setDropTargetKey(null);
  };

  return (
    <div className="space-y-3">
      {/* Week Controls & Availability Badges */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-medium">Jours disponibles :</span>
          {availableDays.length > 0 ? (
            availableDays.map((d) => (
              <span
                key={d}
                className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium text-[11px]"
              >
                {DAY_LABELS[d]}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-[11px]">Tous les jours ouvrables</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-surface-elevated font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">
            {weekSlotCount}h cette semaine / {slots.length}h total
          </span>
          {weekSlotCount === 0 && slots.length > 0 && (
            <button
              type="button"
              onClick={jumpToFirstSession}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition cursor-pointer"
            >
              Aller aux séances
            </button>
          )}
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Semaine précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate(todayIso)}
            className="px-3 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition cursor-pointer"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="p-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Semaine suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-40">
            <DateInput
              value={anchorDate}
              onChange={(val) => val && setAnchorDate(val)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Wide Weekly Grid */}
      <div className="border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-surface-elevated/70 border-b border-border-subtle">
                <th className="p-2.5 w-20 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-r border-border-subtle">
                  Heure
                </th>
                {weekDays.map((wd) => (
                  <th
                    key={wd.iso}
                    className={`p-2.5 text-center border-r border-border-subtle last:border-r-0 ${
                      wd.isToday ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`font-semibold ${wd.isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                        {wd.label}
                      </span>
                      {wd.isAvailable && availableDays.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Jour disponible" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{wd.shortDate}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {hourRows.map((row) => (
                <tr key={row.time} className={row.isLunch ? 'bg-slate-100/70 dark:bg-slate-900/40' : ''}>
                  <td className="p-2 font-mono text-[11px] font-semibold text-slate-500 border-r border-border-subtle align-top">
                    <div>{row.time}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{row.endTime}</div>
                  </td>

                  {row.isLunch ? (
                    <td colSpan={weekDays.length} className="p-2 text-center text-[11px] text-slate-400 italic">
                      Pause déjeuner ({settings.lunch_break_start} – {settings.lunch_break_end})
                    </td>
                  ) : (
                    weekDays.map((wd) => {
                      const cellKey = `${wd.iso}_${row.time}`;
                      const cellSlots = slotsByCell.get(cellKey) || [];
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
                          className={`p-1.5 border-r border-border-subtle last:border-r-0 align-top min-w-[120px] min-h-[54px] transition-colors ${
                            isDropTarget
                              ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-2 ring-inset ring-blue-500'
                              : !wd.isAvailable
                              ? 'bg-slate-50/60 dark:bg-slate-900/20'
                              : wd.isToday
                              ? 'bg-blue-50/20 dark:bg-blue-950/10'
                              : ''
                          }`}
                        >
                          <div className="space-y-1">
                            {cellSlots.map((slot) => (
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
                                className={`p-2 rounded-lg border text-[11px] space-y-1 transition cursor-grab active:cursor-grabbing ${
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
                                  <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                                    <GripVertical className="w-3 h-3 text-slate-300 shrink-0" />
                                    <span>
                                      {slot.type === 'code' ? 'Code' : slot.type === 'creneau' ? 'Créneau' : 'Route'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">1h</span>
                                </div>

                                <div className="flex items-center justify-end gap-1 pt-0.5">
                                  {slot.status === 'scheduled' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => updateScheduleSlot(student.id, slot.id, { status: 'completed' })}
                                        className="px-1.5 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-200 cursor-pointer text-[10px]"
                                        title="Marquer Effectuée"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateScheduleSlot(student.id, slot.id, { status: 'absent' })}
                                        className="px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-200 cursor-pointer text-[10px]"
                                        title="Marquer Absent"
                                      >
                                        Abs
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateScheduleSlot(student.id, slot.id, { status: 'cancelled' })}
                                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 cursor-pointer text-[10px]"
                                        title="Annuler"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => updateScheduleSlot(student.id, slot.id, { status: 'scheduled' })}
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
    </div>
  );
}
