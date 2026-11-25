'use client';

import React from 'react';
import { LicenseCategory, Student } from '@/types/kreno';

interface ProgressCardPrintProps {
  student: Student;
}

const TARGET_CATEGORIES: { code: LicenseCategory; label: string }[] = [
  { code: 'A1', label: 'أ1' },
  { code: 'A', label: 'أ' },
  { code: 'B', label: 'ب' },
  { code: 'BE', label: 'ب(هـ)' },
  { code: 'C1', label: 'ج1' },
  { code: 'C1E', label: 'ج1(هـ)' },
  { code: 'C', label: 'ج' },
  { code: 'CE', label: 'ج(هـ)' },
  { code: 'D', label: 'د' },
  { code: 'DE', label: 'د(هـ)' },
];

const THEORY_CATEGORIES = ['أ1', 'أ', 'ب', 'و', 'ج1', 'ج', 'د'];
const PRACTICAL_ROW_1 = ['أ', 'ب', 'ب(هـ)', 'و', 'ج1'];
const PRACTICAL_ROW_2 = ['ج1(هـ)', 'ج', 'ج(هـ)', 'د', 'د(هـ)'];

function formatDate(iso?: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

function getRegDigits(reg?: string): string[] {
  const digits = (reg || '').replace(/\s+/g, '').slice(0, 10).split('');
  while (digits.length < 10) digits.push('');
  return digits;
}

/**
 * Exact A5 Recto-Verso replica of the official Algerian Candidate Progress Card:
 * "بطاقة مدى تقدم المترشح (المتابعة والمراقبة)"
 * Page 1 (Recto) & Page 2 (Verso) at 148mm x 210mm.
 */
export function ProgressCardPrint({ student }: ProgressCardPrintProps) {
  const fullName =
    student.first_name_ar || student.last_name_ar
      ? `${student.last_name_ar || ''} ${student.first_name_ar || ''}`.trim()
      : `${student.last_name} ${student.first_name}`;

  const birthInfo = [formatDate(student.birth_date), student.birth_commune]
    .filter(Boolean)
    .join(' - ');

  const addressInfo = [
    student.address_details,
    student.address_commune,
    student.address_wilaya,
  ]
    .filter(Boolean)
    .join('، ');

  const regDigits = getRegDigits(student.registration_number);

  const codeExam = (student.exams || []).find((e) => e.exam_type === 'code' && e.result === 'passed');
  const creneauExam = (student.exams || []).find((e) => e.exam_type === 'creneau' && e.result === 'passed');
  const circExam = (student.exams || []).find((e) => e.exam_type === 'circulation' && e.result === 'passed');

  const recentPayments = (student.payments || []).slice(0, 2);
  const getHeld = (catCode: LicenseCategory) =>
    (student.held_licenses || []).find((l) => l.category === catCode);
  const primaryHeldNumber = (student.held_licenses || []).find((l) => l.license_number)?.license_number || '';

  // Completed training slots & instructors
  const allSlots = student.schedule_slots || [];
  const codeSlots = allSlots.filter((s) => s.type === 'code');
  const completedCodeSlots = codeSlots
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start));
  const theoryInstructor = codeSlots.find((s) => s.instructor_name)?.instructor_name || '';

  const practicalSlots = allSlots.filter((s) => s.type === 'creneau' || s.type === 'circulation');
  const completedCreneauSlots = practicalSlots.filter(
    (s) => s.type === 'creneau' && s.status === 'completed'
  );
  const completedCircSlots = practicalSlots.filter(
    (s) => s.type === 'circulation' && s.status === 'completed'
  );
  const completedPracticalSlots = [...completedCreneauSlots, ...completedCircSlots].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start)
  );
  const practicalInstructor = practicalSlots.find((s) => s.instructor_name)?.instructor_name || '';

  return (
    <div className="flex flex-col items-center gap-6 w-full" dir="rtl">
      {/* ================================================================= */}
      {/* PAGE 1 (RECTO): A5 Portrait (148mm x 210mm) - Standard 8mm margin */}
      {/* ================================================================= */}
      <div
        className="a4-page-sheet bg-white text-black border border-slate-300 shadow-2xl flex flex-col"
        style={{
          width: '148mm',
          height: '210mm',
          minHeight: '210mm',
          maxHeight: '210mm',
          boxSizing: 'border-box',
          padding: '8mm',
          fontFamily: '"Times New Roman", Times, "Amiri", "Traditional Arabic", serif, sans-serif',
        }}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between mb-1">
          <span className="text-[9px] font-bold pt-0.5 shrink-0">
            ختم مدرسة تعليم السياقة
          </span>
          <h1 className="text-[13px] font-bold text-center flex-1 pl-12">
            بطاقة مدى تقدم المترشح (المتابعة والمراقبة)
          </h1>
        </div>

        {/* Candidate Identity Box + Rounded Photo Placeholder */}
        <div className="border border-black p-1.5 flex items-stretch justify-between gap-2">
          <div className="flex-1 space-y-1 text-[9.5px] font-bold leading-tight">
            <div className="flex items-baseline gap-1">
              <span className="shrink-0">رقم التعريف الوطني :</span>
              <span className="flex-1 border-b border-dotted border-black font-mono text-[9px] px-1">
                {student.nin || ''}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="shrink-0">إسم ولقب المترشح :</span>
              <span className="flex-1 border-b border-dotted border-black text-[9.5px] px-1">
                {fullName}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="shrink-0">تاريخ ومكان الميلاد :</span>
              <span className="flex-1 border-b border-dotted border-black text-[9px] px-1">
                {birthInfo}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="shrink-0">العنوان :</span>
              <span className="flex-1 border-b border-dotted border-black text-[9px] px-1 truncate">
                {addressInfo}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="shrink-0">رقم الهاتف :</span>
              <span className="flex-1 border-b border-dotted border-black font-mono text-[9px] px-1" dir="ltr">
                {student.phone_number || ''}
              </span>
            </div>
          </div>

          <div className="w-[26mm] min-h-[25mm] border border-black rounded-xl shrink-0" />
        </div>

        {/* Target Category Strip (الصنف المستهدف) */}
        <table className="w-full border-collapse border border-black text-[8.5px] font-bold mt-1">
          <tbody>
            <tr>
              <td className="border border-black px-1.5 py-0.5 text-center w-[28mm]">
                الصنف المستهدف
              </td>
              {TARGET_CATEGORIES.map((cat) => {
                const isSelected = student.requested_category === cat.code;
                return (
                  <td
                    key={cat.code}
                    className="border border-black text-center py-0.5 relative"
                  >
                    <span
                      className={
                        isSelected
                          ? 'inline-flex items-center justify-center px-1 border border-black rounded-full font-bold'
                          : ''
                      }
                    >
                      {cat.label}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        {/* Registration Date & Registration Number */}
        <div className="grid grid-cols-[1fr_1.15fr] gap-2 mt-1 text-[8px] font-bold">
          <table className="w-full border-collapse border border-black">
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 text-center">
                  تاريخ التسجيل بالمندوبية الولائية للأمن في الطرق
                </td>
              </tr>
              <tr>
                <td className="border border-black h-[14px] text-center font-mono text-[8.5px]">
                  {formatDate(student.deposit_date)}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black">
            <tbody>
              <tr>
                <td colSpan={10} className="border border-black px-1 py-0.5 text-center">
                  رقم التسجيل
                </td>
              </tr>
              <tr>
                {regDigits.map((d, i) => (
                  <td
                    key={i}
                    className="border border-black h-[14px] text-center font-mono text-[8.5px]"
                  >
                    {d}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Trainer Name Line */}
        <div className="flex items-baseline gap-1 text-[9px] font-bold mt-1">
          <span className="shrink-0">لقب وإسم الممرن :</span>
          <span className="flex-1 border-b border-dotted border-black px-1 text-[9px]">
            {theoryInstructor}
          </span>
        </div>

        {/* Main 2-Column Section */}
        <div className="grid grid-cols-[1.65fr_1fr] gap-1.5 mt-1.5 flex-1 min-h-0">
          {/* Right Column: 20-Row Follow-up Table (table-fixed locks column widths) */}
          <table className="w-full h-full border-collapse border border-black text-[7.5px] table-fixed">
            <thead>
              <tr>
                <th colSpan={5} className="border border-black py-0.5 font-bold">
                  المتابعة
                </th>
              </tr>
              <tr className="font-bold leading-tight text-[6px]">
                <th className="border border-black px-0.5 py-0.5 w-[12mm]">التاريخ</th>
                <th className="border border-black px-0.5 py-0.5 w-[9.5mm]">
                  رقم الفصل (برنامج التكوين النظري)
                </th>
                <th className="border border-black px-0.5 py-0.5 text-[7.5px]">المواضيع المدرسة</th>
                <th className="border border-black px-0.5 py-0.5 w-[6.5mm]">المدة</th>
                <th className="border border-black px-0.5 py-0.5 w-[8.5mm]">إمضاء المترشح</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }).map((_, idx) => {
                const slot = completedCodeSlots[idx];
                return (
                  <tr key={idx} className="text-center h-[5mm] leading-none">
                    <td className="border border-black font-mono text-[5.5px] whitespace-nowrap overflow-hidden px-0.5 py-0 leading-none">
                      {slot ? formatDate(slot.date) : ''}
                    </td>
                    <td className="border border-black font-mono text-[6px] whitespace-nowrap overflow-hidden py-0 leading-none" />
                    <td className="border border-black text-right px-1 text-[6px] whitespace-normal break-words py-0 leading-[1.1]">
                      {slot ? slot.notes || 'التكوين النظري' : ''}
                    </td>
                    <td className="border border-black text-[6px] whitespace-nowrap overflow-hidden py-0 leading-none">
                      {slot ? '1 سا' : ''}
                    </td>
                    <td className="border border-black py-0" />
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Left Column: Tables stretch to fill height with zero empty gaps */}
          <div className="flex flex-col gap-1.5 h-full min-h-0">
            {/* Theoretical Training 1-Row Box */}
            <table className="w-full border-collapse border border-black text-[8px] font-bold text-center shrink-0">
              <tbody>
                <tr>
                  <td className="border border-black px-1 py-2 w-[13mm] leading-tight">
                    التكوين النظري
                  </td>
                  {THEORY_CATEGORIES.map((c) => (
                    <td key={c} className="border border-black py-2">
                      {c}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* Evaluation (المراقبة) - stretches */}
            <div className="flex-[1.3] min-h-0">
              <table className="w-full h-full border-collapse border border-black text-[8px] font-bold text-center">
                <thead>
                  <tr>
                    <th colSpan={4} className="border border-black py-0.5">
                      المراقبة
                    </th>
                  </tr>
                  <tr>
                    <th rowSpan={2} className="border border-black px-1 py-0.5 w-[17mm] leading-tight">
                      رقم الفصل (برنامج التكوين النظري)
                    </th>
                    <th colSpan={3} className="border border-black py-0.5">
                      مستوى التحصيل
                    </th>
                  </tr>
                  <tr className="text-[7.5px]">
                    <th className="border border-black py-0.5">مبتدئ</th>
                    <th className="border border-black py-0.5">متوسط</th>
                    <th className="border border-black py-0.5">متحكم</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <tr key={num}>
                      <td className="border border-black font-mono">{num}</td>
                      <td className="border border-black" />
                      <td className="border border-black" />
                      <td className="border border-black" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hourly Volume Summary - stretches */}
            <div className="flex-[0.75] min-h-0">
              <table className="w-full h-full border-collapse border border-black text-[8px] font-bold text-center">
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-0.5 w-[20mm] leading-tight">
                      رقم الفصل (برنامج التكوين النظري)
                    </td>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <td key={n} className="border border-black py-0.5 font-mono">
                        {n}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-0.5">الحجم الساعي</td>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <td key={n} className="border border-black" />
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-0.5">المجموع</td>
                    <td colSpan={5} className="border border-black font-mono text-[8px]">
                      {completedCodeSlots.length > 0 ? `${completedCodeSlots.length} سا` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Trainer Signature */}
            <p className="text-[9px] font-bold text-center pt-1 pb-2 shrink-0">
              إمضاء الممرن
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PAGE 2 (VERSO): A5 Portrait (148mm x 210mm) - Standard 8mm margin */}
      {/* ================================================================= */}
      <div
        className="a4-page-sheet bg-white text-black border border-slate-300 shadow-2xl flex flex-col"
        style={{
          width: '148mm',
          height: '210mm',
          minHeight: '210mm',
          maxHeight: '210mm',
          boxSizing: 'border-box',
          padding: '8mm',
          fontFamily: '"Times New Roman", Times, "Amiri", "Traditional Arabic", serif, sans-serif',
        }}
      >
        {/* Top Section: Existing License Table */}
        <div>
          <p className="text-[9.5px] font-bold text-center mb-1">
            إذا كان المترشح (ة) حائزا (ة) على رخصة سياقة
          </p>
          <table className="w-full border-collapse border border-black text-[7.5px] font-bold text-center">
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 w-[24mm]">الأصناف</td>
                {TARGET_CATEGORIES.map((c) => (
                  <td key={`v-${c.code}`} className="border border-black py-0.5">
                    {c.label}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5">رقم رخصة السياقة</td>
                <td colSpan={10} className="border border-black h-[13px] font-mono text-[7.5px]">
                  {primaryHeldNumber}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 leading-tight">
                  متحصل على الصنف بتاريخ
                </td>
                {TARGET_CATEGORIES.map((c) => (
                  <td key={`obt-${c.code}`} className="border border-black h-[14px] font-mono text-[5.5px]">
                    {getHeld(c.code) ? formatDate(getHeld(c.code)?.obtained_date) : ''}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 leading-tight">
                  تاريخ نهاية صلاحية الصنف
                </td>
                {TARGET_CATEGORIES.map((c) => (
                  <td key={`exp-${c.code}`} className="border border-black h-[14px] font-mono text-[5.5px]">
                    {getHeld(c.code)?.expiry_date ? formatDate(getHeld(c.code)?.expiry_date) : ''}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Trainer & Vehicle Registration Line */}
        <div className="flex items-baseline gap-2 text-[8.5px] font-bold mt-1">
          <div className="flex items-baseline gap-1 flex-1">
            <span className="shrink-0">لقب وإسم الممرن :</span>
            <span className="flex-1 border-b border-dotted border-black px-1 text-[8.5px]">
              {practicalInstructor}
            </span>
          </div>
          <div className="flex items-baseline gap-1 flex-1">
            <span className="shrink-0">رقم تسجيل المركبة :</span>
            <span className="flex-1 border-b border-dotted border-black" />
          </div>
        </div>

        {/* Main 2-Column Section */}
        <div className="grid grid-cols-[1.65fr_1fr] gap-1.5 mt-1.5 flex-1 min-h-0">
          {/* Right Column: 20-Row Practical Follow-up Table (table-fixed locks column widths) */}
          <table className="w-full h-full border-collapse border border-black text-[7.5px] table-fixed">
            <thead>
              <tr>
                <th colSpan={5} className="border border-black py-0.5 font-bold">
                  المتابعة
                </th>
              </tr>
              <tr className="font-bold leading-tight text-[6px]">
                <th className="border border-black px-0.5 py-0.5 w-[12mm]">التاريخ</th>
                <th className="border border-black px-0.5 py-0.5 w-[9.5mm]">
                  رقم الفصل (برنامج التكوين التطبيقي)
                </th>
                <th className="border border-black px-0.5 py-0.5 text-[7.5px]">المواضيع المدرسة</th>
                <th className="border border-black px-0.5 py-0.5 w-[6.5mm]">المدة</th>
                <th className="border border-black px-0.5 py-0.5 w-[8.5mm]">إمضاء المترشح</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }).map((_, idx) => {
                const slot = completedPracticalSlots[idx];
                const chapter = slot ? (slot.type === 'creneau' ? '1' : '2') : '';
                const topic = slot
                  ? slot.notes || (slot.type === 'creneau' ? 'المناورات' : 'السياقة')
                  : '';
                return (
                  <tr key={idx} className="text-center h-[4.8mm] leading-none">
                    <td className="border border-black font-mono text-[5.5px] whitespace-nowrap overflow-hidden px-0.5 py-0 leading-none">
                      {slot ? formatDate(slot.date) : ''}
                    </td>
                    <td className="border border-black font-mono text-[6px] whitespace-nowrap overflow-hidden py-0 leading-none">
                      {chapter}
                    </td>
                    <td className="border border-black text-right px-1 text-[6px] whitespace-normal break-words py-0 leading-[1.1]">
                      {topic}
                    </td>
                    <td className="border border-black text-[6px] whitespace-nowrap overflow-hidden py-0 leading-none">
                      {slot ? '1 سا' : ''}
                    </td>
                    <td className="border border-black py-0" />
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Left Column: Tables stretch to fill height with zero empty gaps */}
          <div className="flex flex-col gap-1.5 h-full min-h-0">
            {/* Practical Training Grid */}
            <div className="flex-[0.55] min-h-0">
              <table className="w-full h-full border-collapse border border-black text-[8px] font-bold text-center">
                <tbody>
                  <tr>
                    <td rowSpan={2} className="border border-black px-1 py-0.5 w-[13mm] leading-tight">
                      التكوين التطبيقي
                    </td>
                    {PRACTICAL_ROW_1.map((c) => (
                      <td key={c} className="border border-black py-1">
                        {c}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {PRACTICAL_ROW_2.map((c) => (
                      <td key={c} className="border border-black py-1">
                        {c}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Evaluation (المراقبة) - stretches */}
            <div className="flex-[1.2] min-h-0">
              <table className="w-full h-full border-collapse border border-black text-[8px] font-bold text-center">
                <thead>
                  <tr>
                    <th colSpan={4} className="border border-black py-0.5">
                      المراقبة
                    </th>
                  </tr>
                  <tr>
                    <th rowSpan={2} className="border border-black px-1 py-0.5 w-[17mm] leading-tight">
                      رقم الفصل (برنامج التكوين التطبيقي)
                    </th>
                    <th colSpan={3} className="border border-black py-0.5">
                      مستوى التحصيل
                    </th>
                  </tr>
                  <tr className="text-[7.5px]">
                    <th className="border border-black py-0.5">مبتدئ</th>
                    <th className="border border-black py-0.5">متوسط</th>
                    <th className="border border-black py-0.5">متحكم</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2].map((num) => (
                    <tr key={num}>
                      <td className="border border-black font-mono">{num}</td>
                      <td className="border border-black" />
                      <td className="border border-black" />
                      <td className="border border-black" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Practical Hourly Volume - stretches */}
            <div className="flex-[0.85] min-h-0">
              <table className="w-full h-full border-collapse border border-black text-[8px] font-bold text-center">
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-0.5 w-[22mm] leading-tight">
                      رقم الفصل (برنامج التكوين التطبيقي)
                    </td>
                    <td className="border border-black py-0.5 font-mono">1</td>
                    <td className="border border-black py-0.5 font-mono">2</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-0.5">الحجم الساعي</td>
                    <td className="border border-black font-mono text-[8px]">
                      {completedCreneauSlots.length > 0 ? `${completedCreneauSlots.length} سا` : ''}
                    </td>
                    <td className="border border-black font-mono text-[8px]">
                      {completedCircSlots.length > 0 ? `${completedCircSlots.length} سا` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-0.5">المجموع</td>
                    <td colSpan={2} className="border border-black font-mono text-[8px]">
                      {completedPracticalSlots.length > 0 ? `${completedPracticalSlots.length} سا` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Trainer Signature */}
            <p className="text-[9px] font-bold text-center py-1 shrink-0">
              إمضاء الممرن
            </p>
          </div>
        </div>

        {/* Bottom Section: Exam Results & File Payments */}
        <div className="grid grid-cols-[1.35fr_1fr] gap-2 mt-1.5 text-[8px] font-bold text-center">
          {/* Exam Path */}
          <table className="w-full border-collapse border border-black table-fixed">
            <thead>
              <tr>
                <th colSpan={3} className="border border-black py-0.5">
                  مسار النجاح في الامتحانات
                </th>
              </tr>
              <tr>
                <th className="border border-black py-0.5 w-[16mm]">الإمتحان</th>
                <th className="border border-black py-0.5">الممتحن</th>
                <th className="border border-black py-0.5 w-[18mm]">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-0.5">ق م</td>
                <td className="border border-black text-[7px] truncate px-1">{codeExam?.examiner_name || ''}</td>
                <td className="border border-black font-mono text-[7px] whitespace-nowrap">{formatDate(codeExam?.exam_date)}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5">المناورات</td>
                <td className="border border-black text-[7px] truncate px-1">{creneauExam?.examiner_name || ''}</td>
                <td className="border border-black font-mono text-[7px] whitespace-nowrap">{formatDate(creneauExam?.exam_date)}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5">السياقة</td>
                <td className="border border-black text-[7px] truncate px-1">{circExam?.examiner_name || ''}</td>
                <td className="border border-black font-mono text-[7px] whitespace-nowrap">{formatDate(circExam?.exam_date)}</td>
              </tr>
            </tbody>
          </table>

          {/* File Dues / Payments (2 rows matching photo) */}
          <table className="w-full border-collapse border border-black table-fixed">
            <thead>
              <tr>
                <th colSpan={2} className="border border-black py-0.5">
                  مستحقات الملف
                </th>
              </tr>
              <tr>
                <th className="border border-black py-0.5">التاريخ</th>
                <th className="border border-black py-0.5">المبلغ المدفوع</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((idx) => {
                const p = recentPayments[idx];
                return (
                  <tr key={idx}>
                    <td className="border border-black h-[19px] font-mono text-[7.5px]">
                      {p ? formatDate(p.date) : ''}
                    </td>
                    <td className="border border-black font-mono text-[7.5px]">
                      {p ? `${p.amount.toLocaleString()} دج` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
