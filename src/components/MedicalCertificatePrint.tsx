'use client';

import React from 'react';
import { School, Student } from '@/types/kreno';

interface MedicalCertificatePrintProps {
  student: Student;
  school: School;
}

const LICENSE_BOXES = ['A1', 'A', 'B', 'BE', 'C1', 'C1E', 'C', 'C(E)', 'D', 'F'] as const;
const BOX_COUNT = 26;

function formatDateDDMMYYYY(isoDate?: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

function toCharBoxes(value: string, count = BOX_COUNT): string[] {
  const chars = value.toUpperCase().slice(0, count).split('');
  while (chars.length < count) chars.push('');
  return chars;
}

function DurationCells() {
  return (
    <div className="flex items-center justify-between text-[8px] font-mono leading-none">
      <span className="font-sans font-bold text-[9px] px-0.5">من</span>
      <div className="grid grid-cols-8 border border-black h-[15px] w-[76px]">
        <span className="border-l border-black flex items-center justify-center">2</span>
        <span className="border-l border-black flex items-center justify-center">0</span>
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span />
      </div>
      <span className="font-sans font-bold text-[9px] px-0.5">إلى</span>
      <div className="grid grid-cols-8 border border-black h-[15px] w-[76px]">
        <span className="border-l border-black flex items-center justify-center">2</span>
        <span className="border-l border-black flex items-center justify-center">0</span>
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span className="border-l border-black" />
        <span />
      </div>
    </div>
  );
}

/**
 * Official Algerian Driving License Medical Certificate (model_du_certificat_mdical.pdf).
 * Pre-fills known candidate & school location fields and leaves the doctor section blank for manual completion.
 */
export function MedicalCertificatePrint({ student, school }: MedicalCertificatePrintProps) {
  const birthValue = [formatDateDDMMYYYY(student.birth_date), student.birth_commune]
    .filter(Boolean)
    .join(' ');
  const addressValue = [
    student.address_details,
    student.address_commune,
    student.address_wilaya,
  ]
    .filter(Boolean)
    .join(', ');

  const normalizedCategory =
    student.requested_category === 'CE' ? 'C(E)' : student.requested_category;

  const candidateRows: { ar: string; fr: string; value: string }[] = [
    { ar: 'اللقب', fr: 'Nom', value: student.last_name || '' },
    { ar: 'الإسم', fr: 'Prénom', value: student.first_name || '' },
    { ar: 'تاريخ ومكان الميلاد', fr: 'Date et lieu de naissance', value: birthValue },
    { ar: 'العنوان', fr: 'Adresse', value: addressValue },
    { ar: 'رقم الهاتف', fr: 'N° Téléphone', value: student.phone_number || '' },
    { ar: 'البريد الإلكتروني', fr: 'Adresse électronique', value: student.email || '' },
  ];

  return (
    <div
      dir="rtl"
      className="a4-page-sheet bg-white text-black border border-slate-300 shadow-2xl flex flex-col justify-between relative overflow-hidden"
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        boxSizing: 'border-box',
        padding: '8mm 10mm',
        fontFamily: '"Times New Roman", Times, "Amiri", "Traditional Arabic", serif, sans-serif',
      }}
    >
      {/* Official Background Watermark Emblem (from model_du_certificat_mdical.pdf) */}
      <img
        src="/images/medical-cert-watermark.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] object-contain opacity-25 z-0"
      />
      {/* 1. TOP HEADER: Wilaya/Daira/Commune | Title | Photo Box */}
      <div className="grid grid-cols-[1fr_auto_105px] gap-3 items-start">
        <div className="text-[11px] font-bold leading-[1.6] pt-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0">ولايـــــة :</span>
            <span className="border-b border-black flex-1 min-w-[90px] px-1 text-center font-sans text-[10px]">
              {school.wilaya || ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0">الدائرة الإدارية/ دائرة :</span>
            <span className="border-b border-black flex-1 min-w-[70px] px-1 text-center font-sans text-[10px]">
              {school.daira || ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0">بلدية :</span>
            <span className="border-b border-black flex-1 min-w-[90px] px-1 text-center font-sans text-[10px]">
              {school.commune || ''}
            </span>
          </div>
        </div>

        <div className="text-center px-2">
          <h2 className="text-[15px] font-bold tracking-wide">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </h2>
          <h1 className="text-[14px] font-bold mt-2 tracking-widest">
            شــــهــــادة طــــبــــيــــة
          </h1>
          <p className="text-[12px] font-bold mt-0.5">
            لـــطـــلـــب رخصــــة ســـيـــاقـــة
          </p>
        </div>

        <div className="w-[100px] h-[108px] border border-dashed border-black flex flex-col items-center justify-center text-center text-[10px] font-bold leading-snug px-2">
          <span>صورة شمسية ملونة</span>
          <span>و مأخوذة حديثا</span>
        </div>
      </div>

      {/* Legal decree subtitle */}
      <p className="text-center text-[10px] font-semibold leading-tight -mt-1">
        القرار الوزاري المشترك المؤرخ في 15 نوفمبر 1984 المحدد لقائمة الإصابات التي تتعارض و الحصول أو الإبقاء على رخصة السياقة
      </p>

      {/* 2. CANDIDATE 26-CELL CHARACTER GRID */}
      <div className="space-y-1.5 mt-1">
        {candidateRows.map((row) => {
          const cells = toCharBoxes(row.value);
          return (
            <div
              key={row.fr}
              className="grid grid-cols-[105px_1fr_115px] items-center gap-1.5"
            >
              <span className="text-[11px] font-bold text-right">{row.ar}</span>
              <div
                dir="ltr"
                className="grid border border-black h-[20px] bg-transparent relative z-10"
                style={{ gridTemplateColumns: `repeat(${BOX_COUNT}, minmax(0, 1fr))` }}
              >
                {cells.map((ch, idx) => (
                  <span
                    key={idx}
                    className={`flex items-center justify-center text-[10px] font-mono font-bold leading-none ${
                      idx < BOX_COUNT - 1 ? 'border-r border-black' : ''
                    }`}
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <span dir="ltr" className="text-[9.5px] font-sans font-semibold text-right">
                {row.fr}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. CATEGORIES & CANDIDATE SIGNATURE */}
      <div className="grid grid-cols-[1fr_110px] gap-4 items-start mt-1.5 relative z-10">
        <div className="space-y-2 text-center">
          {/* Previously obtained categories (left blank) */}
          <div>
            <p className="text-[11px] font-bold mb-1">الصنف أو الأصناف المتحصل عليها</p>
            <div dir="ltr" className="flex items-center justify-center gap-1.5">
              {LICENSE_BOXES.map((cat) => (
                <div
                  key={`held-${cat}`}
                  className="w-[30px] h-[24px] border border-slate-400 flex items-center justify-center text-[9.5px] font-sans font-semibold bg-transparent"
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Requested category (pre-highlighted from student record) */}
          <div>
            <p className="text-[11px] font-bold mb-1">الصنف المراد الحصول عليه</p>
            <div dir="ltr" className="flex items-center justify-center gap-1.5">
              {LICENSE_BOXES.map((cat) => {
                const isSelected = normalizedCategory === cat;
                return (
                  <div
                    key={`req-${cat}`}
                    className={`w-[30px] h-[24px] flex items-center justify-center text-[9.5px] font-sans relative ${
                      isSelected
                        ? 'border-2 border-black font-bold bg-slate-100/70'
                        : 'border border-slate-400 font-semibold bg-transparent'
                    }`}
                  >
                    {cat}
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-black text-white text-[8px] flex items-center justify-center leading-none">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Candidate declaration */}
          <div className="pt-0.5 space-y-0.5">
            <p className="text-[11.5px] font-bold">تصريح المترشح</p>
            <p className="text-[11px] font-bold leading-snug">
              أنا المترشح الممضي، أشهد بأني غير مصاب بأي مرض عقلي، ولا بفقدان الوعي ولو لمدة قصيرة.
            </p>
            <p className="text-[10.5px] font-bold text-red-600 leading-snug">
              كل تصريح كاذب يعرض صاحبه إلى العقوبات المنصوص عليها في التشريع الساري المفعول.
            </p>
          </div>
        </div>

        {/* Left box: Candidate signature */}
        <div className="flex flex-col items-center">
          <div className="w-full bg-gradient-to-b from-slate-200 to-slate-100 border border-slate-400 py-1 text-center text-[10.5px] font-bold mb-1.5">
            إمضاء المترشح
          </div>
          <div className="w-full h-[76px] border border-dashed border-black" />
        </div>
      </div>

      {/* 4. DOCTOR SECTION DIVIDER */}
      <div className="relative flex items-center justify-center my-1">
        <div className="w-full border-t border-black" />
        <span className="absolute bg-slate-200 border border-slate-500 rounded-md px-5 py-0.5 text-[10.5px] font-bold shadow-2xs">
          مساحة تملأ من طرف طبيب
        </span>
      </div>

      {/* 5. DOCTOR SECTION (LEFT BLANK FOR MANUAL COMPLETION) */}
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold shrink-0">يشهد الممضي، الطبيب</span>
          <div
            dir="ltr"
            className="grid border border-black h-[20px] flex-1"
            style={{ gridTemplateColumns: `repeat(${BOX_COUNT}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: BOX_COUNT }).map((_, idx) => (
              <span key={idx} className={idx < BOX_COUNT - 1 ? 'border-r border-black' : ''} />
            ))}
          </div>
        </div>

        <p className="font-bold">بعد فحص المترشح أن :</p>

        <div className="space-y-1 pr-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">- له القدرة على القيادة خلال المدة المحددة بموجب التنظيم الساري المفعول</span>
            <div className="flex items-center gap-2 flex-1">
              <span className="border-b border-black flex-1 mt-2" />
              <span className="w-3.5 h-3.5 border border-black inline-block shrink-0" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">- له القدرة على القيادة لمدة محددة</span>
            <div className="flex items-center gap-2 flex-1">
              <span className="border-b border-black flex-1 mt-2" />
              <span className="w-3.5 h-3.5 border border-black inline-block shrink-0" />
            </div>
          </div>

          <p className="font-bold pr-8">في هذه الحالة، يجب تحديد المدة لكل صنف</p>
        </div>

        {/* Validity duration table (4 rows x 2 sides) */}
        <table className="w-full border-collapse border border-black text-[9.5px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-black py-0.5 px-1 w-[40px] font-bold">الصنف</th>
              <th className="border border-black py-0.5 px-1 font-bold">
                المدة (من ي ي/ش ش/س س س س إلى ي ي/ش ش/س س س س)
              </th>
              <th className="border border-black py-0.5 px-1 w-[40px] font-bold">الصنف</th>
              <th className="border border-black py-0.5 px-1 font-bold">
                المدة (من ي ي/ش ش/س س س س إلى ي ي/ش ش/س س س س)
              </th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3].map((rowIdx) => (
              <tr key={rowIdx}>
                <td className="border border-black h-[20px]" />
                <td className="border border-black px-1 py-0.5">
                  <DurationCells />
                </td>
                <td className="border border-black h-[20px]" />
                <td className="border border-black px-1 py-0.5">
                  <DurationCells />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Inaptitude & notes */}
        <div className="space-y-1 pr-3 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">- ليس له القدرة على القيادة</span>
            <div className="flex items-center gap-2 flex-1">
              <span className="border-b border-black flex-1 mt-2" />
              <span className="w-3.5 h-3.5 border border-black inline-block shrink-0" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">- ملاحظات أخرى:</span>
            <div className="flex items-center gap-2 flex-1">
              <span className="border-b border-black flex-1 mt-2" />
              <span className="w-3.5 h-3.5 border border-black inline-block shrink-0" />
            </div>
          </div>
        </div>

        {/* Conclusions */}
        <div className="space-y-1 pt-0.5">
          <p className="font-bold">و عليه، فإنه:</p>
          <div className="space-y-1 pr-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">- لا يشكل أية خطورة على الأمن العمومي و على الذين يقودون المركبات بمختلف أصنافها</span>
              <span className="w-3.5 h-3.5 border border-black inline-block shrink-0" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">- يشكل خطورة على الأمن العمومي و على الذين يقودون المركبات بمختلف أصنافها</span>
              <span className="w-3.5 h-3.5 border border-black inline-block shrink-0" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">- يجب عليه وضع نظارات تصحيحية</span>
              <span className="w-3.5 h-3.5 border border-black inline-block shrink-0" />
            </div>
          </div>
        </div>

        {/* Vision + Doctor Stamp & Signature */}
        <div className="grid grid-cols-[180px_1fr] gap-4 pt-1 items-start">
          <div className="space-y-1 text-[10.5px] font-bold">
            <p>الرؤية:</p>
            <div className="flex items-center justify-between">
              <span>العين اليمنى:</span>
              <div className="w-[54px] h-[18px] border border-black flex items-center justify-center text-[11px]">
                /
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>العين اليسرى:</span>
              <div className="w-[54px] h-[18px] border border-black flex items-center justify-center text-[11px]">
                /
              </div>
            </div>
          </div>

          <div className="space-y-3 text-[11px] font-bold">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 flex-1">
                <span>بـ:</span>
                <span className="border-b border-black flex-1 mt-2" />
              </div>
              <div className="flex items-center gap-1.5 w-[150px]">
                <span>في:</span>
                <span className="border-b border-black flex-1 mt-2" />
              </div>
            </div>
            <p className="text-center pr-12">إمضاء وختم الطبيب</p>
          </div>
        </div>
      </div>
    </div>
  );
}
