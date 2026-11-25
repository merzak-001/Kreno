'use client';

import React, { useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string; // ISO YYYY-MM-DD or ''
  onChange: (isoDate: string) => void;
  required?: boolean;
  className?: string;
  title?: string;
  placeholder?: string;
}

interface DateParts {
  dd: string;
  mm: string;
  yyyy: string;
}

function splitIso(iso: string): DateParts {
  if (!iso) return { dd: '', mm: '', yyyy: '' };
  const parts = iso.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return { dd: parts[2], mm: parts[1], yyyy: parts[0] };
  }
  return { dd: '', mm: '', yyyy: '' };
}

function getDaysInMonth(month: number, year?: number): number {
  if (month === 2) {
    if (!year) return 29;
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isValidCalendarDate(day: number, month: number, year: number): boolean {
  if (year < 1900 || year > 2099 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  return day <= getDaysInMonth(month, year);
}

/**
 * Segmented jj / mm / aaaa date input with visible placeholders, auto-tabbing,
 * real-time rejection of invalid day/month/year numbers, strict 4-digit year cap,
 * and a calendar popup trigger. Always emits and accepts ISO YYYY-MM-DD strings.
 */
export function DateInput({
  value,
  onChange,
  required = false,
  className = '',
  title,
}: DateInputProps) {
  const [draft, setDraft] = useState<DateParts | null>(null);
  const ddRef = useRef<HTMLInputElement | null>(null);
  const mmRef = useRef<HTMLInputElement | null>(null);
  const yyyyRef = useRef<HTMLInputElement | null>(null);
  const nativePickerRef = useRef<HTMLInputElement | null>(null);

  const active = draft ?? splitIso(value);

  const commitIfComplete = (next: DateParts) => {
    if (!next.dd && !next.mm && !next.yyyy) {
      onChange('');
      setDraft(null);
      return;
    }
    if (next.dd.length === 2 && next.mm.length === 2 && next.yyyy.length === 4) {
      const d = Number(next.dd);
      const m = Number(next.mm);
      const y = Number(next.yyyy);
      if (isValidCalendarDate(d, m, y)) {
        onChange(`${next.yyyy}-${next.mm}-${next.dd}`);
        setDraft(null);
      }
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let dd = e.target.value.replace(/\D/g, '').slice(0, 2);

    if (dd.length === 1 && Number(dd) > 3) {
      dd = `0${dd}`;
    }
    if (dd.length === 2) {
      const dNum = Number(dd);
      const mNum = active.mm.length === 2 ? Number(active.mm) : 0;
      const yNum = active.yyyy.length === 4 ? Number(active.yyyy) : undefined;
      const maxDay = mNum ? getDaysInMonth(mNum, yNum) : 31;
      if (dNum < 1 || dNum > maxDay) return;
    }

    const next = { ...active, dd };
    setDraft(next);
    if (dd.length === 2) mmRef.current?.focus();
    commitIfComplete(next);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let mm = e.target.value.replace(/\D/g, '').slice(0, 2);

    if (mm.length === 1 && Number(mm) > 1) {
      mm = `0${mm}`;
    }
    if (mm.length === 2) {
      const mNum = Number(mm);
      if (mNum < 1 || mNum > 12) return;
      if (active.dd.length === 2) {
        const yNum = active.yyyy.length === 4 ? Number(active.yyyy) : undefined;
        if (Number(active.dd) > getDaysInMonth(mNum, yNum)) return;
      }
    }

    const next = { ...active, mm };
    setDraft(next);
    if (mm.length === 2) yyyyRef.current?.focus();
    commitIfComplete(next);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const yyyy = e.target.value.replace(/\D/g, '').slice(0, 4);

    if (yyyy.length === 1 && yyyy !== '1' && yyyy !== '2') return;
    if (yyyy.length === 2 && yyyy !== '19' && yyyy !== '20') return;
    if (yyyy.length === 4) {
      const yNum = Number(yyyy);
      if (yNum < 1900 || yNum > 2099) return;
      if (active.dd.length === 2 && active.mm.length === 2) {
        if (!isValidCalendarDate(Number(active.dd), Number(active.mm), yNum)) return;
      }
    }

    const next = { ...active, yyyy };
    setDraft(next);
    commitIfComplete(next);
  };

  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDraft(null);
    }
  };

  const openNativePicker = () => {
    const el = nativePickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
    } else {
      el.click();
    }
  };

  return (
    <div
      onBlur={handleContainerBlur}
      title={title}
      className={`${className} flex items-center justify-between gap-1 font-mono`}
    >
      <div className="flex items-center gap-0.5 min-w-0">
        <input
          ref={ddRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          required={required}
          value={active.dd}
          onChange={handleDayChange}
          placeholder="jj"
          aria-label="Jour"
          className="w-[2.4ch] bg-transparent text-center focus:outline-none placeholder:text-slate-400"
        />
        <span className="text-slate-400 select-none">/</span>
        <input
          ref={mmRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          required={required}
          value={active.mm}
          onChange={handleMonthChange}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !active.mm) ddRef.current?.focus();
          }}
          placeholder="mm"
          aria-label="Mois"
          className="w-[2.6ch] bg-transparent text-center focus:outline-none placeholder:text-slate-400"
        />
        <span className="text-slate-400 select-none">/</span>
        <input
          ref={yyyyRef}
          type="text"
          inputMode="numeric"
          maxLength={4}
          required={required}
          value={active.yyyy}
          onChange={handleYearChange}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !active.yyyy) mmRef.current?.focus();
          }}
          placeholder="aaaa"
          aria-label="Année"
          className="w-[4.6ch] bg-transparent text-center focus:outline-none placeholder:text-slate-400"
        />
      </div>

      <button
        type="button"
        onClick={openNativePicker}
        tabIndex={-1}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 shrink-0"
        title="Ouvrir le calendrier"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>

      <input
        ref={nativePickerRef}
        type="date"
        min="1900-01-01"
        max="2099-12-31"
        value={value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''}
        onChange={(e) => {
          setDraft(null);
          onChange(e.target.value);
        }}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
      />
    </div>
  );
}
