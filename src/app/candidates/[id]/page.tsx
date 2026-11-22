'use client';

import React, { useState, Suspense } from 'react';
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
  Trash2
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { ExamModal } from '@/components/ExamModal';
import { PrintModal } from '@/components/PrintModal';
import { PaymentModal } from '@/components/PaymentModal';
import { EditStudentModal } from '@/components/EditStudentModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExamType, ExamResult, getCategoryBadgeClass } from '@/types/kreno';

function CandidateProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { students, school, recordExamResult, generateScheduleForStudent, updateStudent, deleteStudent, deletePayment, userRole } = useKreno();
  const isOwner = userRole === 'owner';

  const candidateId = params.id as string;
  const candidate = students.find(s => s.id === candidateId);

  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'schedule' | 'documents' | 'finance'>('overview');
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  // New session modal / form states
  const [newSessionDate, setNewSessionDate] = useState('2026-11-26');
  const [newSessionHour, setNewSessionHour] = useState('10:00');
  const [newSessionType, setNewSessionType] = useState<'code' | 'creneau' | 'circulation'>('circulation');
  const [showAddSessionForm, setShowAddSessionForm] = useState(false);

  if (!candidate) {
    return (
      <div className="bg-white p-12 rounded-2xl border text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Candidat Introuvable</h3>
        <p className="text-xs text-slate-500">Le dossier demandé n&apos;existe pas ou a été archivé.</p>
        <Link href="/candidates" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </Link>
      </div>
    );
  }

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

  // Handle regenerate automatic schedule
  const handleRegenerateSchedule = () => {
    const autoSlots = generateScheduleForStudent(candidate);
    updateStudent(candidate.id, { schedule_slots: autoSlots });
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/candidates"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des candidats</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Modifier les données du candidat"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Modifier</span>
          </button>

          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Supprimer le dossier candidat',
                message: `Êtes-vous sûr de vouloir supprimer définitivement le dossier de ${candidate.first_name} ${candidate.last_name} (${candidate.dossier_number}) ?`,
                warningNote: 'Tous les examens, versements et séances seront définitivement effacés.',
                confirmText: 'Supprimer définitivement',
                onConfirm: () => {
                  deleteStudent(candidate.id);
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  router.push('/candidates');
                },
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Supprimer ce dossier"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer les Dossiers Officiels</span>
          </button>
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-brand-primary text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Enregistrer un Examen</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-card-border flex items-center justify-center text-slate-600 dark:text-slate-300 text-xl font-black">
            {candidate.first_name[0]}{candidate.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-md font-black text-xs border ${getCategoryBadgeClass(candidate.requested_category)}`}>
                Permis Catégorie {candidate.requested_category}
              </span>
              <span className="font-mono text-xs text-slate-400">
                Dossier N° {candidate.dossier_number}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-200">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inscrit le {candidate.deposit_date} • {candidate.birth_commune} ({candidate.birth_wilaya})
            </p>
          </div>
        </div>

        {/* Quick Contacts */}
        <div className="flex items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span className="font-mono font-bold text-slate-800">{candidate.phone_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>NIN: <strong className="font-mono">{candidate.nin}</strong></span>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer ${
            activeTab === 'overview' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Informations du Candidat
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer ${
            activeTab === 'exams' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cycle des 3 Examens (Code • Créneau • Conduite)
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer ${
            activeTab === 'schedule' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Programme & Planning des Séances (1h)
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer ${
            activeTab === 'documents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Documents Officiels (4 Fiches)
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'finance' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Paiements & Contrat
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              État Civil & Identité
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Nom complet:</span>
                <strong className="text-slate-800">{candidate.last_name} {candidate.first_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Genre:</span>
                <strong className="text-slate-800">{candidate.gender}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">N° Identité Nationale (NIN):</span>
                <strong className="font-mono text-slate-800">{candidate.nin}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Groupe Sanguin:</span>
                <strong className="font-mono text-brand-primary dark:text-brand-soft font-bold">{candidate.blood_type || 'O+'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Date de Naissance:</span>
                <strong className="text-slate-800">{candidate.birth_date}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Lieu de Naissance:</span>
                <strong className="text-slate-800">{candidate.birth_commune} ({candidate.birth_wilaya})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Filiation (Père):</span>
                <strong className="text-slate-800">{candidate.father_name || 'Non renseigné'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Filiation (Mère):</span>
                <strong className="text-slate-800">{candidate.mother_full_name || 'Non renseignée'}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Coordonnées & Inscription
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Numéro de Téléphone:</span>
                <strong className="font-mono text-slate-800">{candidate.phone_number}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Adresse Email:</span>
                <strong className="text-slate-800">{candidate.email || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Commune de Résidence:</span>
                <strong className="text-slate-800">{candidate.address_commune || candidate.birth_commune}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Adresse Détaillée:</span>
                <strong className="text-slate-800">{candidate.address_details || 'Cité principale'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Numéro d&apos;Enregistrement:</span>
                <strong className="font-mono text-slate-800">{candidate.registration_number || '19042581'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Date de Dépôt du Dossier:</span>
                <strong className="text-slate-800">{candidate.deposit_date}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Progression dans le Cycle des 3 Examens Officiels</h3>
              <p className="text-xs text-slate-500">
                La réussite au Code débloque le Créneau, qui à son tour débloque la Conduite finale.
              </p>
            </div>
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-brand-primary text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Saisir une Note d&apos;Examen</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Code */}
            {(() => {
              const codeAttempts = candidate.exams.filter(e => e.exam_type === 'code');
              const isPassed = codeAttempts.some(e => e.result === 'passed');

              return (
                <div className={`p-5 rounded-2xl border ${isPassed ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'} space-y-3`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-blue-700 uppercase">Étape 1</span>
                    {isPassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">Admis</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">En cours</span>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-slate-900">Code de la Route</h4>
                  <p className="text-xs text-slate-500">Examen théorique des règles de circulation et signalisation.</p>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <span className="text-slate-400 block text-[11px]">Tentatives ({codeAttempts.length}/15):</span>
                    {codeAttempts.map(a => (
                      <div key={a.id} className="flex justify-between text-[11px]">
                        <span>Tentative {a.attempt_number} ({a.exam_date || 'En attente'}):</span>
                        <strong className={a.result === 'passed' ? 'text-blue-700' : 'text-rose-700'}>
                          {a.result === 'passed' ? 'Admis' : a.result === 'failed' ? 'Ajourné' : 'Programmé'}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Step 2: Créneau */}
            {(() => {
              const codePassed = candidate.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
              const creneauAttempts = candidate.exams.filter(e => e.exam_type === 'creneau');
              const isPassed = creneauAttempts.some(e => e.result === 'passed');

              return (
                <div className={`p-5 rounded-2xl border ${!codePassed ? 'opacity-50 bg-slate-50 border-slate-200' : isPassed ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'} space-y-3`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-amber-700 uppercase">Étape 2</span>
                    {isPassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">Admis</span>
                    ) : !codePassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px]">Verrouillé</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">En cours</span>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-slate-900">Manœuvres (Créneau)</h4>
                  <p className="text-xs text-slate-500">Examen pratique sur piste de stationnement et marche arrière.</p>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <span className="text-slate-400 block text-[11px]">Tentatives ({creneauAttempts.length}/15):</span>
                    {creneauAttempts.map(a => (
                      <div key={a.id} className="flex justify-between text-[11px]">
                        <span>Tentative {a.attempt_number} ({a.exam_date || 'En attente'}):</span>
                        <strong className={a.result === 'passed' ? 'text-blue-700' : 'text-rose-700'}>
                          {a.result === 'passed' ? 'Admis' : a.result === 'failed' ? 'Ajourné' : 'Programmé'}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Step 3: Conduite */}
            {(() => {
              const creneauPassed = candidate.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
              const circAttempts = candidate.exams.filter(e => e.exam_type === 'circulation');
              const isPassed = circAttempts.some(e => e.result === 'passed');

              return (
                <div className={`p-5 rounded-2xl border ${!creneauPassed ? 'opacity-50 bg-slate-50 border-slate-200' : isPassed ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'} space-y-3`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-blue-700 uppercase">Étape 3</span>
                    {isPassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">Permis Obtenu</span>
                    ) : !creneauPassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px]">Verrouillé</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">En cours</span>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-slate-900">Conduite en Circulation</h4>
                  <p className="text-xs text-slate-500">Examen final sur voie publique avec l&apos;inspecteur d&apos;État.</p>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <span className="text-slate-400 block text-[11px]">Tentatives ({circAttempts.length}/15):</span>
                    {circAttempts.map(a => (
                      <div key={a.id} className="flex justify-between text-[11px]">
                        <span>Tentative {a.attempt_number} ({a.exam_date || 'En attente'}):</span>
                        <strong className={a.result === 'passed' ? 'text-blue-700' : 'text-rose-700'}>
                          {a.result === 'passed' ? 'Admis' : a.result === 'failed' ? 'Ajourné' : 'Programmé'}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE & LEARNING PROGRAM (1-HOUR SLOTS) */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Programme Pédagogique & Planning Automatique (Séances de 1h)</h3>
              <p className="text-xs text-slate-500">
                Généré automatiquement selon les jours d&apos;ouverture (du Samedi au Jeudi) en unités d&apos;une heure.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerateSchedule}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Régénérer le planning automatique
              </button>
              <button
                onClick={() => setShowAddSessionForm(!showAddSessionForm)}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une Séance (1h)</span>
              </button>
            </div>
          </div>

          {showAddSessionForm && (
            <form onSubmit={handleAddSession} className="bg-blue-50/60 dark:bg-blue-950/40 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-4 text-xs">
              <h4 className="font-bold text-blue-950 dark:text-blue-100 text-sm">Programmer une Nouvelle Séance d&apos;Une Heure (1h)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date de la séance:</label>
                  <input
                    type="date"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Heure de début (Unité 1h):</label>
                  <select
                    value={newSessionHour}
                    onChange={(e) => setNewSessionHour(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
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
                  <label className="block text-slate-700 font-semibold mb-1">Type d&apos;apprentissage:</label>
                  <select
                    value={newSessionType}
                    onChange={(e) => setNewSessionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="code">Code Théorique (1h)</option>
                    <option value="creneau">Créneau / Manœuvres (1h)</option>
                    <option value="circulation">Conduite / Circulation (1h)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold shadow-sm cursor-pointer"
                  >
                    Confirmer la séance
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">N° Séance</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Horaire (Unité 1h)</th>
                  <th className="p-3.5">Discipline</th>
                  <th className="p-3.5">Moniteur</th>
                  <th className="p-3.5">Observations</th>
                  <th className="p-3.5 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(candidate.schedule_slots || []).length > 0 ? (
                  candidate.schedule_slots.map((slot, idx) => (
                    <tr key={slot.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold font-mono text-slate-600">Séance #{idx + 1}</td>
                      <td className="p-3.5 font-mono text-slate-800 font-bold">{slot.date}</td>
                      <td className="p-3.5 font-mono text-slate-600 font-bold">
                        {slot.time_start} - {slot.time_end} (1h)
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          slot.type === 'code' ? 'bg-blue-100 text-blue-800' :
                          slot.type === 'creneau' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {slot.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{slot.instructor_name}</td>
                      <td className="p-3.5 text-slate-500">{slot.notes || '—'}</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-brand-primary dark:text-brand-soft font-bold text-[10px]">
                          Programmée
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Aucune séance programmée. Cliquez sur &quot;Régénérer le planning automatique&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL PRINT DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="font-bold text-sm text-slate-900">Les 4 Documents Officiels du Candidat</h3>
            <p className="text-xs text-slate-500">
              Ces documents sont pré-remplis automatiquement avec l&apos;identité du candidat, le NIN et les coordonnées de l&apos;auto-école.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">Format A3 / A4 Plié</span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">1. Formulaire Officiel de Candidature</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Esti-mara d&apos;inscription déposée auprès de la Délégation Nationale de Sécurité Routière / Daïra.
                </p>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer le Dossier A3
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-brand-primary dark:text-brand-soft font-bold">Format A4</span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">2. Certificat Médical Officiel</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Arrêté ministériel du 15 novembre 1984. Pré-rempli avec l&apos;identité et la catégorie sollicitée pour le médecin.
                </p>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer le Certificat Médical
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold">Format A4 Recto-Verso</span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">3. Contrat d&apos;Enseignement de la Conduite</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Arrêté du 14 février 2019 (Journal Officiel N° 18). Fixe les volumes horaires, tarifs et engagements.
                </p>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer le Contrat Légal
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">Format A5</span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">4. Livret de Suivi Pédagogique</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Fiche de suivi journalier des heures théoriques et pratiques à bord du véhicule.
                </p>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer le Livret A5
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIALS (OWNER ONLY) */}
      {activeTab === 'finance' && isOwner && (
        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-card-border pb-3 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Règlement & Situation Financière du Contrat</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Suivi des acomptes, versements et frais d&apos;examen.</p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Encaisser un Versement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-card-border">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">Montant Forfaitaire Convenu:</span>
              <strong className="text-lg text-slate-900 dark:text-slate-200">{(candidate.total_package_price || 0).toLocaleString()} DZD</strong>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <span className="text-xs text-brand-primary dark:text-brand-soft font-sans block">Total Versé Encaissé:</span>
              <strong className="text-lg text-blue-800 dark:text-blue-200">{(candidate.amount_paid || 0).toLocaleString()} DZD</strong>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-800/40">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-sans block">Solde Restant à Régler:</span>
              <strong className="text-lg text-amber-800 dark:text-amber-300">
                {Math.max(0, (candidate.total_package_price || 0) - (candidate.amount_paid || 0)).toLocaleString()} DZD
              </strong>
            </div>
          </div>

          {/* Payments list table */}
          <div className="border border-card-border rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-50 dark:bg-card-bg p-3 font-bold text-slate-700 dark:text-slate-300 border-b border-card-border">
              Historique des Versements Reçus
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-card-border text-slate-500">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">N° Reçu</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Motif</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-right">Annuler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {(candidate.payments || []).length > 0 ? (
                  candidate.payments.map(p => (
                    <tr key={p.id}>
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{p.date}</td>
                      <td className="p-3 font-mono text-slate-500">{p.receipt_number || '-'}</td>
                      <td className="p-3 capitalize">{p.type}</td>
                      <td className="p-3 capitalize">{p.method}</td>
                      <td className="p-3 text-slate-500">{p.notes || '-'}</td>
                      <td className="p-3 text-right font-mono font-bold text-brand-primary">
                        +{p.amount.toLocaleString()} DZD
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Annuler ce versement financier',
                              message: `Êtes-vous sûr de vouloir annuler le versement de ${p.amount.toLocaleString()} DZD (${p.receipt_number || p.type}) effectué le ${p.date} ?`,
                              warningNote: 'Le total versé par le candidat sera débité du même montant, et l\'action sera tracée dans le journal d\'audit.',
                              confirmText: 'Confirmer l\'annulation',
                              onConfirm: () => {
                                deletePayment(candidate.id, p.id);
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              },
                            });
                          }}
                          className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                          title="Annuler ce versement (avec confirmation)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">Aucun versement enregistré.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
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
    </div>
  );
}

export default function CandidateProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement du profil candidat...</div>}>
      <CandidateProfileContent />
    </Suspense>
  );
}
