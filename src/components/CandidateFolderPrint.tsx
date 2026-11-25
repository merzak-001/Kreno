'use client';

import React from 'react';
import { School, Student } from '@/types/kreno';

interface CandidateFolderPrintProps {
  student: Student;
  school: School;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

function ExamAttemptRows({ count }: { count: number }) {
  return (
    <div className="flex flex-col flex-1 border border-black divide-y divide-black">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-[24mm_1fr_54mm] flex-1 min-h-0 text-[8.5px]">
          {/* Right cell: Stamp */}
          <div className="border-l border-black flex flex-col items-center justify-center text-center font-bold px-1 leading-snug">
            <span>ألصق الطابع هنا</span>
            <span>وأشطب عليه</span>
          </div>

          {/* Middle cell: Inspector, Date, Center, Category, Absence */}
          <div className="border-l border-black px-2 py-1 flex flex-col justify-between leading-tight">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">لقب و إسم المفتش:</span>
                <span className="flex-1 border-b border-dotted border-black" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="flex items-baseline gap-1 flex-1">
                  <span className="font-bold shrink-0">تاريخ الامتحان:</span>
                  <span className="flex-1 border-b border-dotted border-black" />
                </div>
                <span className="font-bold text-[8px] shrink-0">توقيع وختم المفتش</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="flex items-baseline gap-1 flex-[1.3]">
                  <span className="font-bold shrink-0">مركز الامتحان:</span>
                  <span className="flex-1 border-b border-dotted border-black" />
                </div>
                <div className="flex items-baseline gap-1 flex-[0.7]">
                  <span className="font-bold shrink-0">الصنف:</span>
                  <span className="flex-1 border-b border-dotted border-black" />
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold shrink-0">المترشح غائب: مبرر / غير مبرر :</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
          </div>

          {/* Left cell: Theory, Maneuvers, Driving, Notes */}
          <div className="px-2 py-1 flex flex-col justify-between leading-tight text-[8.5px]">
            <div className="flex items-baseline gap-1">
              <span className="font-bold shrink-0">امتحان نظري:</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold shrink-0">امتحان مناورات:</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold shrink-0">امتحان سياقة:</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold shrink-0">ملاحظات:</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Official Algerian 4-Page A4 Candidate Folder imposed on 2 A3 Landscape sheets (420mm x 297mm) Recto-Verso.
 * Arabic/RTL Booklet Imposition:
 * - A3 Sheet 1 (Recto / Outside): Left = Page 1 (Front Cover, pre-filled), Right = Page 4 (Back Cover)
 * - A3 Sheet 2 (Verso / Inside): Left = Page 3 (Exams 1-8), Right = Page 2 (Declarations)
 */
export function CandidateFolderPrint({ student, school }: CandidateFolderPrintProps) {
  const isMale = student.gender === 'Homme';
  const isFemale = student.gender === 'Femme';
  const getHeld = (catCode: string) =>
    (student.held_licenses || []).find((l) => l.category === catCode);

  return (
    <div className="flex flex-col items-center gap-8 w-full" dir="rtl">
      {/* ===================================================================== */}
      {/* A3 SHEET 1 (RECTO / OUTSIDE): Page 4 (Right) + Page 1 (Left)          */}
      {/* ===================================================================== */}
      <div
        className="a4-page-sheet bg-white text-black border border-slate-300 shadow-2xl grid grid-cols-2"
        style={{
          width: '420mm',
          height: '297mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          boxSizing: 'border-box',
          fontFamily: '"Times New Roman", Times, "Amiri", "Traditional Arabic", serif, sans-serif',
        }}
      >
        {/* RIGHT HALF (in RTL): PAGE 4 (BACK COVER) */}
        <div
          className="h-full border-l border-dashed border-slate-300 flex flex-col justify-between"
          style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '10mm 12mm' }}
        >
          {/* Top File Number & Deposit Date */}
          <div className="space-y-1 text-[10.5px] font-bold mb-2">
            <div className="flex items-baseline gap-1 w-[75mm]">
              <span className="shrink-0">رقم الملف :</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
            <div className="flex items-baseline gap-1 w-[75mm]">
              <span className="shrink-0">تاريخ إيداع الملف :</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
          </div>

          {/* 7 Exam Attempt Rows (9-15) */}
          <ExamAttemptRows count={7} />

          {/* Bottom 15-Attempt Legal Note */}
          <div className="mt-2 pt-1 space-y-2 text-[9.5px] font-bold">
            <p className="text-center">
              إذا لم ينجح المترشح بعد 15 مرة يفقد الاختبار الذي نجح فيه ويتوقف عن التقدم لامتحان رخصة السياقة لمدة 12 شهرا.
            </p>
            <div className="border-b border-dotted border-black w-full pt-2" />
          </div>
        </div>

        {/* LEFT HALF (in RTL): PAGE 1 (FRONT COVER - PRE-FILLED) */}
        <div
          className="h-full flex flex-col justify-between"
          style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '9mm 12mm' }}
        >
          {/* Official Header */}
          <div className="text-center space-y-0.5">
            <h2 className="text-[14px] font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
            <h3 className="text-[12px] font-bold">وزارة الداخلية والجماعات المحلية والنقل</h3>
            <h4 className="text-[11px] font-bold">المندوبية الوطنية للأمن في الطرق</h4>
          </div>

