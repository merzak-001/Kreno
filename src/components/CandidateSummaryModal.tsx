'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Printer, 
  Plus, 
  ChevronRight, 
  CreditCard,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { Student, ExamType, getCategoryBadgeClass } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { PaymentModal } from '@/components/PaymentModal';
import { ExamModal } from '@/components/ExamModal';
import { PrintModal } from '@/components/PrintModal';

interface CandidateSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export function CandidateSummaryModal({ isOpen, onClose, student }: CandidateSummaryModalProps) {
  const router = useRouter();
  const { addPayment, userRole } = useKreno();
  const isOwner = userRole === 'owner';

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [examInitialType, setExamInitialType] = useState<ExamType>('code');
  const [activeTab, setActiveTab] = useState<'overview' | 'finances' | 'exams'>('overview');

  useEscapeKey(isOpen, onClose);

  if (!isOpen || !student) return null;

  const currentPaid = student.amount_paid || 0;
  const totalPrice = student.total_package_price || 0;
  const remaining = Math.max(0, totalPrice - currentPaid);
  const percentPaid = totalPrice > 0 ? Math.min(100, Math.round((currentPaid / totalPrice) * 100)) : 100;

  // Exam stats
  const codeExam = student.exams.find(e => e.exam_type === 'code');
  const creneauExam = student.exams.find(e => e.exam_type === 'creneau');
  const circulationExam = student.exams.find(e => e.exam_type === 'circulation');

  const codePassed = student.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
  const creneauPassed = student.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
  const circPassed = student.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');

