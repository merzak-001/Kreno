'use client';

import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { Student } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export function PrintModal({ isOpen, onClose, student }: PrintModalProps) {
  const { school, lang } = useKreno();
  const [selectedDoc, setSelectedDoc] = useState<'dossier' | 'medical' | 'contract' | 'livret'>('dossier');

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Topbar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Édition & Impression des Documents Réglementaires
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidat: <strong className="text-slate-800 dark:text-slate-200">{student.first_name} {student.last_name}</strong> ({student.dossier_number})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer cette pièce officielle</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-750 flex items-center gap-2 shrink-0 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedDoc('dossier')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedDoc === 'dossier' 
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <span>1. Dossier de Candidature (A3/A4)</span>
          </button>

          <button
            onClick={() => setSelectedDoc('medical')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedDoc === 'medical' 
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <span>2. Certificat Médical d&apos;Aptitude (A4)</span>
          </button>

          <button
            onClick={() => setSelectedDoc('contract')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedDoc === 'contract' 
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <span>3. Contrat d&apos;Apprentissage (A4)</span>
          </button>

          <button
            onClick={() => setSelectedDoc('livret')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedDoc === 'livret' 
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <span>4. Livret Pédagogique d&apos;Apprentissage (A5)</span>
          </button>
        </div>

        {/* Document Preview Canvas */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-200/50 dark:bg-slate-950 flex justify-center">
          <div className="bg-white border border-slate-300 shadow-xl rounded-lg w-full max-w-3xl p-8 text-slate-900 font-sans print:p-0 print:border-none print:shadow-none text-left">
            
            {/* DOCUMENT 1: Demande / Dossier de candidature */}
            {selectedDoc === 'dossier' && (
              <div className="space-y-6 text-sm">
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-sm">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</h3>
                  <h4 className="font-bold text-xs text-slate-600">Ministère de l&apos;Intérieur et des Collectivités Locales</h4>
                  <h5 className="font-bold text-xs text-slate-600">Délégation Nationale à la Sécurité Routière</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Délégation de Wilaya : <span className="font-bold underline">{school.wilaya}</span> • Commune : <span className="font-bold">{school.commune}</span>
                  </p>
                  <h2 className="text-base font-black mt-3 text-slate-900">
                    DOSSIER DE CANDIDATURE AUX EXAMENS DU PERMIS DE CONDUIRE
                  </h2>
                  <div className="mt-2 inline-block px-3 py-1 bg-emerald-50 border border-emerald-300 rounded font-bold text-xs">
                    Catégorie sollicitée : <span className="text-emerald-700 text-sm font-black">Cat. {student.requested_category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border p-4 rounded-lg bg-slate-50/50">
                  <div>
                    <span className="text-slate-500">Auto-École :</span> <strong>{school.name}</strong>
                    <p className="text-slate-500 text-[11px]">Agrément N° : {school.agrement_number}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="text-slate-500">N° Dossier :</span> <strong>{student.dossier_number}</strong></p>
                    <p><span className="text-slate-500">Date de dépôt :</span> <strong>{student.deposit_date}</strong></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold border-b pb-1 text-xs text-slate-800">
                    RENSEIGNEMENTS RELATIFS AU CANDIDAT :
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <p><span className="text-slate-500">NIN (18 chiffres) :</span> <strong className="font-mono text-sm">{student.nin}</strong></p>
                    <p><span className="text-slate-500">Groupe Sanguin :</span> <strong className="text-rose-700 font-bold">{student.blood_type || 'O+'}</strong></p>
                    <p><span className="text-slate-500">Nom :</span> <strong className="text-sm">{student.last_name}</strong></p>
                    <p><span className="text-slate-500">Prénom :</span> <strong className="text-sm">{student.first_name}</strong></p>
                    <p><span className="text-slate-500">Date et lieu de naissance :</span> <strong>{student.birth_date} à {student.birth_commune} ({student.birth_wilaya})</strong></p>
                    <p><span className="text-slate-500">Situation familiale :</span> <strong>{student.marital_status}</strong></p>
                    <p><span className="text-slate-500">Fils de :</span> <strong>{student.father_name || '...'}</strong></p>
                    <p><span className="text-slate-500">Et de :</span> <strong>{student.mother_full_name || '...'}</strong></p>
                    <p className="col-span-2"><span className="text-slate-500">Adresse de résidence :</span> <strong>{student.address_details || student.address_commune} ({student.address_wilaya})</strong></p>
                    <p><span className="text-slate-500">Téléphone portable :</span> <strong className="font-mono">{student.phone_number}</strong></p>
                    <p><span className="text-slate-500">Email :</span> <strong>{student.email || 'Néant'}</strong></p>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="h-24 border border-dashed rounded flex flex-col justify-between p-2">
                    <span className="text-slate-400">Signature du Candidat :</span>
                    <span className="text-[10px] text-slate-400 font-mono">Lu et approuvé</span>
                  </div>
                  <div className="h-24 border border-dashed rounded flex flex-col justify-between p-2">
                    <span className="text-slate-400">Cachet & Signature de l&apos;Établissement :</span>
                    <span className="text-[10px] text-slate-400 font-mono">{school.owner_name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT 2: Certificat Médical d'Aptitude */}
            {selectedDoc === 'medical' && (
              <div className="space-y-6 text-sm">
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-sm">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</h3>
                  <h4 className="font-bold text-xs text-slate-600">Ministère de la Santé, de la Population et de la Réforme Hospitalière</h4>
                  <h2 className="text-base font-black mt-3 text-slate-900">
                    CERTIFICAT MÉDICAL D&apos;APTITUDE À LA CONDUITE AUTOMOBILE
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Arrêté interministériel du 15 Novembre 1984 fixant la liste des incapacités physiques incompatibles avec la conduite.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="leading-relaxed">
                    Je soussigné, Docteur en Médecine, certifie avoir examiné ce jour le candidat ci-après désigné :
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border grid grid-cols-2 gap-2">
                    <p><span className="text-slate-500">Nom et Prénom :</span> <strong>{student.first_name} {student.last_name}</strong></p>
                    <p><span className="text-slate-500">Date de naissance :</span> <strong>{student.birth_date}</strong></p>
                    <p><span className="text-slate-500">NIN :</span> <strong className="font-mono">{student.nin}</strong></p>
                    <p><span className="text-slate-500">Catégorie sollicitée :</span> <strong className="font-bold text-emerald-700">Catégorie {student.requested_category}</strong></p>
                  </div>
                </div>

                <div className="space-y-2 text-xs border p-3 rounded-lg">
                  <h4 className="font-bold text-slate-800">CONCLUSIONS DE L&apos;EXAMEN MÉDICAL :</h4>
                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                      <span>Le candidat présente l&apos;aptitude physique et mentale requise pour la conduite automobile.</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Port de verres correcteurs ou lentilles de contact obligatoire pendant la conduite.</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Aménagement spécial du véhicule nécessaire (handicap moteur).</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <p className="text-slate-500 mb-8">Fait à {school.commune}, le {student.deposit_date}</p>
                    <p className="font-bold">Signature de l&apos;intéressé</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-8">Cachet et Signature du Médecin Examinateur</p>
                    <div className="h-16 border border-dashed rounded"></div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT 3: Contrat Officiel d'Enseignement (عقد تعليم سياقة السيارات - قرار 14 فبراير 2019) */}
            {selectedDoc === 'contract' && (
              <div className="space-y-8 text-xs text-right print:space-y-6" dir="rtl">
                
                {/* PAGE 1 DU CONTRAT */}
                <div className="border border-slate-300 p-6 rounded-lg bg-white space-y-4 shadow-xs print:border-none print:p-0 print:break-after-page">
                  
                  {/* Header */}
                  <div className="text-center border-b pb-3 space-y-1">
                    <p className="font-bold text-xs">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p className="text-[11px] text-slate-700 font-semibold">مدرسة تعليم السياقة : <strong className="text-slate-900">{school.name}</strong></p>
                    <h2 className="text-base font-black text-slate-900 mt-2 underline">
                      عقد تعليم سياقة السيارات
                    </h2>
                    <p className="text-[10px] text-slate-500">
                      (وفقا للقرار المؤرخ في 14 فبراير سنة 2019 يحدد نموذج عقد التعليم، الجريدة الرسمية رقم 18 بتاريخ 20 مارس 2019)
                    </p>
                  </div>

                  {/* Parties Identification */}
                  <div className="border border-slate-300 rounded p-3 bg-slate-50/60 space-y-2 text-[11px] leading-relaxed">
                    <p className="font-bold text-slate-900 underline">بين الطرفين :</p>
                    <p>
                      <strong>مالك مدرسة تعليم سياقة السيارات :</strong> السيد(ة) <strong>{school.owner_name}</strong>، 
                      المولود في : .................... بـ : ....................، 
                      القاطن بـ : <strong>{school.address}</strong>، 
                      الاعتماد رقم : <strong className="font-mono">{school.agrement_number}</strong> الصادر بتاريخ : <span className="font-mono">{school.agrement_date}</span>.
                    </p>
                    <p>
                      <strong>و المترشح(ة) :</strong> اللقب : <strong>{student.last_name_ar || student.last_name}</strong>، 
                      الاسم : <strong>{student.first_name_ar || student.first_name}</strong>، 
                      المولود(ة) في : <strong className="font-mono">{student.birth_date}</strong> بـ : <strong>{student.birth_commune || 'سطيف'}</strong>، 
                      القاطن(ة) بـ : <strong>{student.address_commune || school.commune} ({student.address_wilaya || school.wilaya})</strong>، 
                      الهاتف : <strong className="font-mono">{student.phone_number}</strong>، 
                      البريد الإلكتروني : <span className="font-mono">{student.email || '—'}</span>.
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      عند الاقتضاء، يمثله (ها) الممثل الشرعي : اللقب : .................... الاسم : .................... الهاتف : ....................
                    </p>
                  </div>

                  {/* Categories checkboxes */}
                  <div className="border border-slate-300 rounded p-2.5 bg-white text-[11px]">
                    <span className="font-bold block mb-1.5 text-slate-900">
                      صنف رخصة السياقة محل التعليم :
                    </span>
                    <div className="grid grid-cols-5 gap-2 text-center font-bold">
                      {[
                        { id: 'A1', label: 'أ1' },
                        { id: 'A', label: 'أ' },
                        { id: 'B', label: 'ب' },
                        { id: 'BE', label: 'هـ(ب)' },
                        { id: 'C1', label: 'ج1' },
                        { id: 'C', label: 'ج' },
                        { id: 'CE', label: 'هـ(ج)' },
                        { id: 'D', label: 'د' },
                        { id: 'DE', label: 'هـ(د)' },
                        { id: 'F', label: 'و' },
                      ].map(cat => {
                        const isChecked = student.requested_category === cat.id;
                        return (
                          <div 
                            key={cat.id} 
                            className={`border rounded px-2 py-1 flex items-center justify-between text-xs ${
                              isChecked ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black' : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            <span>{cat.label}</span>
                            <span className="font-mono">{isChecked ? '☒' : '☐'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Articles 1 to 3 */}
                  <div className="space-y-2 text-[10.5px] leading-relaxed text-slate-800">
                    <p>
                      <strong>أولا - موضوع العقد :</strong> يهدف هذا العقد إلى تحديد حقوق وواجبات كل من الطرفين، يسمح للمترشح(ة) ببلوغ المستوى المطلوب ليكون مؤهلا لاجتياز الاختبارات النظرية والتطبيقية لرخصة السياقة للصنف المذكور أعلاه.
                    </p>
                    <p>
                      <strong>ثانيا - مدة العقد :</strong> يبرم هذا العقد حسب مدة التكوين المطلوبة، على ألا تتجاوز <strong>اثني عشر (12) شهرا</strong> ابتداء من تاريخ توقيعه. وعند انقضاء هذا الأجل، يجب التفاوض مجددا بشأن العقد. يشرع في التكوين بمجرد التوقيع عليه.
                    </p>
                    <p>
                      <strong>ثالثا - التزامات وحقوق مدرسة تعليم السياقة :</strong>
                    </p>
                    <ul className="list-disc pr-5 space-y-1 text-slate-700 text-[10px]">
                      <li><strong>برنامج التكوين ومسيره :</strong> تقدم مدرسة تعليم السياقة تكوينا مطابقا للبرنامج المنصوص عليه في القرار الوزاري المعمول به.</li>
                      <li><strong>الوسائل البيداغوجية والتقنية :</strong> تسخر مدرسة تعليم السياقة جميع الكفاءات الضرورية والسيارات المطابقة للمواصفات.</li>
                      <li>تخصص ساعة واحدة (1 سا) من التكوين للدرس النظري: وتضم 45 إلى 50 دقيقة لتلقين المفاهيم، و 5 إلى 10 دقائق لتقييم الحصيلة.</li>
                      <li>لا يمكن أن تتجاوز مدة السياقة العملية ساعتين (2 سا) متتاليتين لكل مترشح.</li>
                      <li><strong>الإجراءات الإدارية :</strong> تقوم مدرسة تعليم السياقة باسم المترشح ونيابة عنه بجميع الإجراءات الإدارية لتسجيل ملف الامتحان.</li>
                    </ul>
                  </div>

                  <div className="text-left text-[9px] text-slate-400 font-mono pt-2">
                    صفحة 1 من 2
                  </div>
                </div>

                {/* PAGE 2 DU CONTRAT */}
                <div className="border border-slate-300 p-6 rounded-lg bg-white space-y-4 shadow-xs print:border-none print:p-0">
                  
                  {/* Article 4 & 5 */}
                  <div className="space-y-3 text-[10.5px] leading-relaxed text-slate-800">
                    <p>
                      <strong>رابعا - التزامات وحقوق المترشح(ة) :</strong>
                      يلتزم المترشح باحترام النظام الداخلي للمدرسة وكل تعليمة مقدمة ذات صلة بالتكوين المتبع، وتسديد المبالغ المستحقة لمدرسة تعليم السياقة طبقا لكيفيات التسديد المتفق عليها.
                    </p>

                    <div>
                      <p className="font-bold mb-1.5 text-slate-900">
                        خامسا - تكلفة التكوين وكيفيات الدفع :
                      </p>
                      <p className="text-[10px] text-slate-600 mb-2">
                        تحدد تكلفة التكوين المنصوص عليها في هذا العقد حسب الصنف المدروس، كما يأتي :
                      </p>

                      {/* Official Pricing Table from Image 2 */}
                      <table className="w-full text-center border-collapse border border-slate-400 text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-400">
                            <th className="border-l border-slate-400 p-1.5">الخدمات</th>
                            <th className="border-l border-slate-400 p-1.5">عدد الساعات</th>
                            <th className="border-l border-slate-400 p-1.5">التسعيرة بالساعة مع كل الرسوم</th>
                            <th className="p-1.5">التسعيرة الإجمالية مع كل الرسوم</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="border-l border-slate-300 p-2 font-bold">دروس تطبيقية (سياقة ومناورات)</td>
                            <td className="border-l border-slate-300 p-2 font-mono">20 ساعة</td>
                            <td className="border-l border-slate-300 p-2 font-mono">1,500 دج</td>
                            <td className="p-2 font-mono font-bold">30,000 دج</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="border-l border-slate-300 p-2 font-bold">دروس نظرية (قانون المرور والأمن)</td>
                            <td className="border-l border-slate-300 p-2 font-mono">15 ساعة</td>
                            <td className="border-l border-slate-300 p-2 font-mono">800 دج</td>
                            <td className="p-2 font-mono font-bold">12,000 دج</td>
                          </tr>
                          <tr className="bg-emerald-50 font-black border-t-2 border-slate-800 text-emerald-950">
                            <td colSpan={3} className="border-l border-slate-400 p-2 text-right pr-4">
                              السعر الإجمالي مع كل الرسوم :
                            </td>
                            <td className="p-2 font-mono text-xs">
                              {student.total_package_price.toLocaleString()} دج
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p>
                      <strong>كيفيات الدفع :</strong> يتم الدفع حسب مراحل تنفيذ العقد تبعا للكيفيات المتفق عليها بين أطراف العقد (دفعة أولى عند التسجيل قدرها <strong className="font-mono">{student.amount_paid.toLocaleString()} دج</strong>، والباقي قبل اجتياز الامتحان التطبيقي النهائي).
                    </p>

                    <p>
                      <strong>سادسا - تعليق العقد وفسخه :</strong> يمكن تعليق هذا العقد باتفاق مشترك لمدة لا تتجاوز اثني عشر (12) شهرا. ويمكن فسخه باتفاق الطرفين أو في الحالات المنصوص عليها قانونا.
                    </p>

                    <p>
                      <strong>سابعا - طرق الطعن :</strong> في حالة عدم حل النزاع المترتب على عدم احترام الالتزامات وديا، يمكن رفعه أمام المحكمة المختصة إقليميا.
                    </p>
                  </div>

                  {/* Signatures from Image 2 */}
                  <div className="pt-6 border-t-2 border-slate-400 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="space-y-16 p-3 border border-dashed rounded-lg bg-slate-50/50">
                      <div>
                        <p className="font-bold text-slate-800">&quot;قرئ وصودق عليه&quot;</p>
                        <p className="text-[11px] text-slate-500">توقيع المترشح(ة) أو ممثله الشرعي</p>
                      </div>
                      <div className="text-[10px] text-slate-400">بصمة أو إمضاء</div>
                    </div>

                    <div className="space-y-16 p-3 border border-dashed rounded-lg bg-slate-50/50">
                      <div>
                        <p className="font-bold text-slate-800">&quot;قرئ وصودق عليه&quot;</p>
                        <p className="text-[11px] text-slate-500">عن مدرسة تعليم السياقة (توقيع الممثل الشرعي والختم)</p>
                      </div>
                      <div className="text-[10px] text-slate-400">ختم المؤسسة</div>
                    </div>
                  </div>

                  <div className="text-left text-[9px] text-slate-400 font-mono pt-4">
                    حرر بـ : {school.commune} بتاريخ : {student.deposit_date} • صفحة 2 من 2
                  </div>

                </div>

              </div>
            )}

            {/* DOCUMENT 4: Livret Pédagogique d'Apprentissage (A5) */}
            {selectedDoc === 'livret' && (
              <div className="space-y-4 text-xs">
                <div className="text-center border-b pb-3">
                  <h3 className="font-bold text-sm">FICHE DE PROGRESSION PÉDAGOGIQUE (FORMAT A5)</h3>
                  <p className="text-[11px] text-slate-500">Suivi des séances théoriques et pratiques de l&apos;apprenant.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-slate-50 text-[11px]">
                  <p><span className="text-slate-500">Candidat :</span> <strong>{student.first_name} {student.last_name}</strong></p>
                  <p><span className="text-slate-500">N° Dossier :</span> <strong>{student.dossier_number}</strong></p>
                  <p><span className="text-slate-500">Catégorie :</span> <strong>Cat. {student.requested_category}</strong></p>
                  <p><span className="text-slate-500">Établissement :</span> <strong>{school.name}</strong></p>
                </div>

                <div className="border rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 font-bold p-2 text-slate-800">Relevé des Séances Effectuées :</div>
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-2 border-r">Date</th>
                        <th className="p-2 border-r">Module / Contenu de la séance</th>
                        <th className="p-2 border-r">Durée</th>
                        <th className="p-2">Émargement</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 border-r font-mono">2026-10-15</td>
                        <td className="p-2 border-r">Module 1 : Signalisation routière & règles de priorité</td>
                        <td className="p-2 border-r font-mono">1 heure</td>
                        <td className="p-2 text-emerald-600 font-bold">Validé</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 border-r font-mono">2026-10-20</td>
                        <td className="p-2 border-r">Module 2 : Intersections et limitations de vitesse</td>
                        <td className="p-2 border-r font-mono">1 heure</td>
                        <td className="p-2 text-emerald-600 font-bold">Validé</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r font-mono">2026-11-02</td>
                        <td className="p-2 border-r">Pratique : Manoeuvres de stationnement et créneau</td>
                        <td className="p-2 border-r font-mono">1 heure</td>
                        <td className="p-2 text-emerald-600 font-bold">Validé</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex justify-between">
                  <span>Total Réglé : <strong>{student.amount_paid.toLocaleString()} DZD</strong></span>
                  <span>Solde Restant : <strong>{(student.total_package_price - student.amount_paid).toLocaleString()} DZD</strong></span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