          {/* Wilaya Delegation Line */}
          <div className="flex items-baseline gap-1.5 text-[11px] font-bold mt-1">
            <span className="shrink-0">المندوبية الولائية للأمن في الطرق لولاية:</span>
            <span className="flex-1 border-b border-dotted border-black px-2 text-center font-sans text-[11px]">
              {school.wilaya || ''}
            </span>
          </div>

          {/* Title + Requested Category + Photo Box */}
          <div className="flex items-start justify-between gap-4 mt-1">
            <div className="flex-1 text-center pt-2 space-y-1.5">
              <h1 className="text-[16px] font-bold underline underline-offset-4">
                استمارة الترشح لاجتياز امتحانات رخصة السياقة
              </h1>
              <div className="flex items-baseline justify-center gap-2 text-[12px] font-bold">
                <span>الصنف المطلوب:</span>
                <span className="border-b border-dotted border-black min-w-[45mm] px-2 font-sans text-[13px]">
                  {student.requested_category}
                </span>
              </div>
            </div>

            <div className="w-[28mm] h-[34mm] border border-black flex items-center justify-center text-[11px] font-bold shrink-0">
              الصورة
            </div>
          </div>

          {/* School Stamp Box + Deposit Date / File Number */}
          <div className="grid grid-cols-[1.2fr_1fr] gap-3 mt-1.5 items-stretch">
            <div className="border border-black p-2 flex flex-col justify-between text-center min-h-[26mm]">
              <span className="text-[10px] font-bold">ختم مدرسة تعليم السياقة</span>
              <span className="text-[8.5px] font-semibold">
                في حالة مترشح حر يوضع ختم المندوبية الولائية للأمن في الطرق
              </span>
            </div>

            <div className="flex flex-col justify-center gap-1.5 text-[10.5px] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-[26mm] shrink-0">تاريخ إيداع الملف</span>
                <div className="flex-1 border border-black h-[22px] flex items-center justify-center font-mono text-[10px]">
                  {formatDate(student.deposit_date)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-[26mm] shrink-0">رقم الملف</span>
                <div className="flex-1 border border-black h-[22px] flex items-center justify-center font-mono text-[10px]">
                  {student.dossier_number || ''}
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Information Section */}
          <div className="mt-2 space-y-1.5 text-[10.5px] font-bold">
            <h3 className="text-center text-[12px] font-bold underline underline-offset-4 mb-1.5">
              معلومات خاصة بالمترشح
            </h3>

            {/* NIN & Blood Type */}
            <div className="flex items-center gap-3">
              <span className="shrink-0">رقم التعريف الوطني</span>
              <div className="flex-1 border border-black h-[22px] flex items-center px-2 font-mono text-[10.5px] tracking-wider">
                {student.nin || ''}
              </div>
              <span className="shrink-0">فصيلة الدم</span>
              <div className="w-[18mm] border border-black h-[22px] flex items-center justify-center font-mono text-[10.5px]">
                {student.blood_type || ''}
              </div>
            </div>

            {/* Last Name (AR + FR) */}
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">اللقـــــب :</span>
              <span className="flex-1 border-b border-dotted border-black px-1">
                {student.last_name_ar || ''}
              </span>
              <span dir="ltr" className="shrink-0 font-sans text-[10px]">Nom :</span>
              <span dir="ltr" className="flex-1 border-b border-dotted border-black px-1 font-sans text-[10.5px] uppercase">
                {student.last_name || ''}
              </span>
            </div>

