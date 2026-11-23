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
        <div className="bg-card-bg rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl border border-card-border overflow-hidden text-slate-900 dark:text-slate-100">
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

              {/* DOCUMENT 3: Contrat d'Enseignement (Exact 1-Page Replica from Photo - Full Page Standard Margin) */}
              {selectedDoc === 'contract' && (
                <div className="flex flex-col items-center w-full" dir="rtl">
                  
                  {/* CONTRAT PAGE UNIQUE - FULL SIZE STANDARD MARGINS */}
                  <div 
                    className="a4-page-sheet bg-white text-black font-sans flex flex-col justify-between"
                    style={{
                      width: '210mm',
                      height: '297mm',
                      minHeight: '297mm',
                      maxHeight: '297mm',
                      boxSizing: 'border-box',
                      padding: '16mm 20mm 15mm 20mm', /* Standard official document margins: 20mm left/right, 16mm top */
                      fontFamily: '"Times New Roman", Times, "Amiri", "Traditional Arabic", serif, sans-serif',
                      fontSize: '12px',
                      lineHeight: '1.55',
                      color: '#000',
                      backgroundColor: '#fff',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="flex flex-col justify-between h-full">
                      {/* Top Header Section */}
                      <div className="relative mb-2">
                        {/* Centered Top Country Name */}
                        <div className="text-center font-bold text-[14px] tracking-wide mb-1">
                          الجمهورية الجزائرية الديمقراطية الشعبية
                        </div>

                        {/* Top Left School Name Field */}
                        <div className="flex justify-end text-[12px] font-bold mt-1 mb-2">
                          <div className="flex items-baseline">
                            <span className="whitespace-nowrap">مدرسة تعليم السياقة : </span>
                            <span className="inline-block border-b border-dotted border-black font-semibold px-2 min-w-[220px] text-center">
                              {school.name || ''}
                            </span>
                          </div>
                        </div>

                        {/* Main Title */}
                        <div className="text-center mt-2 mb-2">
                          <h2 className="text-[21px] font-black tracking-normal inline-block border-b-2 border-black pb-0.5">
                            عقد تعليم سياقة السيارات
                          </h2>
                          <div className="text-[9.5px] font-normal text-slate-800 mt-1.5 space-y-0.5 leading-relaxed">
                            <p>وفقا للقرار المؤرخ في 14 فبراير سنة 2019، يحدد نموذج البطاقة المهنية لمدرسة تعليم السياقة</p>
                            <p>ونموذج عقد التعليم، الجريدة الرسمية رقم 18 بتاريخ 20 مارس 2019</p>
                          </div>
                        </div>
                      </div>

                      {/* Party 1: مالك مدرسة تعليم سياقة السيارات */}
                      <div className="mt-1 text-[11.5px] leading-[1.85]">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-bold text-[12.5px]">مالك مدرسة تعليم سياقة السيارات :</span>
                          <div className="flex items-center gap-6">
                            <span>بين :</span>
                            <div className="flex items-baseline">
                              <span>الاعتماد رقم : </span>
                              <span className="inline-block border-b border-dotted border-black font-bold font-mono px-2 min-w-[120px] text-center">
                                {school.agrement_number || ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="flex-1 flex items-baseline">
                            <span className="whitespace-nowrap">السيد (ة) : </span>
                            <span className="inline-block border-b border-dotted border-black font-bold px-2 flex-1 text-center">
                              {school.owner_name || ''}
                            </span>
                          </div>
                          <div className="flex items-baseline mr-4">
                            <span className="whitespace-nowrap">الصادر في : </span>
                            <span className="inline-block border-b border-dotted border-black font-mono px-2 min-w-[130px] text-center">
                              {school.agrement_date || ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="w-[60%] flex items-baseline">
                            <span className="whitespace-nowrap">المولود (ة) في : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1"></span>
                          </div>
                          <div className="w-[40%] flex items-baseline mr-4">
                            <span className="whitespace-nowrap">بـ : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1"></span>
                          </div>
                        </div>

                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap">العنوان : </span>
                          <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                            {school.address || ''}
                          </span>
                        </div>

                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap">الممثل من طرف السيد (ة) : </span>
                          <span className="inline-block border-b border-dotted border-black px-2 flex-1"></span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="w-[60%] flex items-baseline">
                            <span className="whitespace-nowrap">المولود (ة) في : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1"></span>
                          </div>
                          <div className="w-[40%] flex items-baseline mr-4">
                            <span className="whitespace-nowrap">بـ : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1"></span>
                          </div>
                        </div>

                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap">اسم الشركة : </span>
                          <span className="inline-block border-b border-dotted border-black font-bold px-2 flex-1 text-center">
                            {school.name || ''}
                          </span>
                        </div>

                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap">العنوان المهني : </span>
                          <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                            {school.address || ''}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="flex-1 flex items-baseline">
                            <span className="whitespace-nowrap">بلدية : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                              {school.commune || ''}
                            </span>
                          </div>
                          <div className="flex-1 flex items-baseline mx-3">
                            <span className="whitespace-nowrap">دائرة : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                              {school.commune || ''}
                            </span>
                          </div>
                          <div className="flex-1 flex items-baseline">
                            <span className="whitespace-nowrap">ولاية : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                              {school.wilaya || ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="w-[50%] flex items-baseline">
                            <span className="whitespace-nowrap">الهاتف : </span>
                            <span 
                              dir="ltr" 
                              className="inline-block border-b border-dotted border-black font-mono font-semibold px-2 flex-1 text-center tracking-wider"
                            >
                              {school.phone || ''}
                            </span>
                          </div>
                          <div className="w-[50%] flex items-baseline mr-4">
                            <span className="whitespace-nowrap">البريد الإلكتروني : </span>
                            <span 
                              dir="ltr" 
                              className="inline-block border-b border-dotted border-black font-mono text-[10.5px] px-2 flex-1 text-center"
                            >
                              {school.email || ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap">صنف (أصناف) رخصة السياقة محل التعليم : </span>
                          <span className="inline-block border-b border-dotted border-black font-bold font-mono px-2 flex-1 text-center">
                            {student.requested_category || ''}
                          </span>
                        </div>

                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap">رقم التأمين على الحوادث لفائدة المترشح (ة) : </span>
                          <span className="inline-block border-b border-dotted border-black px-2 flex-1"></span>
                        </div>
                      </div>

                      {/* Party 2: والمترشح (ة) */}
                      <div className="mt-2 text-[11.5px] leading-[1.85]">
                        <div className="mb-0.5">
                          <span className="font-bold text-[12.5px]">والمترشح (ة) :</span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="w-[50%] flex items-baseline">
                            <span className="whitespace-nowrap">اللقب : </span>
                            <span className="inline-block border-b border-dotted border-black font-bold px-2 flex-1 text-center">
                              {student.last_name_ar || student.last_name || ''}
                            </span>
                          </div>
                          <div className="w-[50%] flex items-baseline mr-4">
                            <span className="whitespace-nowrap">الاسم : </span>
                            <span className="inline-block border-b border-dotted border-black font-bold px-2 flex-1 text-center">
                              {student.first_name_ar || student.first_name || ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="w-[60%] flex items-baseline">
                            <span className="whitespace-nowrap">المولود (ة) في : </span>
                            <span className="inline-block border-b border-dotted border-black font-mono px-2 flex-1 text-center">
                              {student.birth_date || ''}
                            </span>
                          </div>
                          <div className="w-[40%] flex items-baseline mr-4">
                            <span className="whitespace-nowrap">بـ : </span>
                            <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                              {student.birth_commune || ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap">القاطن (ة) : </span>
                          <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                            {student.address_details || student.address_commune ? `${student.address_details || ''} ${student.address_commune || ''} (${student.address_wilaya || ''})` : ''}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div className="w-[50%] flex items-baseline">
                            <span className="whitespace-nowrap">الهاتف : </span>
                            <span 
                              dir="ltr" 
                              className="inline-block border-b border-dotted border-black font-bold font-mono px-2 flex-1 text-center tracking-wider"
                            >
                              {student.phone_number || ''}
                            </span>
                          </div>
                          <div className="w-[50%] flex items-baseline mr-4">
                            <span className="whitespace-nowrap">البريد الإلكتروني : </span>
                            <span 
                              dir="ltr" 
                              className="inline-block border-b border-dotted border-black font-mono text-[10.5px] px-2 flex-1 text-center"
                            >
                              {student.email || ''}
                            </span>
                          </div>
                        </div>

                        {/* Guardian if applicable */}
                        <div className="mt-1">
                          <div className="mb-0.5">
                            <span className="font-bold text-[11.5px]">عند الاقتضاء، يمثله (ها) الممثل الشرعي :</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <div className="w-[50%] flex items-baseline">
                              <span className="whitespace-nowrap">اللقب : </span>
                              <span className="inline-block border-b border-dotted border-black font-semibold px-2 flex-1 text-center">
                                {student.contract_details?.guardian_surname || ''}
                              </span>
                            </div>
                            <div className="w-[50%] flex items-baseline mr-4">
                              <span className="whitespace-nowrap">الاسم : </span>
                              <span className="inline-block border-b border-dotted border-black font-semibold px-2 flex-1 text-center">
                                {student.contract_details?.guardian_name || ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline">
                            <div className="w-[60%] flex items-baseline">
                              <span className="whitespace-nowrap">المولود (ة) في : </span>
                              <span className="inline-block border-b border-dotted border-black font-mono px-2 flex-1 text-center">
                                {student.contract_details?.guardian_birth_date || ''}
                              </span>
                            </div>
                            <div className="w-[40%] flex items-baseline mr-4">
                              <span className="whitespace-nowrap">بـ : </span>
                              <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                                {student.contract_details?.guardian_birth_place || ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline">
                            <div className="w-[60%] flex items-baseline">
                              <span className="whitespace-nowrap">العنوان : </span>
                              <span className="inline-block border-b border-dotted border-black px-2 flex-1 text-center">
                                {student.contract_details?.guardian_address || ''}
                              </span>
                            </div>
                            <div className="w-[40%] flex items-baseline mr-4">
                              <span className="whitespace-nowrap">الهاتف : </span>
                              <span 
                                dir="ltr"
                                className="inline-block border-b border-dotted border-black font-mono px-2 flex-1 text-center tracking-wider"
                              >
                                {student.contract_details?.guardian_phone || ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Centered Sentence */}
                      <div className="text-center font-bold text-[14px] my-2">
                        تم الاتفاق على ما يأتي :
                      </div>

                      {/* أولا - موضوع العقد : */}
                      <div className="text-[11px] leading-[1.6]">
                        <p className="font-bold text-[12px] mb-0.5">
                          أولا - موضوع العقد :
                        </p>
                        <p className="text-justify">
                          يهدف هذا العقد إلى تحديد حقوق وواجبات كل من الطرفين، يسمح للمترشح (ة) ببلوغ المستوى المطلوب ليكون مؤهلا لاجتياز الاختبارات النظرية والتطبيقية لرخصة السياقة لصنف من الأصناف الآتية :
                        </p>

                        {/* Category Checkboxes Row - Full width with official spacing */}
                        <div className="flex items-center justify-between my-2 font-bold text-[11.5px] px-1" dir="rtl">
                          {[
                            { code: 'A1', label: 'أ1' },
                            { code: 'A', label: 'أ' },
                            { code: 'B', label: 'ب' },
                            { code: 'C1', label: 'ج1' },
                            { code: 'C', label: 'ج' },
                            { code: 'D', label: 'د' },
                            { code: 'F', label: 'و' },
                            { code: 'BE', label: 'ب(هـ)' },
                            { code: 'C1E', label: 'ج1(هـ)' },
                            { code: 'CE', label: 'ج(هـ)' },
                            { code: 'DE', label: 'د(هـ)' },
                          ].map((cat) => {
                            const isSelected = student.requested_category === cat.code;
                            return (
                              <div key={cat.code} className="flex items-center gap-1.5">
                                <span>{cat.label}</span>
                                <div className="w-4 h-4 border border-black flex items-center justify-center font-mono text-[9px] bg-white">
                                  {isSelected ? '✓' : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ثانيا - مدة العقد : */}
                      <div className="text-[11px] leading-[1.6] mt-1">
                        <p className="font-bold text-[12px] mb-0.5">
                          ثانيا - مدة العقد :
                        </p>
                        <p className="text-justify">
                          يبرم هذا العقد حسب مدة التكوين المطلوبة، على ألا تتجاوز اثني عشر (12) شهرا، ابتداء من تاريخ توقيعه. وعند انقضاء هذا الأجل، يجب التفاوض مجددا بشأن العقد.
                        </p>
                        <p className="text-justify">
                          - يشرع في التكوين بمجرد التوقيع عليه.
                        </p>
                      </div>

                      {/* ثالثا - التزامات وحقوق مدرسة تعليم السياقة : */}
                      <div className="text-[10.5px] leading-[1.55] mt-1 space-y-0.5">
                        <p className="font-bold text-[12px] mb-0.5">
                          ثالثا - التزامات وحقوق مدرسة تعليم السياقة :
                        </p>
                        <p className="text-justify">
                          تتعهد مدرسة تعليم السياقة بتعليم تقنيات سياقة السيارات من خلال تزويد المترشح(ة) بالوسائل اللازمة للوصول إلى المستوى المطلوب وتقييمه في حدود أماكن الامتحان المتاحة لاختبارات رخصة السياقة. في حالة الفشل في الامتحان وبعد موافقة المترشح (ة)، تتعهد مدرسة تعليم السياقة من خلال تكوين تكميلي، بتقديم المترشح (ة) ضمن نفس الشروط في أقرب الآجال وفي حدود أماكن الامتحان التي يتم تخصيصها لها من قبل الإدارة.
                        </p>
                        <p className="text-justify">
                          <span className="font-bold">1 - برنامج التكوين ومسيره :</span> تقدم مدرسة تعليم السياقة تكوينا مطابقا للبرنامج المنصوص عليه في القرار المؤرخ في 9 جمادى الثانية عام 1440 الموافق 14 فبراير سنة 2019 الذي يحدد برنامج تعليم سياقة السيارات.
                        </p>
                        <p className="text-justify">
                          يتم تحديد الرزنامة التقديرية للحصص التعليمية من قبل مدرسة تعليم السياقة بالاتفاق مع المترشح (ة)، وتسلم نسخة منها لهذا الأخير (ة).
                        </p>
                        <p className="text-justify">
                          يترتب على كل حصة تقييم :
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CONTRAT PAGE 2 - EXACT PHOTOCOPY REPLICA FROM IMAGE */}
                  <div 
                    className="a4-page-sheet bg-white text-black font-sans flex flex-col justify-between mt-8"
                    style={{
                      width: '210mm',
                      height: '297mm',
                      minHeight: '297mm',
                      maxHeight: '297mm',
                      boxSizing: 'border-box',
                      padding: '16mm 20mm 15mm 20mm',
                      fontFamily: '"Times New Roman", Times, "Amiri", "Traditional Arabic", serif, sans-serif',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      color: '#000',
                      backgroundColor: '#fff',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="flex flex-col justify-between h-full text-justify">
                      
                      {/* Top continuation of Article 3 */}
                      <div className="space-y-1.5 text-[10.5px] leading-[1.5]">
                        <p>
                          - تعلم مدرسة تعليم السياقة المترشح(ة) بمدى تقدمه في التكوين.
                        </p>
                        <p>
                          - تخصص ساعة واحدة من التكوين للدرس النظري، وتقسم الساعة المخصصة للسياقة في الطرق، عموما، على النحو الآتي :
                        </p>
                        <div className="pr-4 space-y-0.5 text-[10px]">
                          <p>• خمس (5) دقائق : تكرس لتحديد الأهداف بالاستناد إلى كتيب التعليم الذي يسلمه المركز الوطني لرخص السياقة،</p>
                          <p>• من خمس وأربعين (45) إلى خمسين (50) دقيقة : تكرس للسياقة الفعلية قصد بلوغ الأهداف المحددة وتقييم التدريب،</p>
                          <p>• من خمس (5) إلى عشر (10) دقائق : لتقديم الحصيلة والتعليقات.</p>
                        </div>
                        <p>
                          لا يمكن أن تتجاوز مدة السياقة العملية ساعتين (2) متتاليتين لكل مترشح(ة).
                        </p>
                        <p>
                          يتم تحديد كيفيات إلغاء الحصص و/أو الامتحانات، باتفاق الطرفين.
                        </p>

                        <p className="pt-0.5">
                          <span className="font-bold">2 - الوسائل البيداغوجية والتقنية :</span> تسخر مدرسة تعليم السياقة جميع الكفاءات الضرورية لكي يبلغ المترشح (ة) مستوى الأداء المطلوب، وتقدم الدروس النظرية والتطبيقية في مدرسة تعليم السياقة، حصريا بواسطة ممرنين حائزين الأصناف المدرسّة. ويجب أن تكون المركبات المستعملة مطابقة للمواصفات الواردة في القرار المؤرخ في 9 جمادى الثانية عام 1440 الموافق 14 فبراير سنة 2019 الذي يحدد دفتر شروط مدارس تعليم السياقة.
                        </p>

                        <p className="pt-0.5">
                          <span className="font-bold">3 - الإجراءات الإدارية :</span> تقوم مدرسة تعليم السياقة، باسم المترشح(ة) ونيابة عنه (ها)، بجميع الإجراءات اللازمة لدى الإدارة من أجل تسجيل ملف الامتحان الخاص به (ها). ويتم إخطار المترشح من طرف مدرسة تعليم السياقة بقائمة الوثائق التي تشكل ملف الامتحان.
                        </p>
                        <p>
                          وفي حالة عدم احترام المترشح (ة) للشروط البيداغوجية أو رزنامة التكوين، تحتفظ مدرسة تعليم السياقة بإمكانية تأجيل تقدمه (ها) لامتحانات رخصة السياقة، شريطة إعلامه (ها) كتابيا، مع تقديم تبرير ورزنامة جديدة. وبعد امتثال المترشح (ة) لتعليمات مدرسة تعليم السياقة، يقدم لاختبارات رخصة السياقة.
                        </p>
                        <p>
                          يجب على مدرسة تعليم السياقة، عند دفع تكاليف التكوين، تسليم المترشح (ة) وثيقة الدفع.
                        </p>
                      </div>

                      {/* رابعا - التزامات وحقوق المترشح (ة) */}
                      <div className="space-y-1 text-[10.5px] leading-[1.5] pt-1">
                        <p className="font-bold text-[11.5px]">
                          رابعا - التزامات وحقوق المترشح (ة) :
                        </p>
                        <p>
                          يلتزم المترشح (ة) باحترام النظام الداخلي للمدرسة وكل تعليمة مقدمة ذات صلة بالتكوين المقدم.
                        </p>
                        <p>
                          - تسديد المبالغ المستحقة، يتعين على المترشح (ة) تسديد المبالغ المستحقة لمدرسة تعليم السياقة طبقا لكيفيات التسديد التي تم اختيارها.
                        </p>
                        <p>
                          يمكن مدرسة تعليم السياقة فسخ هذا العقد عند عدم تسديد المبالغ المستحقة في الآجال المحددة.
                        </p>
                      </div>

                      {/* خامسا - تكلفة التكوين وكيفيات الدفع */}
                      <div className="space-y-1 text-[10.5px] leading-[1.5] pt-1">
                        <p className="font-bold text-[11.5px]">
                          خامسا - تكلفة التكوين وكيفيات الدفع :
                        </p>
                        <p>
                          - تكلفة التكوين : تحدد تكلفة التكوين المنصوص عليها في هذا العقد حسب الصنف المدرس، كما يأتي :
                        </p>

                        {/* Pricing Table Matching Image 2 */}
                        {(() => {
                          const theoryH = student.contract_details?.theory_hours ?? 15;
                          const theoryRate = student.contract_details?.theory_hour_rate ?? 800;
                          const theoryTotal = theoryH * theoryRate;

                          const practicalH = student.contract_details?.practical_hours ?? 20;
                          const practicalRate = student.contract_details?.practical_hour_rate ?? 1500;
                          const practicalTotal = practicalH * practicalRate;

                          const calculatedTotal = student.total_package_price || (theoryTotal + practicalTotal);

                          return (
                            <>
                              <div className="my-1 border border-black bg-white">
                                <table className="w-full text-center border-collapse text-[10px]">
                                  <thead>
                                    <tr className="border-b border-black font-bold">
                                      <th className="border-l border-black py-1.5 px-2">الخدمات</th>
                                      <th className="border-l border-black py-1.5 px-2">عدد الساعات</th>
                                      <th className="border-l border-black py-1.5 px-2">التسعيرة بالساعة<br />مع كل الرسوم</th>
                                      <th className="py-1.5 px-2">التسعيرة الإجمالية<br />مع كل الرسوم</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-black">
                                      <td className="border-l border-black py-2 px-2 font-semibold">دروس نظرية</td>
                                      <td className="border-l border-black py-2 px-2 font-mono">{theoryH}</td>
                                      <td className="border-l border-black py-2 px-2 font-mono">{theoryRate.toLocaleString()} دج</td>
                                      <td className="py-2 px-2 font-mono font-bold">{theoryTotal.toLocaleString()} دج</td>
                                    </tr>
                                    <tr>
                                      <td className="border-l border-black py-2 px-2 font-semibold">دروس تطبيقية</td>
                                      <td className="border-l border-black py-2 px-2 font-mono">{practicalH}</td>
                                      <td className="border-l border-black py-2 px-2 font-mono">{practicalRate.toLocaleString()} دج</td>
                                      <td className="py-2 px-2 font-mono font-bold">{practicalTotal.toLocaleString()} دج</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex items-baseline pt-0.5">
                                <span className="whitespace-nowrap font-bold">- السعر الإجمالي مع كل الرسوم : </span>
                                <span className="inline-block border-b border-dotted border-black font-bold font-mono px-3 flex-1 text-center">
                                  {calculatedTotal ? `${calculatedTotal.toLocaleString()} دج` : ''}
                                </span>
                              </div>
                            </>
                          );
                        })()}

                        <p className="text-[10px] text-slate-900">
                          • تحدد حقوق الامتحان للحصول على رخصة السياقة وحقوق الدخول إلى مضمار الامتحان طبقا للتشريع والتنظيم المعمول بهما.
                        </p>
                        <p>
                          - <span className="font-bold">كيفيات الدفع :</span> يتم الدفع حسب مراحل تنفيذ العقد تبعا للكيفيات المتفق عليها بين أطراف العقد.
                        </p>
                      </div>

                      {/* سادسا - تعليق العقد وفسخه */}
                      <div className="space-y-0.5 text-[10.5px] leading-[1.45] pt-0.5">
                        <p className="font-bold text-[11.5px]">
                          سادسا - تعليق العقد وفسخه :
                        </p>
                        <p>
                          يمكن تعليق هذا العقد باتفاق مشترك لمدة لا تتجاوز اثني عشر (12) شهرا. وعند انتهاء هذا الأجل، يجب التفاوض مجددا بشأنه.
                        </p>
                        <p>
                          يمكن أن يفسخ هذا العقد من أحد طرفيه في الحالات المتفق عليها باتفاق مشترك.
                        </p>
                      </div>

                      {/* سابعا - طرق الطعن */}
                      <div className="space-y-0.5 text-[10.5px] leading-[1.45] pt-0.5">
                        <p className="font-bold text-[11.5px]">
                          سابعا - طرق الطعن :
                        </p>
                        <p>
                          في حالة عدم حل النزاع المترتب على عدم احترام الالتزامات من طرفي العقد أو أحدهما، وديا، يمكن رفعه، في هذه الحالة، أمام المحكمة المختصة.
                        </p>
                        <p className="font-semibold">
                          أعدّ هذا العقد في نسختين (2)، تسلّم إحداهما للمترشح (ة).
                        </p>
                      </div>

                      {/* Date & Location Line with Dotted Fill */}
                      <div className="flex justify-center items-baseline text-[11px] my-1">
                        <span>حرر بـ : </span>
                        <span className="inline-block border-b border-dotted border-black font-semibold px-2 min-w-[120px] text-center">
                          {student.contract_details?.contract_city || school.commune || ''}
                        </span>
                        <span className="mr-6">في : </span>
                        <span className="inline-block border-b border-dotted border-black font-mono px-2 min-w-[120px] text-center">
                          {student.contract_details?.contract_date || student.deposit_date || ''}
                        </span>
                      </div>

                      {/* Signatures Boxes from Image 2 */}
                      <div className="grid grid-cols-2 gap-12 text-center text-[11px] pt-1">
                        <div className="space-y-12">
                          <div>
                            <p className="font-bold">&quot;قرئ وصودق عليه&quot;</p>
                            <p className="font-semibold">توقيع المترشح (ة) أو</p>
                            <p className="font-semibold">ممثله (ها) الشرعي</p>
                          </div>
                          <div className="h-10"></div>
                        </div>

                        <div className="space-y-12">
                          <div>
                            <p className="font-bold">&quot;قرئ وصودق عليه&quot;</p>
                            <p className="font-semibold">عن مدرسة تعليم السياقة</p>
                            <p className="font-semibold">توقيع الممثل الشرعي</p>
                          </div>
                          <div className="h-10"></div>
                        </div>
                      </div>

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
