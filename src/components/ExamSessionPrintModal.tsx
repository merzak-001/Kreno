'use client';

import React, { useState } from 'react';
import { X, Printer, FileText, Check, Layout } from 'lucide-react';
import { Student, ExamRecord, School } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ExamSessionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionDate: string;
  sessionCenter: string;
  examinerName: string;
  entries: { student: Student; exam: ExamRecord }[];
}

export function ExamSessionPrintModal({
  isOpen,
  onClose,
  sessionDate,
  sessionCenter,
  examinerName,
  entries,
}: ExamSessionPrintModalProps) {
  const { school } = useKreno();
  // Vertical Portrait by default as requested: "the A4 should be vertical if theres alot of candidate it automatically jumps for the second page"
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPortrait = orientation === 'portrait';

  // Capacity per page in Vertical Portrait:
  // Page 1 header takes ~65mm, table can fit up to 16 candidates cleanly without spilling over.
  // If entries <= 16, it fits on 1 page! (unless summary is also required, in which case 12 on P1 and rest + summary on P2).
  // When there are more than 14 candidates, it splits cleanly across pages.
  const page1Max = isPortrait ? 15 : 15;
  const needsSecondPage = entries.length > page1Max || entries.length > 10;
  
  // Page distribution
  const page1Entries = entries.slice(0, page1Max);
  const page2Entries = entries.slice(page1Max);

  // Statistics calculation for the official summary table
  const codeEntries = entries.filter(e => e.exam.exam_type === 'code');
  const creneauEntries = entries.filter(e => e.exam.exam_type === 'creneau');
  const circEntries = entries.filter(e => e.exam.exam_type === 'circulation');

  const codePassed = codeEntries.filter(e => e.exam.result === 'passed').length;
  const creneauPassed = creneauEntries.filter(e => e.exam.result === 'passed').length;
  const circPassed = circEntries.filter(e => e.exam.result === 'passed').length;
  const totalPassed = codePassed + creneauPassed + circPassed;

  // Format nature of exam in Arabic according to official Algerian standard
  const formatNatureExam = (type: string) => {
    switch (type) {
      case 'code':
        return 'ق.م (قانون المرور)';
      case 'creneau':
        return 'مناورات (المرآب)';
      case 'circulation':
        return 'سياقة (السير)';
      default:
        return type;
    }
  };

  // Format result in Arabic
  const formatResultAr = (result: string) => {
    switch (result) {
      case 'passed':
        return 'ناجح';
      case 'failed':
        return 'مؤجل';
      case 'absent_excused':
      case 'absent_unexcused':
        return 'غائب';
      default:
        return '—';
    }
  };

  // Deposit date is 4 days before exam date
  const depositDate = (() => {
    try {
      const d = new Date(sessionDate);
      d.setDate(d.getDate() - 4);
      return d.toISOString().split('T')[0];
    } catch {
      return sessionDate;
    }
  })();

  const totalPages = page2Entries.length > 0 || needsSecondPage ? 2 : 1;

  return (
    <>
      {/* Dynamic Print CSS for strict A4 dimensions */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 ${orientation};
              margin: ${isPortrait ? '8mm 10mm' : '8mm 10mm'};
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-a4-document, #printable-a4-document * {
              visibility: visible !important;
            }
            #printable-a4-document {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .a4-page-sheet {
              width: ${isPortrait ? '190mm' : '277mm'} !important;
              min-height: ${isPortrait ? '277mm' : '194mm'} !important;
              max-height: ${isPortrait ? '277mm' : '194mm'} !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
          }
        `
      }} />

      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
          
          {/* Topbar Actions */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">النموذج رقم 03</span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Bordereau Officiel A4 Vertical — Liste des Candidats à l&apos;Examen du Permis
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Format A4 Vertical ({totalPages} page{totalPages > 1 ? 's' : ''}) • Session du {sessionDate} • {sessionCenter} • {examinerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Orientation Switcher */}
              <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    isPortrait 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                  title="Format A4 Vertical Portrait standard (210 x 297 mm)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 Vertical (Recommandé)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    !isPortrait 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                  title="Format A4 Horizontal Paysage"
                >
                  <Layout className="w-3.5 h-3.5 rotate-90" />
                  <span>A4 Paysage</span>
                </button>
              </div>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer sur Papier A4</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Paper Workspace (Realistic grey background with white physical A4 sheets) */}
          <div className="p-8 overflow-y-auto flex-1 bg-slate-300/70 dark:bg-slate-950 flex flex-col items-center gap-10">
            
            <div id="printable-a4-document" className="flex flex-col items-center gap-10 w-full">
              
              {/* ========================================================= */}
              {/* PAGE 1 (Feuille A4 stricte)                               */}
              {/* ========================================================= */}
              <div 
                className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans text-right relative flex flex-col justify-between"
                dir="rtl"
                style={{
                  width: isPortrait ? '210mm' : '297mm',
                  minHeight: isPortrait ? '297mm' : '210mm',
                  padding: isPortrait ? '8mm 10mm' : '8mm 12mm',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  {/* Top Official Header: Exact replica of Algerian Bordereau 03 */}
                  <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2 text-xs">
                    
                    {/* Right side in RTL: Ministry & Wilaya */}
                    <div className="space-y-0.5 text-right w-[33%]">
                      <p className="font-extrabold text-[11.5px] leading-tight text-black">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                      <p className="font-bold text-[10px] text-black leading-tight">وزارة الداخلية والجماعات المحلية والتهيئة العمرانية</p>
                      <p className="text-[9.5px] text-black font-semibold leading-tight">المندوبية الوطنية للأمن في الطرق</p>
                      <p className="text-[10px] font-bold text-black pt-0.5">ولاية : {school.wilaya || 'سطيف'}</p>
                    </div>

                    {/* Center: Model 03 Title */}
                    <div className="text-center w-[34%]">
                      <div className="inline-block border-2 border-black px-2.5 py-0.5 mb-1 bg-slate-100">
                        <span className="font-black text-xs text-black tracking-wide">النموذج رقم 03</span>
                      </div>
                      <h1 className="font-black text-sm text-black underline underline-offset-3">
                        جدول إرسال المترشحين للامتحان
                      </h1>
                      <p className="text-[9.5px] text-black font-bold pt-0.5">
                        للحصول على رخصة السياقة
                      </p>
                    </div>

                    {/* Left side in RTL: Auto-École Info */}
                    <div className="space-y-0.5 text-left w-[33%]" dir="ltr">
                      <p className="font-extrabold text-[11.5px] text-black leading-tight">{school.name}</p>
                      <p className="text-[9.5px] font-semibold text-black leading-tight">N° d&apos;Agrément : <strong>{school.agrement_number}</strong></p>
                      <p className="text-[9.5px] text-slate-800 leading-tight">Commune : {school.commune || 'Aïn Oulmene'}</p>
                      <p className="text-[9.5px] text-slate-800 leading-tight">Tél : {school.phone || '0555 12 34 56'}</p>
                    </div>
                  </div>

                  {/* Metadata session bar */}
                  <div className="border border-black p-1.5 mb-2 bg-slate-50 text-[10px] flex justify-between items-center text-black font-bold">
                    <span>مركز الامتحان : <strong>{sessionCenter}</strong></span>
                    <span>تاريخ الامتحان : <strong className="font-mono">{sessionDate}</strong></span>
                    <span>المهندس الممتحن : <strong>{examinerName}</strong></span>
                    <span>تاريخ الإيداع : <strong className="font-mono">{depositDate}</strong></span>
                  </div>

                  {/* Candidates Table Page 1 */}
                  <div className="border-2 border-black overflow-hidden text-[10px]">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-black font-black text-black text-[10px]">
                          <th className="p-1 border-l border-black w-7">الرقم</th>
                          <th className="p-1 border-l border-black w-20">رقم التسجيل</th>
                          <th className="p-1 border-l border-black min-w-[130px]">اللقب و الاسم</th>
                          <th className="p-1 border-l border-black w-18">تاريخ الميلاد</th>
                          <th className="p-1 border-l border-black w-10">الصنف</th>
                          <th className="p-1 border-l border-black w-24">طبيعة الامتحان</th>
                          <th className="p-1 border-l border-black w-18">تاريخ الرسوب</th>
                          <th className="p-1 w-16">النتيجة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {page1Entries.map((item, idx) => (
                          <tr key={item.exam.id} className="h-6">
                            <td className="p-1 border-l border-black font-bold font-mono text-[9.5px]">{idx + 1}</td>
                            <td className="p-1 border-l border-black font-mono text-[9px]">
                              {item.student.registration_number || item.student.dossier_number}
                            </td>
                            <td className="p-1 border-l border-black font-bold text-black text-right pr-2 text-[10px]">
                              {item.student.last_name_ar || item.student.last_name} {item.student.first_name_ar || item.student.first_name}
                            </td>
                            <td className="p-1 border-l border-black font-mono text-[9px]">{item.student.birth_date}</td>
                            <td className="p-1 border-l border-black font-black text-[10px]">{item.student.requested_category}</td>
                            <td className="p-1 border-l border-black font-bold text-[9.5px]">{formatNatureExam(item.exam.exam_type)}</td>
                            <td className="p-1 border-l border-black font-mono text-[9px]">
                              {item.exam.attempt_number > 1 ? item.student.deposit_date : '—'}
                            </td>
                            <td className="p-1 font-black text-[10px]">
                              {formatResultAr(item.exam.result)}
                            </td>
                          </tr>
                        ))}

                        {/* Fill remaining empty rows if 1 page only */}
                        {totalPages === 1 && Array.from({ length: Math.max(0, page1Max - page1Entries.length) }).map((_, i) => (
                          <tr key={`empty-p1-${i}`} className="h-6">
                            <td className="border-l border-black text-slate-300 font-mono text-[9px]">{page1Entries.length + i + 1}</td>
                            <td className="border-l border-black"></td>
                            <td className="border-l border-black"></td>
                            <td className="border-l border-black"></td>
                            <td className="border-l border-black"></td>
                            <td className="border-l border-black"></td>
                            <td className="border-l border-black"></td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* If only 1 page, render summary and signature directly on Page 1 */}
                  {totalPages === 1 && (
                    <div className="mt-3 grid grid-cols-2 gap-4 items-start text-xs pt-1">
                      {/* Moniteurs & Statistical Table */}
                      <div className="space-y-2">
                        <div className="border border-black p-1.5 text-[9.5px] bg-white">
                          <p>الممرن الأول : .............................................. الصنف: <strong>B</strong></p>
                          <p>الممرن الثاني : .............................................. الصنف: <strong>C/D</strong></p>
                        </div>
                        <div className="border border-black overflow-hidden">
                          <table className="w-full text-center text-[9.5px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-black font-bold text-black">
                                <th className="p-0.5 border-l border-black">الامتحان</th>
                                <th className="p-0.5 border-l border-black">المدعوون</th>
                                <th className="p-0.5 border-l border-black">الحاضرون</th>
                                <th className="p-0.5">الناجحون</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black">
                              <tr>
                                <td className="p-0.5 border-l border-black">قانون المرور</td>
                                <td className="p-0.5 border-l border-black font-mono">{codeEntries.length}</td>
                                <td className="p-0.5 border-l border-black font-mono">{codeEntries.length}</td>
                                <td className="p-0.5 font-mono font-bold">{codePassed || '...'}</td>
                              </tr>
                              <tr>
                                <td className="p-0.5 border-l border-black">المناورات</td>
                                <td className="p-0.5 border-l border-black font-mono">{creneauEntries.length}</td>
                                <td className="p-0.5 border-l border-black font-mono">{creneauEntries.length}</td>
                                <td className="p-0.5 font-mono font-bold">{creneauPassed || '...'}</td>
                              </tr>
                              <tr>
                                <td className="p-0.5 border-l border-black">السياقة</td>
                                <td className="p-0.5 border-l border-black font-mono">{circEntries.length}</td>
                                <td className="p-0.5 border-l border-black font-mono">{circEntries.length}</td>
                                <td className="p-0.5 font-mono font-bold">{circPassed || '...'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Signature Box */}
                      <div className="flex flex-col items-center">
                        <div className="w-full border-2 border-black rounded-lg p-3 text-center space-y-6 bg-white">
                          <h4 className="font-black text-[11px] text-black border-b border-black pb-1 inline-block px-3">
                            ختم و إمضاء المهندس الممتحن
                          </h4>
                          <div className="text-[9px] text-slate-500">
                            (المهندس المشرف على الدورة)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagination Page 1 Footer */}
                <div className="flex justify-between items-center text-[9.5px] text-slate-800 pt-1.5 border-t border-black font-mono">
                  <span>{school.name} • {school.phone} • {school.address}</span>
                  <span className="font-black border border-black px-2 py-0.5 text-black">1/{totalPages}</span>
                </div>

              </div>


              {/* ========================================================= */}
              {/* PAGE 2 (If candidates jump to the second page)            */}
              {/* ========================================================= */}
              {totalPages > 1 && (
                <div 
                  className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans text-right relative flex flex-col justify-between"
                  dir="rtl"
                  style={{
                    width: isPortrait ? '210mm' : '297mm',
                    minHeight: isPortrait ? '297mm' : '210mm',
                    padding: isPortrait ? '8mm 10mm' : '8mm 12mm',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    {/* Header continuation banner */}
                    <div className="flex justify-between items-center border-b border-black pb-1 mb-2 text-xs">
                      <span className="font-bold text-black text-[10px]">تابع لجدول إرسال المترشحين — النموذج رقم 03</span>
                      <span className="font-mono text-[10px] text-black">Session du {sessionDate}</span>
                    </div>

                    {/* Candidates Table Page 2 Continuation */}
                    <div className="border-2 border-black overflow-hidden text-[10px]">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b-2 border-black font-black text-black text-[10px]">
                            <th className="p-1 border-l border-black w-7">الرقم</th>
                            <th className="p-1 border-l border-black w-20">رقم التسجيل</th>
                            <th className="p-1 border-l border-black min-w-[130px]">اللقب و الاسم</th>
                            <th className="p-1 border-l border-black w-18">تاريخ الميلاد</th>
                            <th className="p-1 border-l border-black w-10">الصنف</th>
                            <th className="p-1 border-l border-black w-24">طبيعة الامتحان</th>
                            <th className="p-1 border-l border-black w-18">تاريخ الرسوب</th>
                            <th className="p-1 w-16">النتيجة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {page2Entries.map((item, idx) => (
                            <tr key={item.exam.id} className="h-6">
                              <td className="p-1 border-l border-black font-bold font-mono text-[9.5px]">
                                {page1Max + idx + 1}
                              </td>
                              <td className="p-1 border-l border-black font-mono text-[9px]">
                                {item.student.registration_number || item.student.dossier_number}
                              </td>
                              <td className="p-1 border-l border-black font-bold text-black text-right pr-2 text-[10px]">
                                {item.student.last_name_ar || item.student.last_name} {item.student.first_name_ar || item.student.first_name}
                              </td>
                              <td className="p-1 border-l border-black font-mono text-[9px]">{item.student.birth_date}</td>
                              <td className="p-1 border-l border-black font-black text-[10px]">{item.student.requested_category}</td>
                              <td className="p-1 border-l border-black font-bold text-[9.5px]">{formatNatureExam(item.exam.exam_type)}</td>
                              <td className="p-1 border-l border-black font-mono text-[9px]">
                                {item.exam.attempt_number > 1 ? item.student.deposit_date : '—'}
                              </td>
                              <td className="p-1 font-black text-[10px]">
                                {formatResultAr(item.exam.result)}
                              </td>
                            </tr>
                          ))}

                          {/* Empty lines on Page 2 (4 lines minimum) */}
                          {Array.from({ length: Math.max(4, 4 - page2Entries.length) }).map((_, i) => (
                            <tr key={`empty-p2-${i}`} className="h-6">
                              <td className="border-l border-black text-slate-300 font-mono text-[9px]">{page2Entries.length + page1Max + 1 + i}</td>
                              <td className="border-l border-black"></td>
                              <td className="border-l border-black"></td>
                              <td className="border-l border-black"></td>
                              <td className="border-l border-black"></td>
                              <td className="border-l border-black"></td>
                              <td className="border-l border-black"></td>
                              <td></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Section: Moniteurs + Statistical Table + Engineer Stamp */}
                    <div className="mt-4 grid grid-cols-2 gap-4 items-start text-xs pt-2">
                      {/* Moniteurs accompagnateurs & Summary */}
                      <div className="space-y-2.5">
                        <div className="space-y-1 text-[10px] border border-black p-2 bg-white">
                          <p className="flex justify-between items-center">
                            <span>اسم و لقب الممرن الأول : ..............................................</span>
                            <span>الصنف : <strong>B</strong></span>
                          </p>
                          <p className="flex justify-between items-center">
                            <span>اسم و لقب الممرن الثاني : ..............................................</span>
                            <span>الصنف : <strong>C/D</strong></span>
                          </p>
                        </div>

                        <div className="border-2 border-black overflow-hidden">
                          <table className="w-full text-center text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 border-b-2 border-black font-black text-black">
                                <th className="p-1 border-l border-black">طبيعة الامتحان</th>
                                <th className="p-1 border-l border-black">المدعوون</th>
                                <th className="p-1 border-l border-black">الحاضرون</th>
                                <th className="p-1">الناجحون</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black">
                              <tr className="h-6">
                                <td className="p-1 border-l border-black font-bold">قانون المرور</td>
                                <td className="p-1 border-l border-black font-mono font-bold">{codeEntries.length}</td>
                                <td className="p-1 border-l border-black font-mono font-bold">{codeEntries.length}</td>
                                <td className="p-1 font-mono font-bold text-black">{codePassed || '...'}</td>
                              </tr>
                              <tr className="h-6">
                                <td className="p-1 border-l border-black font-bold">المناورات</td>
                                <td className="p-1 border-l border-black font-mono font-bold">{creneauEntries.length}</td>
                                <td className="p-1 border-l border-black font-mono font-bold">{creneauEntries.length}</td>
                                <td className="p-1 font-mono font-bold text-black">{creneauPassed || '...'}</td>
                              </tr>
                              <tr className="h-6">
                                <td className="p-1 border-l border-black font-bold">السياقة</td>
                                <td className="p-1 border-l border-black font-mono font-bold">{circEntries.length}</td>
                                <td className="p-1 border-l border-black font-mono font-bold">{circEntries.length}</td>
                                <td className="p-1 font-mono font-bold text-black">{circPassed || '...'}</td>
                              </tr>
                              <tr className="bg-slate-100 font-black border-t-2 border-black h-6">
                                <td className="p-1 border-l border-black">المجموع</td>
                                <td className="p-1 border-l border-black font-mono">{entries.length}</td>
                                <td className="p-1 border-l border-black font-mono">{entries.length}</td>
                                <td className="p-1 font-mono font-black text-black">{totalPassed || '...'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Engineer Signature Box */}
                      <div className="flex flex-col items-center justify-between h-full pt-1">
                        <div className="w-full border-2 border-black rounded-xl p-5 text-center space-y-10 bg-white">
                          <h4 className="font-black text-xs text-black border-b border-black pb-1.5 inline-block px-4">
                            ختم و إمضاء المهندس الممتحن
                          </h4>
                          <div className="text-[10px] text-slate-500 font-medium">
                            (إمضاء وختم مهندس الإدارة المشرف على الدورة)
                          </div>
                        </div>

                        <div className="w-full text-left text-[9.5px] text-slate-700 pt-2 font-mono" dir="ltr">
                          <span>Fait à {sessionCenter}, le {sessionDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pagination Page 2 Footer */}
                  <div className="flex justify-between items-center text-[9.5px] text-slate-800 pt-1.5 border-t border-black font-mono">
                    <span>{school.name} • Agrément N° {school.agrement_number}</span>
                    <span className="font-black border border-black px-2 py-0.5 text-black">2/2</span>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </>
  );
}