  const handlePayExamFee = (examType: ExamType, feeAmount: number) => {
    addPayment(student.id, {
      student_id: student.id,
      amount: feeAmount,
      date: new Date().toISOString().split('T')[0],
      type: 'exam_fee',
      method: 'especes',
      receipt_number: `REC-EX-${Math.floor(100 + Math.random() * 900)}`,
      notes: `Règlement des frais d'examen ${examType.toUpperCase()}`,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl w-full max-w-3xl shadow-2xl border border-border-subtle overflow-hidden text-slate-900 dark:text-white flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Banner */}
          <div className="px-6 py-5 border-b border-border-subtle flex items-start justify-between bg-surface">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/30 shrink-0 border border-blue-400/30">
                {student.first_name[0]}{student.last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {student.first_name} {student.last_name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs border shadow-2xs ${getCategoryBadgeClass(student.requested_category)}`}>
                    Permis Cat. {student.requested_category}
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-surface-elevated px-2 py-0.5 rounded-md border border-border-subtle">
                    {student.dossier_number}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 font-medium">
                  <span>Inscrit le {student.deposit_date}</span>
                  <span>•</span>
                  <span>NIN: <strong className="font-mono text-slate-700 dark:text-slate-300">{student.nin}</strong></span>
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-elevated transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-border-subtle px-6 bg-surface text-xs font-bold gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" /> Vue d&apos;ensemble & Infos
            </button>
            <button
              onClick={() => setActiveTab('finances')}
              className={`py-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'finances'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Situation Financière ({currentPaid.toLocaleString()} / {totalPrice.toLocaleString()} DZD)
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`py-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'exams'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" /> Cycle des 3 Examens ({circPassed ? '3/3 Obtenu' : creneauPassed ? '2/3 Admis' : codePassed ? '1/3 Admis' : '0/3 En cours'})
            </button>
          </div>

          {/* Body Content (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 3 Key Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Financial Status Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-elevated border border-border-subtle space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Finances</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${remaining === 0 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
                        {remaining === 0 ? 'Forfait Soldé' : 'Solde Débiteur'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <strong className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {currentPaid.toLocaleString()} DZD
                      </strong>
                      <span className="text-[11px] text-slate-400 font-mono">/ {totalPrice.toLocaleString()} DZD</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${percentPaid === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Exam Status Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-elevated border border-border-subtle space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cycle Examens</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {circPassed ? 'Diplômé' : creneauPassed ? 'Conduite' : codePassed ? 'Créneau' : 'Code'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${codePassed ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        1. Code: {codePassed ? 'OK' : 'Attente'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${creneauPassed ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        2. Kreno: {creneauPassed ? 'OK' : 'Attente'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${circPassed ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        3. Circuit: {circPassed ? 'OK' : 'Attente'}
                      </span>
                    </div>
                  </div>

                  {/* Training Hours Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-elevated border border-border-subtle space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Séances (Unité 1h)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                        {(student.schedule_slots || []).length} séances
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                      Planning calqué sur les jours ouvrables (Samedi au Jeudi).
                    </p>
                  </div>
                </div>

                {/* Identity & Contact Details */}
                <div className="bg-slate-50 dark:bg-surface-elevated p-5 rounded-2xl border border-border-subtle space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Informations Civiles & Coordonnées
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Date & Lieu de Naissance:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {student.birth_date} à {student.birth_commune} ({student.birth_wilaya})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sexe & Groupe Sanguin:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {student.gender} • Groupe {student.blood_type || 'Non spécifié'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Téléphone Portable:</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-bold">
                        {student.phone_number}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Adresse de Résidence:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {student.address_details || student.address_commune || 'Sétif'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Filiation:</span>
                      <strong className="text-slate-900 dark:text-white">
                        Fils/Fille de {student.father_name || '...'} et de {student.mother_full_name || '...'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Situation Familiale:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {student.marital_status}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FINANCES */}
            {activeTab === 'finances' && (
              <div className="space-y-6">
                {/* Financial Summary Banner */}
                <div className="bg-slate-50 dark:bg-surface-elevated p-5 rounded-2xl border border-border-subtle flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Situation des Règlements & Échéances</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gestion des acomptes, versements échelonnés et droits d&apos;examen officiels.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPaymentOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Encaisser un Versement</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Progression du paiement ({percentPaid}%)</span>
                    <span className="text-slate-900 dark:text-white font-mono">
                      Payé : {currentPaid.toLocaleString()} DZD • Reste : <span className="text-amber-600 dark:text-amber-400">{remaining.toLocaleString()} DZD</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${percentPaid === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>

                {/* Payments Table */}
                <div className="border border-border-subtle rounded-2xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-surface-elevated px-4 py-3 font-bold text-xs text-slate-700 dark:text-slate-300 border-b border-border-subtle flex justify-between items-center">
                    <span>Historique de Tous les Versements</span>
                    <span className="font-mono text-[11px] text-slate-500">{(student.payments || []).length} opérations</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-surface-elevated text-slate-500 dark:text-slate-400 border-b border-border-subtle uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">N° Reçu</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Motif / Observations</th>
                          <th className="p-3 text-right">Montant Encaissé</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {(student.payments || []).length > 0 ? (
                          student.payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-surface-elevated/70">
                              <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{p.date}</td>
                              <td className="p-3 font-mono text-slate-500">{p.receipt_number || '-'}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.type === 'initial_deposit'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                    : p.type === 'exam_fee'
                                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                }`}>
                                  {p.type === 'initial_deposit' ? 'Acompte initial' : p.type === 'exam_fee' ? 'Frais d\'examen' : 'Tranche formation'}
                                </span>
                              </td>
                              <td className="p-3 capitalize text-slate-600 dark:text-slate-400">{p.method}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">{p.notes || '-'}</td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                +{p.amount.toLocaleString()} DZD
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-xs text-slate-400">
                              Aucun versement enregistré pour le moment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EXAMS */}
            {activeTab === 'exams' && (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-surface-elevated p-5 rounded-2xl border border-border-subtle flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cycle des 3 Épreuves Légales & Frais d&apos;Examen</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chaque passage d&apos;examen nécessite l&apos;encaissement des droits d&apos;examen (2 000 DZD).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setExamInitialType(codePassed ? (creneauPassed ? 'circulation' : 'creneau') : 'code');
                      setIsExamOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Programmer ou Noter un Examen</span>
                  </button>
                </div>

                {/* 3 Sequential Exam Cards */}
                <div className="space-y-4">
                  {[
                    { 
                      type: 'code' as ExamType, 
                      title: 'Étape 1: Examen Théorique du Code de la Route', 
                      isUnlocked: true,
                      isPassed: codePassed,
                      examData: codeExam
                    },
                    { 
                      type: 'creneau' as ExamType, 
                      title: 'Étape 2: Épreuve Pratique de Créneau (Manoeuvres)', 
                      isUnlocked: codePassed,
                      isPassed: creneauPassed,
                      examData: creneauExam
                    },
                    { 
                      type: 'circulation' as ExamType, 
                      title: 'Étape 3: Épreuve Pratique de Conduite en Circulation', 
                      isUnlocked: creneauPassed,
                      isPassed: circPassed,
                      examData: circulationExam
                    },
                  ].map((step, idx) => {
                    const attempts = student.exams.filter(e => e.exam_type === step.type);
                    const latest = attempts[attempts.length - 1];
                    const isPaid = latest?.fee_paid || false;
                    const feeAmt = latest?.fee_amount || 2000;

                    return (
                      <div 
                        key={step.type}
                        className={`p-5 rounded-2xl border transition ${
                          !step.isUnlocked
                            ? 'bg-slate-50/50 dark:bg-surface-elevated/20 border-border-subtle opacity-50'
                            : step.isPassed
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                              : 'bg-surface border-border-subtle'
                        }`}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                              step.isPassed
                                ? 'bg-emerald-600 text-white'
                                : step.isUnlocked
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{step.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {attempts.length > 0 ? `${attempts.length} tentative(s) enregistrée(s)` : 'En attente de programmation'}
                              </p>
                            </div>
                          </div>

                          {/* Status and Fee badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Pass / Fail / Pending */}
                            {step.isPassed ? (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Admis Officiellement
                              </span>
                            ) : latest?.result === 'failed' ? (
                              <span className="px-3 py-1 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Ajourné (À reprogrammer)
                              </span>
                            ) : step.isUnlocked ? (
                              <span className="px-3 py-1 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> En cours / Programmé
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-lg text-xs font-medium">
                                Bloqué (Étape précédente requise)
                              </span>
                            )}

                            {/* Exam Fee badge */}
                            {step.isUnlocked && (
                              <div className="flex items-center gap-1.5">
                                {isPaid ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[11px] font-bold">
                                    Frais ({feeAmt} DZD) Payés
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg text-[11px] font-bold">
                                      Frais ({feeAmt} DZD) Impayés
                                    </span>
                                    <button
                                      onClick={() => handlePayExamFee(step.type, feeAmt)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition shadow-xs"
                                      title="Encaisser les frais d'examen maintenant"
                                    >
                                      Régler
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Quick Action Button */}
                            {step.isUnlocked && (
                              <button
                                onClick={() => {
                                  setExamInitialType(step.type);
                                  setIsExamOpen(true);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                              >
                                Modifier / Noter
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Exam Details if programmed */}
                        {latest && (
                          <div className="mt-4 pt-3 border-t border-border-subtle grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-slate-400 block">Date programmée:</span>
                              <strong className="font-mono text-slate-800 dark:text-slate-200">{latest.exam_date || 'Non fixée'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Centre d&apos;examen:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{latest.exam_center || 'Centre officiel'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Ingénieur d&apos;État:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{latest.examiner_name || 'Commission Daira'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Dernier Verdict:</span>
                              <strong className="capitalize text-slate-800 dark:text-slate-200">{latest.result}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-border-subtle bg-surface flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Documents (A4)</span>
              </button>

              <button
                onClick={() => setIsPaymentOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Nouveau Versement</span>
              </button>

              <button
                onClick={() => {
                  setExamInitialType('code');
                  setIsExamOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 border border-border-subtle bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated dark:hover:bg-surface-hover text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Award className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Programmer Examen</span>
              </button>
            </div>

            <Link
              href={`/candidates/${student.id}`}
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <span>Ouvrir Fiche Complète & Planning</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Nested Modals */}
      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        student={student}
      />

      <ExamModal
        isOpen={isExamOpen}
        onClose={() => setIsExamOpen(false)}
        student={student}
        initialType={examInitialType}
      />

      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        student={student}
      />
    </>
  );
}
