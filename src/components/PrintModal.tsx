'use client';

import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { Student } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export function PrintModal({ isOpen, onClose, student }: PrintModalProps) {
  const { school, lang } = useKreno();
  const [selectedDoc, setSelectedDoc] = useState<'dossier' | 'medical' | 'contract' | 'livret'>('dossier');

  useEscapeKey(isOpen, onClose);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Strict A4 Portrait Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
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
              width: 190mm !important;
              min-height: 277mm !important;
              max-height: 277mm !important;
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

      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      >
        <div className="bg-card-bg rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl border border-card-border overflow-hidden text-slate-900 dark:text-slate-100">
          {/* Modal Topbar */}
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-slate-50 dark:bg-card-bg shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary border border-primary-subtle-border flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-200">
                  Édition & Impression des Documents Réglementaires (Format A4)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Candidat: <strong className="text-slate-800 dark:text-slate-200">{student.first_name} {student.last_name}</strong> ({student.dossier_number}) • Conforme aux modèles du Ministère
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition cursor-pointer"
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

          {/* Document Navigation Tabs */}
          <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-750 flex items-center gap-2 shrink-0 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedDoc('dossier')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedDoc === 'dossier' 
                  ? 'bg-card-bg text-blue-800 dark:text-blue-300 shadow-xs border border-card-border' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <span>1. Dossier de Candidature (A4)</span>
            </button>

            <button
              onClick={() => setSelectedDoc('medical')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedDoc === 'medical' 
                  ? 'bg-card-bg text-blue-800 dark:text-blue-300 shadow-xs border border-card-border' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <span>2. Certificat Médical d&apos;Aptitude (A4)</span>
            </button>

            <button
              onClick={() => setSelectedDoc('contract')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedDoc === 'contract' 
                  ? 'bg-card-bg text-blue-800 dark:text-blue-300 shadow-xs border border-card-border' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <span>3. Contrat d&apos;Apprentissage (A4 • 2 Pages)</span>
            </button>

            <button
              onClick={() => setSelectedDoc('livret')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedDoc === 'livret' 
                  ? 'bg-card-bg text-blue-800 dark:text-blue-300 shadow-xs border border-card-border' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <span>4. Livret Pédagogique d&apos;Apprentissage (A4)</span>
            </button>
          </div>

          {/* Document Preview Canvas with Realistic A4 Sheets */}
          <div className="p-8 overflow-y-auto flex-1 bg-slate-300/70 dark:bg-slate-950 flex flex-col items-center gap-8">
            <div id="printable-a4-document" className="flex flex-col items-center gap-8 w-full">
              
              {/* DOCUMENT 1: Demande / Dossier de candidature (1 Feuille A4) */}
              {selectedDoc === 'dossier' && (
                <div 
                  className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans p-8 flex flex-col justify-between"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                    padding: '12mm 15mm',
                  }}
                >
                  <div className="space-y-6 text-sm">
                    <div className="text-center border-b-2 border-black pb-4">
                      <h3 className="font-extrabold text-sm text-black">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</h3>
                      <h4 className="font-bold text-xs text-slate-700">Ministère de l&apos;Intérieur, des Collectivités Locales et de l&apos;Aménagement du Territoire</h4>
                      <h5 className="font-bold text-xs text-slate-700">Délégation Nationale à la Sécurité Routière</h5>
                      <p className="text-xs text-slate-600 mt-1 font-semibold">
                        Wilaya : <span className="font-bold underline">{school.wilaya}</span> • Commune : <span className="font-bold">{school.commune}</span>
                      </p>
                      <h2 className="text-base font-black mt-3 text-black">
                        DOSSIER DE CANDIDATURE AUX EXAMENS DU PERMIS DE CONDUIRE
                      </h2>
                      <div className="mt-2 inline-block px-4 py-1 bg-slate-100 border-2 border-black rounded font-bold text-xs">
                        Catégorie sollicitée : <span className="text-black text-sm font-black">Cat. {student.requested_category}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border-2 border-black p-4 bg-slate-50/50">
                      <div>
                        <span className="text-slate-600">Auto-École :</span> <strong className="text-black">{school.name}</strong>
                        <p className="text-slate-600 text-[11px] font-mono">Agrément N° : {school.agrement_number}</p>
                      </div>
                      <div className="text-right">
                        <p><span className="text-slate-600">N° Dossier :</span> <strong className="font-mono text-black">{student.dossier_number}</strong></p>
                        <p><span className="text-slate-600">Date de dépôt :</span> <strong className="font-mono text-black">{student.deposit_date}</strong></p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-extrabold border-b-2 border-black pb-1 text-xs text-black uppercase tracking-wider">
                        Renseignements relatifs au candidat :
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs border border-black p-3 bg-white">
                        <p><span className="text-slate-600">NIN (18 chiffres) :</span> <strong className="font-mono text-sm text-black">{student.nin}</strong></p>
                        <p><span className="text-slate-600">Groupe Sanguin :</span> <strong className="text-black font-black">{student.blood_type || 'O+'}</strong></p>
                        <p><span className="text-slate-600">Nom :</span> <strong className="text-sm text-black">{student.last_name} ({student.last_name_ar || ''})</strong></p>
                        <p><span className="text-slate-600">Prénom :</span> <strong className="text-sm text-black">{student.first_name} ({student.first_name_ar || ''})</strong></p>
                        <p><span className="text-slate-600">Date et lieu de naissance :</span> <strong className="text-black">{student.birth_date} à {student.birth_commune} ({student.birth_wilaya})</strong></p>
                        <p><span className="text-slate-600">Situation familiale :</span> <strong className="text-black">{student.marital_status}</strong></p>
                        <p><span className="text-slate-600">Fils de :</span> <strong className="text-black">{student.father_name || '...'}</strong></p>
                        <p><span className="text-slate-600">Et de :</span> <strong className="text-black">{student.mother_full_name || '...'}</strong></p>
                        <p className="col-span-2"><span className="text-slate-600">Adresse de résidence :</span> <strong className="text-black">{student.address_details || student.address_commune} ({student.address_wilaya})</strong></p>
                        <p><span className="text-slate-600">Téléphone portable :</span> <strong className="font-mono text-black">{student.phone_number}</strong></p>
                        <p><span className="text-slate-600">Email :</span> <strong className="text-black">{student.email || 'Néant'}</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-black pt-4 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="h-28 border-2 border-black p-3 flex flex-col justify-between bg-white">
                      <span className="font-bold text-black">Signature du Candidat :</span>
                      <span className="text-[10px] text-slate-500 font-mono">Lu et approuvé</span>
                    </div>
                    <div className="h-28 border-2 border-black p-3 flex flex-col justify-between bg-white">
                      <span className="font-bold text-black">Cachet & Signature de l&apos;Auto-École :</span>
                      <span className="text-[10px] text-slate-700 font-mono">{school.owner_name} • Agrément {school.agrement_number}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENT 2: Certificat Médical d'Aptitude (1 Feuille A4) */}
              {selectedDoc === 'medical' && (
                <div 
                  className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans p-8 flex flex-col justify-between"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                    padding: '12mm 15mm',
                  }}
                >
                  <div className="space-y-6 text-sm">
                    <div className="text-center border-b-2 border-black pb-4">
                      <h3 className="font-extrabold text-sm text-black">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</h3>
                      <h4 className="font-bold text-xs text-slate-700">Ministère de la Santé, de la Population et de la Réforme Hospitalière</h4>
                      <h2 className="text-base font-black mt-3 text-black">
                        CERTIFICAT MÉDICAL D&apos;APTITUDE À LA CONDUITE AUTOMOBILE
                      </h2>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Arrêté interministériel du 15 Novembre 1984 fixant la liste des incapacités physiques incompatibles avec la conduite.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <p className="leading-relaxed text-black">
                        Je soussigné, Docteur en Médecine, certifie avoir examiné ce jour le candidat ci-après désigné :
                      </p>
                      <div className="bg-slate-50 p-4 border-2 border-black grid grid-cols-2 gap-3">
                        <p><span className="text-slate-600">Nom et Prénom :</span> <strong className="text-black">{student.first_name} {student.last_name}</strong></p>
                        <p><span className="text-slate-600">Date de naissance :</span> <strong className="font-mono text-black">{student.birth_date}</strong></p>
                        <p><span className="text-slate-600">NIN :</span> <strong className="font-mono text-black">{student.nin}</strong></p>
                        <p><span className="text-slate-600">Catégorie sollicitée :</span> <strong className="font-black text-black">Catégorie {student.requested_category}</strong></p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs border-2 border-black p-4 bg-white">
                      <h4 className="font-extrabold text-black uppercase tracking-wider">Conclusions de l&apos;Examen Médical :</h4>
                      <div className="space-y-2 pt-1 text-black">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded text-black" />
                          <span>Le candidat présente l&apos;aptitude physique et mentale requise pour la conduite automobile.</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded text-black" />
                          <span>Port de verres correcteurs ou lentilles de contact obligatoire pendant la conduite.</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded text-black" />
                          <span>Aménagement spécial du véhicule nécessaire (handicap moteur).</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-black pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                      <p className="text-slate-600 mb-10">Fait à {school.commune}, le {student.deposit_date}</p>
                      <p className="font-black text-black">Signature du candidat</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-4">Cachet et Signature du Médecin Examinateur</p>
                      <div className="h-20 border-2 border-dashed border-black rounded-lg"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENT 3: Contrat d'Enseignement (2 Pages A4 distinctes) */}
              {selectedDoc === 'contract' && (
                <div className="flex flex-col items-center gap-8 w-full" dir="rtl">
                  
                  {/* CONTRAT PAGE 1 (Feuille A4 stricte) */}
                  <div 
                    className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans p-8 flex flex-col justify-between text-right"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      boxSizing: 'border-box',
                      padding: '12mm 15mm',
                    }}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="text-center border-b-2 border-black pb-3 space-y-1">
                        <p className="font-extrabold text-xs text-black">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                        <p className="text-[11px] text-black font-semibold">مدرسة تعليم السياقة : <strong className="text-black">{school.name}</strong></p>
                        <h2 className="text-base font-black text-black mt-2 underline">
                          عقد تعليم سياقة السيارات
                        </h2>
                        <p className="text-[9.5px] text-slate-600">
                          (وفقا للقرار المؤرخ في 14 فبراير سنة 2019 يحدد نموذج عقد التعليم، الجريدة الرسمية رقم 18 بتاريخ 20 مارس 2019)
                        </p>
                      </div>

                      {/* Parties Identification */}
                      <div className="border-2 border-black p-3 bg-white space-y-2 text-[11px] leading-relaxed text-black">
                        <p className="font-black text-black underline">بين الطرفين :</p>
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
                        <p className="text-slate-600 text-[10px]">
                          عند الاقتضاء، يمثله (ها) الممثل الشرعي : اللقب : .................... الاسم : .................... الهاتف : ....................
                        </p>
                      </div>

                      {/* Categories checkboxes */}
                      <div className="border-2 border-black p-2.5 bg-white text-[11px]">
                        <span className="font-black block mb-1.5 text-black">
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
                                className={`border-2 rounded px-2 py-1 flex items-center justify-between text-xs ${
                                  isChecked ? 'bg-slate-100 border-black text-black font-black' : 'border-slate-300 text-slate-500'
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
                      <div className="space-y-2 text-[10.5px] leading-relaxed text-black">
                        <p>
                          <strong>أولا - موضوع العقد :</strong> يهدف هذا العقد إلى تحديد حقوق وواجبات كل من الطرفين، يسمح للمترشح(ة) ببلوغ المستوى المطلوب ليكون مؤهلا لاجتياز الاختبارات النظرية والتطبيقية لرخصة السياقة للصنف المذكور أعلاه.
                        </p>
                        <p>
                          <strong>ثانيا - مدة العقد :</strong> يبرم هذا العقد حسب مدة التكوين المطلوبة، على ألا تتجاوز <strong>اثني عشر (12) شهرا</strong> ابتداء من تاريخ توقيعه. وعند انقضاء هذا الأجل، يجب التفاوض مجددا بشأن العقد. يشرع في التكوين بمجرد التوقيع عليه.
                        </p>
                        <p>
                          <strong>ثالثا - التزامات وحقوق مدرسة تعليم السياقة :</strong>
                        </p>
                        <ul className="list-disc pr-5 space-y-1 text-black text-[10px]">
                          <li><strong>برنامج التكوين ومسيره :</strong> تقدم مدرسة تعليم السياقة تكوينا مطابقا للبرنامج المنصوص عليه في القرار الوزاري المعمول به.</li>
                          <li><strong>الوسائل البيداغوجية والتقنية :</strong> تسخر مدرسة تعليم السياقة جميع الكفاءات الضرورية والسيارات المطابقة للمواصفات.</li>
                          <li>تخصص ساعة واحدة (1 سا) من التكوين للدرس النظري: وتضم 45 إلى 50 دقيقة لتلقين المفاهيم، و 5 إلى 10 دقائق لتقييم الحصيلة.</li>
                          <li>لا يمكن أن تتجاوز مدة السياقة العملية ساعتين (2 سا) متتاليتين لكل مترشح.</li>
                          <li><strong>الإجراءات الإدارية :</strong> تقوم مدرسة تعليم السياقة باسم المترشح ونيابة عنه بجميع الإجراءات الإدارية لتسجيل ملف الامتحان.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-700 pt-2 border-t border-black font-mono">
                      <span>عقد تعليم السياقة • مدرسة {school.name}</span>
                      <span className="font-black border-2 border-black px-2 py-0.5 text-black">1/2</span>
                    </div>
                  </div>

                  {/* CONTRAT PAGE 2 (Feuille A4 stricte) */}
                  <div 
                    className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans p-8 flex flex-col justify-between text-right"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      boxSizing: 'border-box',
                      padding: '12mm 15mm',
                    }}
                  >
                    <div className="space-y-4">
                      {/* Article 4 & 5 */}
                      <div className="space-y-3 text-[10.5px] leading-relaxed text-black">
                        <p>
                          <strong>رابعا - التزامات وحقوق المترشح(ة) :</strong>
                          يلتزم المترشح باحترام النظام الداخلي للمدرسة وكل تعليمة مقدمة ذات صلة بالتكوين المتبع، وتسديد المبالغ المستحقة لمدرسة تعليم السياقة طبقا لكيفيات التسديد المتفق عليها.
                        </p>

                        <div>
                          <p className="font-black mb-1.5 text-black">
                            خامسا - تكلفة التكوين وكيفيات الدفع :
                          </p>
                          <p className="text-[10px] text-slate-700 mb-2">
                            تحدد تكلفة التكوين المنصوص عليها في هذا العقد حسب الصنف المدروس، كما يأتي :
                          </p>

                          {/* Official Pricing Table from Image 2 */}
                          <table className="w-full text-center border-collapse border-2 border-black text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 font-black border-b-2 border-black text-black">
                                <th className="border-l border-black p-1.5">الخدمات</th>
                                <th className="border-l border-black p-1.5">عدد الساعات</th>
                                <th className="border-l border-black p-1.5">التسعيرة بالساعة مع كل الرسوم</th>
                                <th className="p-1.5">التسعيرة الإجمالية مع كل الرسوم</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-black">
                                <td className="border-l border-black p-2 font-bold">دروس تطبيقية (سياقة ومناورات)</td>
                                <td className="border-l border-black p-2 font-mono">20 ساعة</td>
                                <td className="border-l border-black p-2 font-mono">1,500 دج</td>
                                <td className="p-2 font-mono font-bold">30,000 دج</td>
                              </tr>
                              <tr className="border-b border-black">
                                <td className="border-l border-black p-2 font-bold">دروس نظرية (قانون المرور والأمن)</td>
                                <td className="border-l border-black p-2 font-mono">15 ساعة</td>
                                <td className="border-l border-black p-2 font-mono">800 دج</td>
                                <td className="p-2 font-mono font-bold">12,000 دج</td>
                              </tr>
                              <tr className="bg-slate-100 font-black border-t-2 border-black text-black">
                                <td colSpan={3} className="border-l border-black p-2 text-right pr-4">
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
                      <div className="pt-6 border-t-2 border-black grid grid-cols-2 gap-8 text-center text-xs">
                        <div className="space-y-16 p-4 border-2 border-black bg-white">
                          <div>
                            <p className="font-black text-black">&quot;قرئ وصودق عليه&quot;</p>
                            <p className="text-[11px] text-slate-700">توقيع المترشح(ة) أو ممثله الشرعي</p>
                          </div>
                          <div className="text-[10px] text-slate-500">بصمة أو إمضاء</div>
                        </div>

                        <div className="space-y-16 p-4 border-2 border-black bg-white">
                          <div>
                            <p className="font-black text-black">&quot;قرئ وصودق عليه&quot;</p>
                            <p className="text-[11px] text-slate-700">عن مدرسة تعليم السياقة (توقيع الممثل الشرعي والختم)</p>
                          </div>
                          <div className="text-[10px] text-slate-500">ختم المؤسسة</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-700 pt-2 border-t border-black font-mono">
                      <span>حرر بـ : {school.commune} بتاريخ : {student.deposit_date}</span>
                      <span className="font-black border-2 border-black px-2 py-0.5 text-black">2/2</span>
                    </div>
                  </div>

                </div>
              )}

              {/* DOCUMENT 4: Livret Pédagogique d'Apprentissage (1 Feuille A4) */}
              {selectedDoc === 'livret' && (
                <div 
                  className="a4-page-sheet bg-white border border-slate-300 shadow-2xl text-slate-900 font-sans p-8 flex flex-col justify-between"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                    padding: '12mm 15mm',
                  }}
                >
                  <div className="space-y-6 text-xs">
                    <div className="text-center border-b-2 border-black pb-3">
                      <h3 className="font-black text-sm text-black">FICHE DE PROGRESSION PÉDAGOGIQUE (FORMAT A4)</h3>
                      <p className="text-[11px] text-slate-600">Suivi des séances théoriques et pratiques de l&apos;apprenant.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-2 border-black p-3 bg-slate-50 text-[11px]">
                      <p><span className="text-slate-600">Candidat :</span> <strong className="text-black">{student.first_name} {student.last_name}</strong></p>
                      <p><span className="text-slate-600">N° Dossier :</span> <strong className="font-mono text-black">{student.dossier_number}</strong></p>
                      <p><span className="text-slate-600">Catégorie :</span> <strong className="font-black text-black">Cat. {student.requested_category}</strong></p>
                      <p><span className="text-slate-600">Établissement :</span> <strong className="text-black">{school.name}</strong></p>
                    </div>

                    <div className="border-2 border-black overflow-hidden text-xs">
                      <div className="bg-slate-100 font-black p-2 border-b-2 border-black text-black">Relevé des Séances Effectuées :</div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-black">
                          <tr>
                            <th className="p-2 border-r border-black font-bold">Date</th>
                            <th className="p-2 border-r border-black font-bold">Module / Contenu de la séance</th>
                            <th className="p-2 border-r border-black font-bold">Durée</th>
                            <th className="p-2 font-bold">Émargement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          <tr>
                            <td className="p-2 border-r border-black font-mono">2026-10-15</td>
                            <td className="p-2 border-r border-black">Module 1 : Signalisation routière & règles de priorité</td>
                            <td className="p-2 border-r border-black font-mono">1 heure</td>
                            <td className="p-2 text-black font-black">Validé</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-black font-mono">2026-10-20</td>
                            <td className="p-2 border-r border-black">Module 2 : Intersections et limitations de vitesse</td>
                            <td className="p-2 border-r border-black font-mono">1 heure</td>
                            <td className="p-2 text-black font-black">Validé</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-black font-mono">2026-11-02</td>
                            <td className="p-2 border-r border-black">Pratique : Manoeuvres de stationnement et créneau</td>
                            <td className="p-2 border-r border-black font-mono">1 heure</td>
                            <td className="p-2 text-black font-black">Validé</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-slate-50 border-2 border-black text-xs flex justify-between">
                      <span>Total Réglé : <strong className="font-mono text-black">{student.amount_paid.toLocaleString()} DZD</strong></span>
                      <span>Solde Restant : <strong className="font-mono text-black">{(student.total_package_price - student.amount_paid).toLocaleString()} DZD</strong></span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-700 pt-2 border-t border-black font-mono">
                    <span>{school.name} • Agrément {school.agrement_number}</span>
                    <span className="font-black border-2 border-black px-2 py-0.5 text-black">1/1</span>
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