            {/* First Name (AR + FR) */}
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">الاســـــم :</span>
              <span className="flex-1 border-b border-dotted border-black px-1">
                {student.first_name_ar || ''}
              </span>
              <span dir="ltr" className="shrink-0 font-sans text-[10px]">Prénom :</span>
              <span dir="ltr" className="flex-1 border-b border-dotted border-black px-1 font-sans text-[10.5px]">
                {student.first_name || ''}
              </span>
            </div>

            {/* Gender */}
            <div className="flex items-center gap-6">
              <span className="shrink-0">الجنـــــس:</span>
              <div className="flex items-center gap-2">
                <span>ذكر</span>
                <span className="w-[24px] h-[20px] border border-black inline-flex items-center justify-center font-sans text-[11px]">
                  {isMale ? '✓' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>أنثى</span>
                <span className="w-[24px] h-[20px] border border-black inline-flex items-center justify-center font-sans text-[11px]">
                  {isFemale ? '✓' : ''}
                </span>
              </div>
            </div>

            {/* Birth Date & Place */}
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">تاريخ ومكان الميلاد :</span>
              <span className="w-[34mm] border-b border-dotted border-black text-center font-mono text-[10px]">
                {formatDate(student.birth_date)}
              </span>
              <span className="shrink-0">بلدية</span>
              <span className="flex-1 border-b border-dotted border-black px-1">
                {student.birth_commune || ''}
              </span>
              <span className="shrink-0">ولاية</span>
              <span className="flex-1 border-b border-dotted border-black px-1">
                {student.birth_wilaya || ''}
              </span>
            </div>

            {/* Father & Mother */}
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">إسم الأب :</span>
              <span className="flex-1 border-b border-dotted border-black px-1">
                {student.father_name || ''}
              </span>
              <span className="shrink-0">إسم ولقب الأم:</span>
              <span className="flex-[1.3] border-b border-dotted border-black px-1">
                {student.mother_full_name || ''}
              </span>
            </div>

            {/* Address */}
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">العنـــــوان :</span>
              <span className="flex-[1.4] border-b border-dotted border-black px-1">
                {student.address_details || ''}
              </span>
              <span className="shrink-0">بلدية</span>
              <span className="flex-1 border-b border-dotted border-black px-1">
                {student.address_commune || ''}
              </span>
              <span className="shrink-0">ولاية</span>
              <span className="flex-1 border-b border-dotted border-black px-1">
                {student.address_wilaya || ''}
              </span>
            </div>

            {/* Marital Status */}
            <div className="flex items-center gap-3">
              <span className="shrink-0">الحالة العائلية :</span>
              {[
                { key: 'Celibataire', label: 'أعزب/عزباء' },
                { key: 'Marie', label: 'متزوج(ة)' },
                { key: 'Divorce', label: 'مطلق(ة)' },
                { key: 'Veuf', label: 'أرمل(ة)' },
              ].map((st) => (
                <div key={st.key} className="flex items-center gap-1.5">
                  <span>{st.label}</span>
                  <span className="w-[20px] h-[18px] border border-black inline-flex items-center justify-center font-sans text-[10px]">
                    {student.marital_status === st.key ? '✓' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-[26mm]">رقم الهاتف</span>
              <div dir="ltr" className="flex-1 border border-black h-[21px] flex items-center px-2 font-mono text-[10.5px]">
                {student.phone_number || ''}
              </div>
            </div>

            {/* Nationality */}
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">الجنسية الأصلية :</span>
              <span className="flex-1 border-b border-dotted border-black px-1">الجزائرية</span>
              <span className="shrink-0">الجنسية المكتسبة :</span>
              <span className="flex-1 border-b border-dotted border-black px-1" />
            </div>

            {/* Born Abroad */}
            <div className="flex items-baseline gap-1.5 text-[9.5px]">
              <span className="shrink-0">بالنسبة للأشخاص المولودين بالخارج/ بلد الميلاد :</span>
              <span className="flex-1 border-b border-dotted border-black" />
              <span className="shrink-0">سفارة أو قنصلية التسجيل :</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>
          </div>

          {/* Previously Held Categories Table (Blank) */}
          <div className="mt-2">
            <h4 className="text-center text-[11px] font-bold underline underline-offset-2 mb-1">
              الأصناف المتحصل عليها من قبل
            </h4>
            <table className="w-full border-collapse border border-black text-[8.5px] font-bold text-center">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black py-0.5 w-[38mm]">هيئة الإصدار</th>
                  <th rowSpan={2} className="border border-black py-0.5 w-[28mm]">التاريخ</th>
                  <th rowSpan={2} className="border border-black py-0.5 w-[44mm]">الرقم</th>
                  <th colSpan={4} className="border border-black py-0.5">الصنف</th>
                </tr>
                <tr>
                  <th colSpan={2} className="border border-black py-0.5">الجديد</th>
                  <th colSpan={2} className="border border-black py-0.5">القديم</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['أ1', 'A1', 'أ1', 'A1'],
                  ['أ', 'A', 'أ2', 'A2'],
                  ['ب', 'B', 'ب', 'B'],
                  ['د', 'D', 'د', 'D'],
                  ['ج1', 'C1', 'ج1', 'C1'],
                  ['ج', 'C', 'ج2', 'C2'],
                ].map(([nAr, nFr, oAr, oFr], idx) => {
                  const held = getHeld(nFr);
                  return (
                    <tr key={idx} className="h-[15px]">
                      <td className="border border-black text-[8px] px-1 truncate">{held?.issuing_authority || ''}</td>
                      <td className="border border-black font-mono text-[8px]">{held ? formatDate(held.obtained_date) : ''}</td>
                      <td className="border border-black font-mono text-[8px]">{held?.license_number || ''}</td>
                      <td className="border border-black w-[11mm]">{nAr}</td>
                      <td className="border border-black w-[11mm] font-sans">{nFr}</td>
                      <td className="border border-black w-[11mm]">{oAr}</td>
                      <td className="border border-black w-[11mm] font-sans">{oFr}</td>
                    </tr>
                  );
                })}
                {/* Merged E row across 4 sub-rows */}
                {[
                  ['ب(هـ)', 'BE', true],
                  ['ج1(هـ)', 'C1E', false],
                  ['ج(هـ)', 'CE', false],
                  ['د(هـ)', 'DE', false],
                ].map(([nAr, nFr, showMerged], idx) => {
                  const held = getHeld(String(nFr));
                  return (
                    <tr key={`e-${idx}`} className="h-[15px]">
                      <td className="border border-black text-[8px] px-1 truncate">{held?.issuing_authority || ''}</td>
                      <td className="border border-black font-mono text-[8px]">{held ? formatDate(held.obtained_date) : ''}</td>
                      <td className="border border-black font-mono text-[8px]">{held?.license_number || ''}</td>
                      <td className="border border-black">{nAr}</td>
                      <td className="border border-black font-sans">{nFr}</td>
                      {showMerged && (
                        <>
                          <td rowSpan={4} className="border border-black">هـ</td>
                          <td rowSpan={4} className="border border-black font-sans">E</td>
                        </>
                      )}
                    </tr>
                  );
                })}
                <tr className="h-[15px]">
                  <td className="border border-black text-[8px] px-1 truncate">{getHeld('F')?.issuing_authority || ''}</td>
                  <td className="border border-black font-mono text-[8px]">{getHeld('F') ? formatDate(getHeld('F')?.obtained_date) : ''}</td>
                  <td className="border border-black font-mono text-[8px]">{getHeld('F')?.license_number || ''}</td>
                  <td className="border border-black">و</td>
                  <td className="border border-black font-sans">F</td>
                  <td className="border border-black">و</td>
                  <td className="border border-black font-sans">F</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* A3 SHEET 2 (VERSO / INSIDE): Page 2 (Right) + Page 3 (Left)           */}
      {/* ===================================================================== */}
      <div
        className="a4-page-sheet bg-white text-black border border-slate-300 shadow-2xl grid grid-cols-2"
        style={{
          width: '420mm',
          height: '297mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          boxSizing: 'border-box',
          fontFamily: '"Times New Roman", Times, "Amiri", "Traditional Arabic", serif, sans-serif',
        }}
      >
        {/* RIGHT HALF (in RTL): PAGE 2 (DECLARATIONS - BLANK) */}
        <div
          className="h-full border-l border-dashed border-slate-300 flex flex-col justify-between"
          style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '14mm 14mm' }}
        >
          {/* Top Section: Candidate Declaration */}
          <div className="space-y-4">
            <table className="w-full border-collapse border border-black text-[11px] font-bold">
              <thead>
                <tr>
                  <th className="border border-black py-1.5 text-[13px] text-center">تصريح المترشح</th>
                  <th className="border border-black py-1.5 w-[18mm] text-center">نعم</th>
                  <th className="border border-black py-1.5 w-[18mm] text-center">لا</th>
                </tr>
              </thead>
              <tbody>
                {[
                  'مصاب بأي مرض يتنافى والحصول على رخصة السياقة.',
                  'حامل لأي عضو اصطناعي.',
                  'أملك رخصة السياقة في حالة تعليق أو ملغاة أو محل أي إجراء قضائي يتنافى والإبقاء عليها.',
                  'لست مترشحا للحصول على رخصة السياقة على مستوى أي مدرسة أخرى داخل الولاية أو خارجها.',
                ].map((stmt, idx) => (
                  <tr key={idx}>
                    <td className="border border-black px-2.5 py-2">{stmt}</td>
                    <td className="border border-black" />
                    <td className="border border-black" />
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[8.5px] font-semibold leading-relaxed text-justify">
              *للمترشح الحق في الإعلام، الولوج، التصحيح والحق في الاعتراض في ما يخص معالجة معطياته الشخصية وفقا لما ينص عليه القانون رقم 18-07 المؤرخ في 10 يونيو 2018، المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي لاسيما المواد 32 و 34 و 35 و 36 منه*.
            </p>

            <p className="text-[11px] font-bold pt-2">
              يشهد المترشح الموقع أدناه بشرفه بصحة كافة المعلومات المذكورة في الصفحة الأولى والمذكورة أعلاه.
            </p>

            <div className="flex items-baseline gap-2 text-[11px] font-bold pt-4">
              <span className="shrink-0">حرر في بلدية</span>
              <span className="flex-1 border-b border-dotted border-black" />
              <span className="shrink-0">ولاية</span>
              <span className="flex-1 border-b border-dotted border-black" />
              <span className="shrink-0">بتاريخ</span>
              <span className="flex-1 border-b border-dotted border-black" />
            </div>

            <div className="flex justify-end pt-3 pl-8">
              <span className="text-[11px] font-bold">التوقيع والبصمة</span>
            </div>
          </div>

          {/* Middle Divider */}
          <div className="border-t-2 border-black w-full my-4" />

          {/* Bottom Section: Minor Guardian Declaration */}
          <div className="flex-1 flex flex-col justify-start space-y-5 pt-2">
            <h3 className="text-center text-[13px] font-bold underline underline-offset-4">
              تصريح ولي المترشح القاصر
            </h3>

            <div className="space-y-3 text-[11px] font-bold leading-loose">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0">أنا الممضي(ة) أسفله:</span>
                <span className="flex-1 border-b border-dotted border-black" />
                <span className="shrink-0">وبصفتي الولي(ة)، الشرعي(ة) للمترشح(ة)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="shrink-0">القاصر(ة):</span>
                <span className="flex-1 border-b border-dotted border-black" />
                <span className="shrink-0">أشهد بصحة المعلومات الخاصة به(ها)</span>
              </div>
              <p>والمدونة على الصفحة الأولى وأسمح للمعني(ة) بالأمر بالتقدم إلى امتحان رخصة السياقة.</p>

              <div className="flex items-baseline gap-2 pt-2">
                <span className="shrink-0">حرر في بلدية</span>
                <span className="flex-1 border-b border-dotted border-black" />
                <span className="shrink-0">ولاية</span>
                <span className="flex-1 border-b border-dotted border-black" />
                <span className="shrink-0">بتاريخ</span>
                <span className="flex-1 border-b border-dotted border-black" />
              </div>
            </div>

            <div className="flex justify-between px-12 pt-6 text-[11.5px] font-bold">
              <span>التوقيع</span>
              <span>المصادقة</span>
            </div>
          </div>
        </div>

        {/* LEFT HALF (in RTL): PAGE 3 (EXAM RESULTS 1-8 - BLANK) */}
        <div
          className="h-full flex flex-col justify-between"
          style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '10mm 12mm' }}
        >
          <p className="text-[11px] font-bold text-center mb-1.5">
            نتائج الامتحانات : أكتب عبارة ناجح أو راسب أمام الامتحان المبرمج.
          </p>

          <ExamAttemptRows count={8} />
        </div>
      </div>
    </div>
  );
}
