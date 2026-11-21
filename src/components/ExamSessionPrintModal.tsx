'use client';

import React from 'react';
import { X, Printer, ShieldCheck, FileCheck } from 'lucide-react';
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

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group entries: Page 1 gets up to 15 candidates, Page 2 gets the rest (or minimum 10 empty lines)
  const page1Entries = entries.slice(0, 15);
  const page2Entries = entries.slice(15);

  // Statistics calculation for the summary table
  const codeEntries = entries.filter(e => e.exam.exam_type === 'code');
  const creneauEntries = entries.filter(e => e.exam.exam_type === 'creneau');
  const circEntries = entries.filter(e => e.exam.exam_type === 'circulation');

  const codePassed = codeEntries.filter(e => e.exam.result === 'passed').length;
  const creneauPassed = creneauEntries.filter(e => e.exam.result === 'passed').length;
  const circPassed = circEntries.filter(e => e.exam.result === 'passed').length;
  const totalPassed = codePassed + creneauPassed + circPassed;

  // Format nature of exam in Arabic
  const formatNatureExam = (type: string) => {
    switch (type) {
      case 'code':
        return 'ق.م (قانون المرور)';
      case 'creneau':
        return 'مناورات (الكرينو)';
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

  // Deposit date is typically 4 to 5 days before exam date
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Topbar Actions */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">النموذج رقم 03</span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bordereau Officiel Algérien — Liste des Candidats à l&apos;Examen du Permis
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Session du <strong className="font-mono text-slate-700 dark:text-slate-300">{sessionDate}</strong> • {entries.length} candidat(s) inscrit(s) • Format officiel conforme (Page 1/2 &amp; 2/2)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Bordereau Officiel (2 Pages)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-200/60 dark:bg-slate-950 flex flex-col items-center gap-8">
          
          {/* ========================================================= */}
          {/* PAGE 1 / 2 (Conforme à l'image 3) */}
          {/* ========================================================= */}
          <div className="bg-white border border-slate-300 shadow-xl rounded-lg w-full max-w-[850px] p-8 text-slate-900 font-sans print:p-0 print:border-none print:shadow-none print:w-full print:m-0 print:break-after-page text-right" dir="rtl">
            
            {/* Header: Republic + Title + Auto-école Stamp */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-3 text-xs">
              
              {/* Ministry & Wilaya Header (Right in RTL) */}
              <div className="space-y-0.5 text-right w-1/3">
                <p className="font-bold text-[11px]">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="font-bold text-[10px] text-slate-700">وزارة الداخلية، الجماعات المحلية والتهيئة العمرانية</p>
                <p className="text-[10px] text-slate-600">المندوبية الوطنية للأمن في الطرق</p>
                <p className="text-[10px] font-semibold text-slate-800">ولاية : {school.wilaya || 'سطيف'}</p>
              </div>

              {/* Title (Center in RTL) */}
              <div className="text-center w-1/3">
                <h3 className="font-black text-sm text-slate-900 tracking-wide border-2 border-slate-900 px-3 py-1 inline-block rounded-xs">
                  النموذج رقم 03 :
                </h3>
                <h2 className="font-extrabold text-sm text-slate-900 mt-1">
                  قائمة المترشحين لامتحان رخصة السياقة
                </h2>
              </div>

              {/* Session Meta & Auto-Ecole Stamp (Left in RTL) */}
              <div className="space-y-1 text-left w-1/3" dir="ltr">
                <div className="border border-slate-400 p-2 rounded-xs text-[10px] space-y-0.5 bg-slate-50/50">
                  <p><span className="font-bold">مركز الامتحان :</span> {sessionCenter}</p>
                  <p><span className="font-bold">تاريخ الإيداع :</span> <span className="font-mono">{depositDate}</span></p>
                  <p><span className="font-bold">تاريخ الامتحان :</span> <span className="font-mono font-bold">{sessionDate}</span></p>
                  <p><span className="font-bold">اسم و لقب المفتش :</span> {examinerName}</p>
                </div>

                {/* Stamp Box */}
                <div className="border border-dashed border-slate-500 rounded-xs p-2 text-center text-[9px] text-slate-500 bg-white">
                  <span>ختم مدرسة تعليم السياقة</span>
                  <div className="font-bold font-mono text-[10px] text-slate-800">
                    رقم الاعتماد : {school.agrement_number || '438'}
                  </div>
                </div>
              </div>

            </div>

            {/* Candidates Table Page 1 */}
            <div className="border-2 border-slate-900 overflow-hidden text-[10.5px]">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 font-bold text-slate-800 text-[10px]">
                    <th className="p-1 border-l border-slate-400 w-8">الرقم</th>
                    <th className="p-1 border-l border-slate-400 w-24">رقم التسجيل</th>
                    <th className="p-1 border-l border-slate-400 min-w-[140px]">اللقب و الاسم</th>
                    <th className="p-1 border-l border-slate-400 w-20">تاريخ الميلاد</th>
                    <th className="p-1 border-l border-slate-400 w-12">الصنف</th>
                    <th className="p-1 border-l border-slate-400 w-28">طبيعة الامتحان</th>
                    <th className="p-1 border-l border-slate-400 w-20">تاريخ آخر امتحان</th>
                    <th className="p-1 w-20">النتيجة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {page1Entries.map((item, idx) => (
                    <tr key={item.exam.id} className="hover:bg-slate-50">
                      <td className="p-1.5 border-l border-slate-300 font-bold font-mono">{idx + 1}</td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[10px]">
                        {item.student.registration_number || item.student.dossier_number}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-bold text-slate-900 text-right pr-2">
                        {item.student.last_name_ar || item.student.last_name} {item.student.first_name_ar || item.student.first_name}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[10px]">{item.student.birth_date}</td>
                      <td className="p-1.5 border-l border-slate-300 font-bold">{item.student.requested_category}</td>
                      <td className="p-1.5 border-l border-slate-300 font-semibold">{formatNatureExam(item.exam.exam_type)}</td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[10px] text-slate-500">
                        {item.exam.attempt_number > 1 ? item.student.deposit_date : '—'}
                      </td>
                      <td className="p-1.5 font-bold">
                        {formatResultAr(item.exam.result)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows if less than 15 to preserve official form look */}
                  {Array.from({ length: Math.max(0, 15 - page1Entries.length) }).map((_, i) => (
                    <tr key={`empty-p1-${i}`} className="h-6">
                      <td className="border-l border-slate-200 text-slate-300 font-mono">{page1Entries.length + i + 1}</td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Page 1 */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 font-mono">
              <span>{school.name} • {school.phone}</span>
              <span className="font-bold border px-2 py-0.5 rounded">1/2</span>
            </div>

          </div>


          {/* ========================================================= */}
          {/* PAGE 2 / 2 (Conforme à l'image 4) */}
          {/* ========================================================= */}
          <div className="bg-white border border-slate-300 shadow-xl rounded-lg w-full max-w-[850px] p-8 text-slate-900 font-sans print:p-0 print:border-none print:shadow-none print:w-full print:m-0 text-right" dir="rtl">
            
            {/* Candidates Table Page 2 Continuation */}
            <div className="border-2 border-slate-900 overflow-hidden text-[10.5px]">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 font-bold text-slate-800 text-[10px]">
                    <th className="p-1 border-l border-slate-400 w-8">الرقم</th>
                    <th className="p-1 border-l border-slate-400 w-24">رقم التسجيل</th>
                    <th className="p-1 border-l border-slate-400 min-w-[140px]">اللقب و الاسم</th>
                    <th className="p-1 border-l border-slate-400 w-20">تاريخ الميلاد</th>
                    <th className="p-1 border-l border-slate-400 w-12">الصنف</th>
                    <th className="p-1 border-l border-slate-400 w-28">طبيعة الامتحان</th>
                    <th className="p-1 border-l border-slate-400 w-20">تاريخ آخر امتحان</th>
                    <th className="p-1 w-20">النتيجة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {page2Entries.map((item, idx) => (
                    <tr key={item.exam.id} className="hover:bg-slate-50">
                      <td className="p-1.5 border-l border-slate-300 font-bold font-mono">{idx + 16}</td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[10px]">
                        {item.student.registration_number || item.student.dossier_number}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-bold text-slate-900 text-right pr-2">
                        {item.student.last_name_ar || item.student.last_name} {item.student.first_name_ar || item.student.first_name}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[10px]">{item.student.birth_date}</td>
                      <td className="p-1.5 border-l border-slate-300 font-bold">{item.student.requested_category}</td>
                      <td className="p-1.5 border-l border-slate-300 font-semibold">{formatNatureExam(item.exam.exam_type)}</td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[10px] text-slate-500">
                        {item.exam.attempt_number > 1 ? item.student.deposit_date : '—'}
                      </td>
                      <td className="p-1.5 font-bold">
                        {formatResultAr(item.exam.result)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows on page 2 */}
                  {Array.from({ length: Math.max(5, 7 - page2Entries.length) }).map((_, i) => (
                    <tr key={`empty-p2-${i}`} className="h-6">
                      <td className="border-l border-slate-200 text-slate-300 font-mono">{page2Entries.length + 16 + i}</td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td className="border-l border-slate-200"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Official Summary: Moniteurs + Statistics Box + Inspector Stamp Box */}
            <div className="mt-6 grid grid-cols-2 gap-8 items-start text-xs pt-4 border-t border-slate-300">
              
              {/* Right: Moniteurs & Statistics Table */}
              <div className="space-y-4">
                
                {/* Moniteurs accompagnateurs */}
                <div className="space-y-1.5 text-[11px] border p-2.5 rounded bg-slate-50">
                  <p className="flex justify-between items-center">
                    <span>اسم و لقب الممرن الأول : .................................</span>
                    <span>الصنف : <strong>B</strong></span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>اسم و لقب الممرن الثاني : .................................</span>
                    <span>الصنف : <strong>C/D</strong></span>
                  </p>
                </div>

                {/* Recap Box (طبيعة الامتحان | عدد المدعوين | عدد الحاضرين | عدد الناجحين) */}
                <div className="border-2 border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-center text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800 font-bold">
                        <th className="p-1.5 border-l border-slate-400">طبيعة الامتحان</th>
                        <th className="p-1.5 border-l border-slate-400">عدد المدعوين</th>
                        <th className="p-1.5 border-l border-slate-400">عدد الحاضرين</th>
                        <th className="p-1.5">عدد الناجحين</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      <tr>
                        <td className="p-1.5 border-l border-slate-300 font-bold">قانون المرور</td>
                        <td className="p-1.5 border-l border-slate-300 font-mono">{codeEntries.length}</td>
                        <td className="p-1.5 border-l border-slate-300 font-mono">{codeEntries.length}</td>
                        <td className="p-1.5 font-bold font-mono text-emerald-700">{codePassed || '...'}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border-l border-slate-300 font-bold">المناورات</td>
                        <td className="p-1.5 border-l border-slate-300 font-mono">{creneauEntries.length}</td>
                        <td className="p-1.5 border-l border-slate-300 font-mono">{creneauEntries.length}</td>
                        <td className="p-1.5 font-bold font-mono text-emerald-700">{creneauPassed || '...'}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border-l border-slate-300 font-bold">السياقة</td>
                        <td className="p-1.5 border-l border-slate-300 font-mono">{circEntries.length}</td>
                        <td className="p-1.5 border-l border-slate-300 font-mono">{circEntries.length}</td>
                        <td className="p-1.5 font-bold font-mono text-emerald-700">{circPassed || '...'}</td>
                      </tr>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                        <td className="p-1.5 border-l border-slate-400">المجموع</td>
                        <td className="p-1.5 border-l border-slate-400 font-mono">{entries.length}</td>
                        <td className="p-1.5 border-l border-slate-400 font-mono">{entries.length}</td>
                        <td className="p-1.5 font-mono text-emerald-700">{totalPassed || '...'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Left: Inspector Stamp and Signature Box */}
              <div className="flex flex-col items-center justify-between h-full pt-2">
                <div className="w-full border-2 border-slate-800 rounded-lg p-6 text-center space-y-12 bg-white shadow-2xs">
                  <h4 className="font-bold text-xs underline text-slate-800">
                    ختم وإمضاء المفتش
                  </h4>
                  <div className="text-[10px] text-slate-400">
                    (توقيع وختم مفتش أمن الطرقات المسؤول عن الدورة)
                  </div>
                </div>

                <div className="w-full text-left text-[10px] text-slate-400 pt-4 font-mono">
                  <span>تم التحرير في {sessionCenter} بتاريخ {sessionDate}</span>
                </div>
              </div>

            </div>

            {/* Pagination Page 2 */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-8 font-mono">
              <span>{school.name} • {school.address}</span>
              <span className="font-bold border px-2 py-0.5 rounded">2/2</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
