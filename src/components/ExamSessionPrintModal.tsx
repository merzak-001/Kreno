'use client';

import React, { useState } from 'react';
import { X, Printer, FileText, Check, Layout, RotateCcw } from 'lucide-react';
import { Student, ExamRecord, School } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';

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
  // Default to landscape as in official Algerian Bordereau Modèle N° 03
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Official Pagination:
  // In Landscape (official Algerian standard): 15 candidates fit perfectly on Page 1
  // Page 2 contains remaining candidates + moniteurs + statistical summary table + inspector cachet
  const isLandscape = orientation === 'landscape';
  const page1Max = isLandscape ? 15 : 16;
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
        return 'مناورات';
      case 'circulation':
        return 'سياقة';
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

  return (
    <>
      {/* Dynamic Print CSS for strict A4 dimensions */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 ${orientation};
              margin: ${isLandscape ? '8mm 10mm' : '10mm 12mm'};
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
              width: ${isLandscape ? '277mm' : '190mm'} !important;
              min-height: ${isLandscape ? '194mm' : '277mm'} !important;
              max-height: ${isLandscape ? '194mm' : '277mm'} !important;
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
        <div className="bg-card-bg rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl border border-card-border overflow-hidden text-slate-900 dark:text-slate-100">
          
          {/* Topbar Actions */}
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-slate-50 dark:bg-card-bg shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-brand-primary dark:text-brand-soft flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-primary text-white">النموذج رقم 03</span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    Bordereau Officiel A4 — Liste des Candidats à l&apos;Examen du Permis
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format standard papier A4 ({isLandscape ? '297 × 210 mm Paysage' : '210 × 297 mm Portrait'}) • Session du <strong className="font-mono text-slate-700 dark:text-slate-300">{sessionDate}</strong> ({entries.length} candidats)
                </p>
              </div>
            </div>

            {/* Controls: Orientation Switcher & Print Button */}
            <div className="flex items-center gap-3">
              
              {/* Orientation Switcher */}
              <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    isLandscape 
                      ? 'bg-card-bg text-brand-primary dark:text-brand-soft shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                  title="Format officiel recommandé : A4 Paysage / Horizontal (297 x 210 mm)"
                >
                  <Layout className="w-3.5 h-3.5 rotate-90" />
                  <span>A4 Paysage (Officiel)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    !isLandscape 
                      ? 'bg-card-bg text-brand-primary dark:text-brand-soft shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                  title="Format A4 Portrait standard (210 x 297 mm)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 Portrait</span>
                </button>
              </div>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/30 transition cursor-pointer"
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
              {/* PAGE 1 / 2 (Feuille A4 stricte)                           */}
              {/* ========================================================= */}
              <div 
                className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans text-right relative flex flex-col justify-between"
                dir="rtl"
                style={{
                  width: isLandscape ? '297mm' : '210mm',
                  minHeight: isLandscape ? '210mm' : '297mm',
                  padding: isLandscape ? '8mm 12mm' : '10mm 12mm',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  {/* Top Official Header: Exact replica of Algerian Bordereau 03 */}
                  <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2 text-xs">
                    
                    {/* Right side in RTL: Ministry & Wilaya */}
                    <div className="space-y-0.5 text-right w-[32%]">
                      <p className="font-extrabold text-[12px] leading-tight text-black">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                      <p className="font-bold text-[10.5px] text-black leading-tight">وزارة الداخلية، الجماعات المحلية والتهيئة العمرانية</p>
                      <p className="text-[10px] text-black font-semibold leading-tight">المندوبية الوطنية للأمن في الطرق</p>
                      <p className="text-[10.5px] font-bold text-black pt-0.5">ولاية : {school.wilaya || 'سطيف'}</p>
                    </div>

                    {/* Center: Model 03 Title */}
                    <div className="text-center w-[30%]">
                      <div className="border-2 border-black px-3 py-0.5 inline-block bg-white">
                        <span className="font-black text-xs text-black tracking-wider">
                          النموذج رقم 03 :
                        </span>
                      </div>
                      <h2 className="font-black text-[13.5px] text-black mt-1 leading-snug">
                        قائمة المترشحين لامتحان رخصة السياقة
                      </h2>
                    </div>

                    {/* Left in RTL (Center, Filing date, Exam date, Inspector, School stamp) */}
                    <div className="flex items-start gap-2 w-[38%] justify-end" dir="rtl">
                      {/* Examination meta info */}
                      <div className="border border-black p-1.5 text-[9.5px] space-y-0.5 leading-tight bg-white flex-1">
                        <p><span className="font-bold">مركز الامتحان :</span> {sessionCenter}</p>
                        <p><span className="font-bold">تاريخ الإيداع :</span> <span className="font-mono">{depositDate}</span></p>
                        <p><span className="font-bold">تاريخ الامتحان :</span> <span className="font-mono font-bold">{sessionDate}</span></p>
                        <p><span className="font-bold">اسم و لقب المفتش :</span> {examinerName}</p>
                      </div>

                      {/* Cachet Auto-École Box */}
                      <div className="border-2 border-black p-1.5 text-center text-[9px] text-black bg-white w-28 shrink-0 flex flex-col justify-between h-20">
                        <span className="font-bold text-[9px] leading-tight">ختم مدرسة تعليم السياقة</span>
                        <div className="font-mono font-black text-sm text-black border-t border-black/50 pt-1">
                          {school.agrement_number || '438'}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Candidates Table Page 1: Strict 8 Columns as shown in physical document */}
                  <div className="border-2 border-black overflow-hidden text-[10px]">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-black font-black text-black text-[10px]">
                          <th className="p-1 border-l border-black w-8">الرقم</th>
                          <th className="p-1 border-l border-black w-24">رقم التسجيل</th>
                          <th className="p-1 border-l border-black min-w-[140px]">اللقب و الاسم</th>
                          <th className="p-1 border-l border-black w-20">تاريخ الميلاد</th>
                          <th className="p-1 border-l border-black w-12">الصنف</th>
                          <th className="p-1 border-l border-black w-28">طبيعة الامتحان</th>
                          <th className="p-1 border-l border-black w-22">تاريخ آخر امتحان</th>
                          <th className="p-1 w-20">النتيجة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {page1Entries.map((item, idx) => (
                          <tr key={item.exam.id} className="h-7 text-black">
                            <td className="p-1 border-l border-black font-bold font-mono text-[10px]">{idx + 1}</td>
                            <td className="p-1 border-l border-black font-mono text-[9.5px]">
                              {item.student.registration_number || item.student.dossier_number}
                            </td>
                            <td className="p-1 border-l border-black font-bold text-black text-right pr-2 text-[10.5px]">
                              {item.student.last_name_ar || item.student.last_name} {item.student.first_name_ar || item.student.first_name}
                            </td>
                            <td className="p-1 border-l border-black font-mono text-[9.5px]">{item.student.birth_date}</td>
                            <td className="p-1 border-l border-black font-black text-[10.5px]">{item.student.requested_category}</td>
                            <td className="p-1 border-l border-black font-bold text-[10px]">{formatNatureExam(item.exam.exam_type)}</td>
                            <td className="p-1 border-l border-black font-mono text-[9.5px]">
                              {item.exam.attempt_number > 1 ? item.student.deposit_date : '—'}
                            </td>
                            <td className="p-1 font-black text-[10.5px]">
                              {formatResultAr(item.exam.result)}
                            </td>
                          </tr>
                        ))}

                        {/* Fill remaining empty rows to maintain strict official A4 table height */}
                        {Array.from({ length: Math.max(0, page1Max - page1Entries.length) }).map((_, i) => (
                          <tr key={`empty-p1-${i}`} className="h-7">
                            <td className="border-l border-black text-slate-300 font-mono text-[9.5px]">{page1Entries.length + i + 1}</td>
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
                </div>

                {/* Pagination Page 1 Footer */}
                <div className="flex justify-between items-center text-[10px] text-slate-800 pt-2 border-t border-black font-mono">
                  <span>{school.name} • {school.phone} • {school.address}</span>
                  <span className="font-black border-2 border-black px-2.5 py-0.5 rounded-xs text-black">1/2</span>
                </div>

              </div>


              {/* ========================================================= */}
              {/* PAGE 2 / 2 (Feuille A4 stricte)                           */}
              {/* ========================================================= */}
              <div 
                className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans text-right relative flex flex-col justify-between"
                dir="rtl"
                style={{
                  width: isLandscape ? '297mm' : '210mm',
                  minHeight: isLandscape ? '210mm' : '297mm',
                  padding: isLandscape ? '8mm 12mm' : '10mm 12mm',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  {/* Candidates Table Page 2 Continuation */}
                  <div className="border-2 border-black overflow-hidden text-[10px]">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-black font-black text-black text-[10px]">
                          <th className="p-1 border-l border-black w-8">الرقم</th>
                          <th className="p-1 border-l border-black w-24">رقم التسجيل</th>
                          <th className="p-1 border-l border-black min-w-[140px]">اللقب و الاسم</th>
                          <th className="p-1 border-l border-black w-20">تاريخ الميلاد</th>
                          <th className="p-1 border-l border-black w-12">الصنف</th>
                          <th className="p-1 border-l border-black w-28">طبيعة الامتحان</th>
                          <th className="p-1 border-l border-black w-22">تاريخ آخر امتحان</th>
                          <th className="p-1 w-20">النتيجة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {page2Entries.map((item, idx) => (
                          <tr key={item.exam.id} className="h-7 text-black">
                            <td className="p-1 border-l border-black font-bold font-mono text-[10px]">{idx + page1Max + 1}</td>
                            <td className="p-1 border-l border-black font-mono text-[9.5px]">
                              {item.student.registration_number || item.student.dossier_number}
                            </td>
                            <td className="p-1 border-l border-black font-bold text-black text-right pr-2 text-[10.5px]">
                              {item.student.last_name_ar || item.student.last_name} {item.student.first_name_ar || item.student.first_name}
                            </td>
                            <td className="p-1 border-l border-black font-mono text-[9.5px]">{item.student.birth_date}</td>
                            <td className="p-1 border-l border-black font-black text-[10.5px]">{item.student.requested_category}</td>
                            <td className="p-1 border-l border-black font-bold text-[10px]">{formatNatureExam(item.exam.exam_type)}</td>
                            <td className="p-1 border-l border-black font-mono text-[9.5px]">
                              {item.exam.attempt_number > 1 ? item.student.deposit_date : '—'}
                            </td>
                            <td className="p-1 font-black text-[10.5px]">
                              {formatResultAr(item.exam.result)}
                            </td>
                          </tr>
                        ))}

                        {/* Empty lines on Page 2 (5 lines minimum to keep table proportion as seen in photo) */}
                        {Array.from({ length: Math.max(5, 5 - page2Entries.length) }).map((_, i) => (
                          <tr key={`empty-p2-${i}`} className="h-7">
                            <td className="border-l border-black text-slate-300 font-mono text-[9.5px]">{page2Entries.length + page1Max + 1 + i}</td>
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

                  {/* Bottom Official Section (Image 2): Moniteurs + Recap Summary Table + Inspector Stamp Box */}
                  <div className="mt-4 grid grid-cols-2 gap-6 items-start text-xs pt-2">
                    
                    {/* Right side in RTL: Moniteurs & Statistical Recap Table */}
                    <div className="space-y-3">
                      
                      {/* Moniteurs accompagnateurs */}
                      <div className="space-y-1.5 text-[11px] border border-black p-2 bg-white">
                        <p className="flex justify-between items-center">
                          <span>اسم و لقب الممرن الأول : ................................................................</span>
                          <span>الصنف : <strong>B</strong></span>
                        </p>
                        <p className="flex justify-between items-center">
                          <span>اسم و لقب الممرن الثاني : ................................................................</span>
                          <span>الصنف : <strong>C/D</strong></span>
                        </p>
                      </div>

                      {/* Official Summary Table from Image 2 */}
                      <div className="border-2 border-black overflow-hidden">
                        <table className="w-full text-center text-[10.5px]">
                          <thead>
                            <tr className="bg-slate-100 border-b-2 border-black font-black text-black">
                              <th className="p-1 border-l border-black">طبيعة الامتحان</th>
                              <th className="p-1 border-l border-black">عدد المترشحين المدعوين</th>
                              <th className="p-1 border-l border-black">عدد المترشحين الحاضرين</th>
                              <th className="p-1">عدد الناجحين</th>
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
                            <tr className="bg-slate-100 font-black border-t-2 border-black h-7">
                              <td className="p-1 border-l border-black">المجموع</td>
                              <td className="p-1 border-l border-black font-mono">{entries.length}</td>
                              <td className="p-1 border-l border-black font-mono">{entries.length}</td>
                              <td className="p-1 font-mono font-black text-black">{totalPassed || '...'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                    </div>

                    {/* Left side in RTL: Inspector Stamp and Signature Box from Image 2 */}
                    <div className="flex flex-col items-center justify-between h-full pt-1">
                      <div className="w-full border-2 border-black rounded-xl p-6 text-center space-y-14 bg-white shadow-2xs">
                        <h4 className="font-black text-xs text-black border-b border-black pb-1.5 inline-block px-4">
                          ختم و إمضاء المفتش
                        </h4>
                        <div className="text-[10px] text-slate-500 font-medium">
                          (إمضاء وختم مفتش أمن الطرقات المشرف على الدورة)
                        </div>
                      </div>

                      <div className="w-full text-left text-[10px] text-slate-700 pt-3 font-mono" dir="ltr">
                        <span>Fait à {sessionCenter}, le {sessionDate}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Pagination Page 2 Footer */}
                <div className="flex justify-between items-center text-[10px] text-slate-800 pt-2 border-t border-black font-mono">
                  <span>{school.name} • Agrément N° {school.agrement_number}</span>
                  <span className="font-black border-2 border-black px-2.5 py-0.5 rounded-xs text-black">2/2</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}
