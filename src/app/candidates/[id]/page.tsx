'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Award, 
  Calendar, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  FileText,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck, 
  Edit2,
  Trash2,
  CreditCard,
  ChevronRight,
  Receipt,
  FileCheck2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { ExamModal } from '@/components/ExamModal';
import { PrintModal } from '@/components/PrintModal';
import { PaymentModal } from '@/components/PaymentModal';
import { EditStudentModal } from '@/components/EditStudentModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CandidateAvailabilityModal } from '@/components/CandidateAvailabilityModal';
import { ExamType, ExamResult, getCategoryBadgeClass } from '@/types/kreno';

function CandidateProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { students, school, updateStudent, deleteStudent, deletePayment, deleteScheduleSlot, userRole } = useKreno();
  const isOwner = userRole === 'owner';

  const candidateId = params.id as string;
  const candidate = students.find(s => s.id === candidateId);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [showAddSessionForm, setShowAddSessionForm] = useState(false);

  // Quick 1h lesson form states
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionHour, setNewSessionHour] = useState('09:00');
  const [newSessionType, setNewSessionType] = useState<'code' | 'creneau' | 'circulation'>('circulation');

  useEffect(() => {
    if (!newSessionDate) {
      setNewSessionDate(new Date().toISOString().split('T')[0]);
    }
  }, [newSessionDate]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warningNote?: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  if (!candidate) {
    return (
      <div className="bg-surface p-12 rounded-3xl border border-border-subtle text-center space-y-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Candidat Introuvable</h3>
        <p className="text-xs text-slate-500">Le dossier demandé n&apos;existe pas ou a été supprimé.</p>
        <Link href="/candidates" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour au Registre des Candidats
        </Link>
      </div>
    );
  }

  // Financial calculations
  const totalContractPrice = candidate.total_package_price || 0;
  const totalPaid = candidate.amount_paid || 0;
  const balanceRemaining = Math.max(0, totalContractPrice - totalPaid);
  const percentPaid = totalContractPrice > 0 ? Math.min(100, Math.round((totalPaid / totalContractPrice) * 100)) : 100;

  // Exam step attempts & pass statuses
  const codeAttempts = candidate.exams.filter(e => e.exam_type === 'code');
  const creneauAttempts = candidate.exams.filter(e => e.exam_type === 'creneau');
  const circulationAttempts = candidate.exams.filter(e => e.exam_type === 'circulation');

  const codePassed = codeAttempts.some(e => e.result === 'passed');
  const creneauPassed = creneauAttempts.some(e => e.result === 'passed');
  const circulationPassed = circulationAttempts.some(e => e.result === 'passed');

  // Handle add custom 1h session
  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const [startH] = newSessionHour.split(':').map(Number);
    const endH = startH + 1;
    const timeEnd = `${endH < 10 ? '0' : ''}${endH}:00`;

    const newSlot = {
      id: `sc-manual-${Date.now()}`,
      student_id: candidate.id,
      student_name: `${candidate.first_name} ${candidate.last_name}`,
      category: candidate.requested_category,
      date: newSessionDate,
      time_start: newSessionHour,
      time_end: timeEnd,
      type: newSessionType,
      instructor_name: newSessionType === 'code' ? 'M. Amine' : 'M. Khaled',
      status: 'scheduled' as const,
      notes: 'Séance ajoutée manuellement (1h)',
    };

    const updatedSlots = [...(candidate.schedule_slots || []), newSlot];
    updateStudent(candidate.id, { schedule_slots: updatedSlots });
    setShowAddSessionForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP BAR: Direct "Retour à la liste" button + Primary Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link 
          href="/candidates"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition border border-border-subtle shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Retour à la liste des candidats</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-surface hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-border-subtle"
            title="Modifier l'état civil ou les informations"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Modifier Dossier</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Encaisser un Versement</span>
          </button>

          <button
            onClick={() => setIsExamModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Programmer un Examen</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Dossier A4</span>
          </button>

          {isOwner && (
            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Supprimer le dossier candidat',
                  message: `Êtes-vous certain de vouloir supprimer définitivement le dossier de ${candidate.first_name} ${candidate.last_name} (${candidate.dossier_number}) ?`,
                  warningNote: 'Tous les examens, versements et séances seront définitivement effacés.',
                  confirmText: 'Supprimer définitivement',
                  onConfirm: () => {
                    deleteStudent(candidate.id);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    router.push('/candidates');
                  },
                });
              }}
              className="p-2.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200"
              title="Supprimer définitivement"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN CANDIDATE IDENTIFIER BANNER */}
      <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-blue-700/20 shrink-0">
            {candidate.first_name[0]}{candidate.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md font-black text-xs border shadow-2xs ${getCategoryBadgeClass(candidate.requested_category)}`}>
                Permis Catégorie {candidate.requested_category}
              </span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-surface-elevated px-2.5 py-0.5 rounded-md border border-border-subtle font-bold">
                Dossier N° {candidate.dossier_number}
              </span>
              {candidate.registration_number && (
                <span className="font-mono text-xs text-slate-400 font-medium">
                  • N° Enreg. Daïra: {candidate.registration_number}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>{candidate.first_name} {candidate.last_name}</span>
              {candidate.first_name_ar && candidate.last_name_ar && (
                <span className="text-base font-semibold text-slate-400">
                  ({candidate.first_name_ar} {candidate.last_name_ar})
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dossier déposé le <strong className="text-slate-800 dark:text-slate-200 font-mono">{candidate.deposit_date}</strong> • Lieu de naissance: {candidate.birth_commune} ({candidate.birth_wilaya})
            </p>
          </div>
        </div>

        {/* Global Summary Badges */}
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Épreuve en cours</span>
            {circulationPassed ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                <CheckCircle2 className="w-4 h-4" /> Permis Obtenu
              </span>
            ) : creneauPassed ? (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black text-sm">
                <Clock className="w-4 h-4" /> 3. Circulation
              </span>
            ) : codePassed ? (
              <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-black text-sm">
                <Clock className="w-4 h-4" /> 2. Créneau
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-black text-sm">
                <Clock className="w-4 h-4" /> 1. Code
              </span>
            )}
          </div>

          <div className="text-right border-l border-border-subtle pl-6 font-mono">
            <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase tracking-wider">État Forfait</span>
            {balanceRemaining === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">Soldé à 100%</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                Reste {balanceRemaining.toLocaleString()} DZD
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. CARD 1: CYCLE DES 3 EXAMENS (CODE, CRÉNEAU, CIRCULATION) */}
      <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Cycle des Examens Officiels (3 Épreuves)</h3>
              <p className="text-[11px] text-slate-400">Parcours séquentiel : la validation d&apos;une étape débloque l&apos;accès à la suivante</p>
            </div>
          </div>
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter / Noter un Examen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Épreuve 1: Code */}
          <div className={`p-4 rounded-2xl border transition-all ${
            codePassed 
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-2xs' 
              : 'bg-slate-50/70 dark:bg-surface-elevated border-border-subtle'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                Étape 1 : Théorie
              </span>
              {codePassed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">En cours</span>
              )}
            </div>

            <h4 className="font-black text-sm text-slate-900 dark:text-white">Code de la Route</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Examen théorique des priorités et signalisation.</p>

            <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                <span>Historique tentatives:</span>
                <strong className="font-mono text-slate-900 dark:text-white">{codeAttempts.length} / 15</strong>
              </div>
              {codeAttempts.map(a => (
                <div key={a.id} className="flex justify-between items-center text-[11px] bg-white dark:bg-surface p-2 rounded-xl border border-border-subtle">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Tentative #{a.attempt_number}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{a.exam_date || 'Date non fixée'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                    a.result === 'passed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    a.result === 'failed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                    'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {a.result === 'passed' ? 'Admis' : a.result === 'failed' ? 'Ajourné' : 'Programmé'}
                  </span>
                </div>
              ))}
              {codeAttempts.length === 0 && (
                <p className="text-[11px] text-slate-400 italic py-1">Aucune tentative pour le moment.</p>
              )}
            </div>
          </div>

          {/* Épreuve 2: Créneau */}
          <div className={`p-4 rounded-2xl border transition-all ${
            !codePassed 
              ? 'opacity-60 bg-slate-50/40 dark:bg-surface-elevated/40 border-border-subtle' 
              : creneauPassed 
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-2xs' 
                : 'bg-slate-50/70 dark:bg-surface-elevated border-border-subtle'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                Étape 2 : Manœuvres
              </span>
              {creneauPassed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                </span>
              ) : !codePassed ? (
                <span className="text-[11px] font-bold text-slate-400">Attente Code</span>
              ) : (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">En cours</span>
              )}
            </div>

            <h4 className="font-black text-sm text-slate-900 dark:text-white">Créneau (Sur Piste)</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Stationnement en créneau et marche arrière.</p>

            <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                <span>Historique tentatives:</span>
                <strong className="font-mono text-slate-900 dark:text-white">{creneauAttempts.length} / 15</strong>
              </div>
              {creneauAttempts.map(a => (
                <div key={a.id} className="flex justify-between items-center text-[11px] bg-white dark:bg-surface p-2 rounded-xl border border-border-subtle">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Tentative #{a.attempt_number}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{a.exam_date || 'Date non fixée'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                    a.result === 'passed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    a.result === 'failed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                    'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {a.result === 'passed' ? 'Admis' : a.result === 'failed' ? 'Ajourné' : 'Programmé'}
                  </span>
                </div>
              ))}
              {creneauAttempts.length === 0 && (
                <p className="text-[11px] text-slate-400 italic py-1">
                  {!codePassed ? 'Bloqué tant que le code n\'est pas validé' : 'Prêt pour la programmation'}
                </p>
              )}
            </div>
          </div>

          {/* Épreuve 3: Circulation */}
          <div className={`p-4 rounded-2xl border transition-all ${
            !creneauPassed 
              ? 'opacity-60 bg-slate-50/40 dark:bg-surface-elevated/40 border-border-subtle' 
              : circulationPassed 
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-2xs' 
                : 'bg-slate-50/70 dark:bg-surface-elevated border-border-subtle'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Étape 3 : Circulation
              </span>
              {circulationPassed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Permis Obtenu
                </span>
              ) : !creneauPassed ? (
                <span className="text-[11px] font-bold text-slate-400">Attente Créneau</span>
              ) : (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">En cours</span>
              )}
            </div>

            <h4 className="font-black text-sm text-slate-900 dark:text-white">Conduite Routière</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Épreuve finale sur voie publique avec l&apos;ingénieur d&apos;État.</p>

            <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                <span>Historique tentatives:</span>
                <strong className="font-mono text-slate-900 dark:text-white">{circulationAttempts.length} / 15</strong>
              </div>
              {circulationAttempts.map(a => (
                <div key={a.id} className="flex justify-between items-center text-[11px] bg-white dark:bg-surface p-2 rounded-xl border border-border-subtle">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Tentative #{a.attempt_number}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{a.exam_date || 'Date non fixée'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                    a.result === 'passed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    a.result === 'failed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                    'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {a.result === 'passed' ? 'Admis' : a.result === 'failed' ? 'Ajourné' : 'Programmé'}
                  </span>
                </div>
              ))}
              {circulationAttempts.length === 0 && (
                <p className="text-[11px] text-slate-400 italic py-1">
                  {!creneauPassed ? 'Bloqué tant que le créneau n\'est pas validé' : 'Prêt pour circuit final'}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. TWO-COLUMN SPLIT: Left (Personal Info & Lessons) + Right (Finances & Documents) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN: Personal Info + Training Lessons */}
        <div className="space-y-6">
          
          {/* CARD 2: PERSONAL INFORMATION & CIVIL STATUS */}
          <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">État Civil & Informations Personnelles</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                Modifier
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">N° Identité Nationale (NIN):</span>
                <strong className="font-mono text-slate-900 dark:text-white text-xs">{candidate.nin}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Téléphone Mobile:</span>
                <strong className="font-mono text-slate-900 dark:text-white text-xs">{candidate.phone_number}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date de Naissance:</span>
                <strong className="text-slate-900 dark:text-white text-xs">{candidate.birth_date}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lieu de Naissance:</span>
                <strong className="text-slate-900 dark:text-white text-xs">{candidate.birth_commune} ({candidate.birth_wilaya})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Groupe Sanguin:</span>
                <strong className="font-mono text-blue-600 dark:text-blue-400 font-black text-xs">{candidate.blood_type || 'O+'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Situation Familiale:</span>
                <strong className="text-slate-900 dark:text-white text-xs">{candidate.marital_status || 'Célibataire'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Prénom du Père:</span>
                <strong className="text-slate-900 dark:text-white text-xs">{candidate.father_name || 'Non renseigné'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nom & Prénom de la Mère:</span>
                <strong className="text-slate-900 dark:text-white text-xs">{candidate.mother_full_name || 'Non renseignée'}</strong>
              </div>
              <div className="col-span-2 pt-2 border-t border-border-subtle">
                <span className="text-slate-400 block text-[11px]">Adresse Complète:</span>
                <strong className="text-slate-900 dark:text-white text-xs">
                  {candidate.address_details || 'Cité principale'}, {candidate.address_commune || candidate.birth_commune}
                </strong>
              </div>
            </div>
          </div>

          {/* CARD 3: SÉANCES DE FORMATION & HEURES (1H UNIT) */}
          <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Séances d&apos;Apprentissage (1 Heure)</h3>
                  <p className="text-[11px] text-slate-400">Unité réglementaire de 01 heure</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAvailabilityModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Choisir les jours de présence et régénérer les 30 heures sans conflit"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Régénérer 30h Auto</span>
                </button>
                <button
                  onClick={() => setShowAddSessionForm(!showAddSessionForm)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter 1h</span>
                </button>
              </div>
            </div>

            {/* Quick 1h lesson form */}
            {showAddSessionForm && (
              <form onSubmit={handleAddSession} className="bg-slate-50 dark:bg-surface-elevated p-4 rounded-2xl border border-border-subtle space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white">Enregistrer une heure de cours :</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1 font-bold">Date:</label>
                    <input
                      type="date"
                      required
                      value={newSessionDate}
                      onChange={(e) => setNewSessionDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-border-subtle rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1 font-bold">Heure (1h):</label>
                    <select
                      value={newSessionHour}
                      onChange={(e) => setNewSessionHour(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-border-subtle rounded-lg font-bold"
                    >
                      <option value="08:00">08:00 - 09:00 (1h)</option>
                      <option value="09:00">09:00 - 10:00 (1h)</option>
                      <option value="10:00">10:00 - 11:00 (1h)</option>
                      <option value="11:00">11:00 - 12:00 (1h)</option>
                      <option value="14:00">14:00 - 15:00 (1h)</option>
                      <option value="15:00">15:00 - 16:00 (1h)</option>
                      <option value="16:00">16:00 - 17:00 (1h)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1 font-bold">Discipline:</label>
                    <select
                      value={newSessionType}
                      onChange={(e) => setNewSessionType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-border-subtle rounded-lg font-bold"
                    >
                      <option value="code">Code théorique</option>
                      <option value="creneau">Créneau / Piste</option>
                      <option value="circulation">Circulation routière</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSessionForm(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                  >
                    Confirmer l&apos;heure
                  </button>
                </div>
              </form>
            )}

            {/* List of hours */}
            <div className="space-y-2">
              {(candidate.schedule_slots || []).length > 0 ? (
                candidate.schedule_slots.map((slot, idx) => (
                  <div 
                    key={slot.id} 
                    className="p-3 bg-slate-50 dark:bg-surface-elevated rounded-2xl border border-border-subtle flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold flex items-center justify-center text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white capitalize">
                            {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Conduite en circulation'}
                          </strong>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                            {slot.time_start} - {slot.time_end} (1h)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Le {slot.date} • Moniteur : <strong className="text-slate-700 dark:text-slate-300">{slot.instructor_name}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800/60">
                        Confirmée
                      </span>
                      <button
                        onClick={() => deleteScheduleSlot(candidate.id, slot.id)}
                        className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Supprimer cette heure"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center italic">
                  Aucune séance enregistrée pour l&apos;instant. Cliquez sur &quot;Ajouter 1h&quot;.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Finances & Official Documents */}
        <div className="space-y-6">
          
          {/* CARD 4: FINANCES & RECEIPTS */}
          <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Situation Financière & Versements</h3>
                  <p className="text-[11px] text-slate-400">Règlement du forfait et acomptes perçus</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Versement</span>
              </button>
            </div>

            {/* Financial 3-box summary */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-3 bg-slate-50 dark:bg-surface-elevated rounded-2xl border border-border-subtle">
                <span className="text-[10px] text-slate-400 font-sans block font-bold uppercase">Prix Forfait</span>
                <strong className="text-sm font-black text-slate-900 dark:text-white">{totalContractPrice.toLocaleString()} DZD</strong>
              </div>
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans block font-bold uppercase">Total Versé</span>
                <strong className="text-sm font-black text-emerald-700 dark:text-emerald-300">+{totalPaid.toLocaleString()} DZD</strong>
              </div>
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60">
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block font-bold uppercase">Reste Dû</span>
                <strong className="text-sm font-black text-amber-700 dark:text-amber-300">{balanceRemaining.toLocaleString()} DZD</strong>
              </div>
            </div>

            {/* List of payments */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Historique des Quittances / Reçus :</span>
              {(candidate.payments || []).length > 0 ? (
                candidate.payments.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-surface-elevated rounded-2xl border border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{p.receipt_number || 'Reçu'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold capitalize">
                          {p.method}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Date : {p.date} • {p.notes || p.type}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-black">
                        +{p.amount.toLocaleString()} DZD
                      </strong>
                      {isOwner && (
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Annuler ce versement',
                              message: `Êtes-vous certain de vouloir annuler le versement de ${p.amount.toLocaleString()} DZD (${p.receipt_number || p.date}) ?`,
                              warningNote: 'Le total versé sera mis à jour en conséquence.',
                              confirmText: 'Annuler le versement',
                              onConfirm: () => {
                                deletePayment(candidate.id, p.id);
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              },
                            });
                          }}
                          className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Annuler ce versement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center italic">Aucun versement enregistré pour le moment.</p>
              )}
            </div>
          </div>

          {/* CARD 5: LES 4 DOCUMENTS OFFICIELS PRÊTS POUR IMPRESSION */}
          <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Documents Réglementaires A4</h3>
                  <p className="text-[11px] text-slate-400">Pré-remplis et prêts pour impression immédiate</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                Aperçu Général A4
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div 
                onClick={() => setIsPrintModalOpen(true)}
                className="p-3.5 rounded-2xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:border-blue-500 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <strong className="text-slate-900 dark:text-white block group-hover:text-blue-600">1. Formulaire Daïra</strong>
                  <span className="text-[10px] text-slate-400">Esti-mara d&apos;inscription officielle</span>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>

              <div 
                onClick={() => setIsPrintModalOpen(true)}
                className="p-3.5 rounded-2xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:border-emerald-500 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <strong className="text-slate-900 dark:text-white block group-hover:text-emerald-600">2. Certificat Médical</strong>
                  <span className="text-[10px] text-slate-400">Arrêté nov. 1984 pré-rempli</span>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>

              <div 
                onClick={() => setIsPrintModalOpen(true)}
                className="p-3.5 rounded-2xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:border-amber-500 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <strong className="text-slate-900 dark:text-white block group-hover:text-amber-600">3. Contrat d&apos;Enseignement</strong>
                  <span className="text-[10px] text-slate-400">Arrêté 2019 (Journal Officiel N° 18)</span>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
              </div>

              <div 
                onClick={() => setIsPrintModalOpen(true)}
                className="p-3.5 rounded-2xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated hover:border-purple-500 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <strong className="text-slate-900 dark:text-white block group-hover:text-purple-600">4. Livret Pédagogique</strong>
                  <span className="text-[10px] text-slate-400">Suivi journalier des heures de conduite</span>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Global Modals for Actions */}
      <ExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        student={candidate}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        student={candidate}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        student={candidate}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={candidate}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        warningNote={confirmModal.warningNote}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <CandidateAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        student={candidate}
      />
    </div>
  );
}

export default function CandidateDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Chargement de la page candidat...</div>}>
      <CandidateProfileContent />
    </Suspense>
  );
}
