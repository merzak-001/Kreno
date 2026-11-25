'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Award, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Car, 
  ChevronRight,
  Calendar,
  AlertCircle,
  Eye,
  TrendingUp,
  FileText,
  UserCheck
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { ExamType, Student, getCategoryBadgeClass } from '@/types/kreno';
import { checkCirculationEligibility } from '@/lib/licenseRules';

export default function DashboardPage() {
  const router = useRouter();
  const { students, vehicles, userRole, school } = useKreno();
  const isOwner = userRole === 'owner';
  const currentYear = new Date().getFullYear();

  // Operational alerts: expiring vehicle docs, unpaid exam fees, exam-ready candidates
  const alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const expiringVehicles = vehicles
      .filter(v => v.is_active)
      .flatMap(v => {
        const items: { id: string; label: string; date: string; expired: boolean }[] = [];
        const techDate = new Date(v.technical_control_expiry);
        if (techDate <= in30Days) {
          items.push({
            id: `${v.id}-tech`,
            label: `${v.brand} ${v.model} (${v.plate_number}) — Contrôle technique`,
            date: v.technical_control_expiry,
            expired: techDate < today,
          });
        }
        const insDate = new Date(v.insurance_expiry);
        if (insDate <= in30Days) {
          items.push({
            id: `${v.id}-ins`,
            label: `${v.brand} ${v.model} (${v.plate_number}) — Assurance`,
            date: v.insurance_expiry,
            expired: insDate < today,
          });
        }
        return items;
      });

    const unpaidExamFees = students.flatMap(st =>
      (st.exams || [])
        .filter(e => e.result === 'pending' && !e.fee_paid)
        .map(e => ({
          id: `${st.id}-${e.id}`,
          studentId: st.id,
          studentName: `${st.first_name} ${st.last_name}`,
          examType: e.exam_type,
          amount: e.fee_amount,
        }))
    );

    const readyForExam = students
      .map(st => {
        const passedCode = st.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
        const passedCreneau = st.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
        const passedCirc = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');
        if (passedCirc) return null;

        const nextStage: ExamType = !passedCode ? 'code' : !passedCreneau ? 'creneau' : 'circulation';
        const hasPendingForStage = st.exams.some(e => e.exam_type === nextStage && e.result === 'pending');
        if (hasPendingForStage) return null;

        if (nextStage === 'circulation') {
          const circCheck = checkCirculationEligibility({
            requestedCategory: st.requested_category,
            birthDate: st.birth_date,
            heldLicenses: st.held_licenses,
          });
          if (!circCheck.circulationEligible) return null;
        }

        const completedHours = (st.schedule_slots || []).filter(
          s => s.type === nextStage && s.status === 'completed'
        ).length;

        if (completedHours >= 10) {
          return {
            id: st.id,
            name: `${st.first_name} ${st.last_name}`,
            stage: nextStage,
            hours: completedHours,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      expiringVehicles,
      unpaidExamFees,
      readyForExam,
      totalCount: expiringVehicles.length + unpaidExamFees.length + readyForExam.length,
    };
  }, [students, vehicles]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = students.length;
    let codeReady = 0;
    let creneauReady = 0;
    let circulationReady = 0;
    let graduated = 0;
    let totalRevenue = 0;
    let totalPaid = 0;

    students.forEach(st => {
      totalRevenue += st.total_package_price || 0;
      totalPaid += st.amount_paid || 0;

      const passedCode = st.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
      const passedCreneau = st.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
      const passedCirculation = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');

      if (passedCirculation) {
        graduated++;
      } else if (passedCreneau) {
        circulationReady++;
      } else if (passedCode) {
        creneauReady++;
      } else {
        codeReady++;
      }
    });

    return {
      total,
      codeReady,
      creneauReady,
      circulationReady,
      graduated,
      totalRevenue,
      totalPaid,
      outstanding: Math.max(0, totalRevenue - totalPaid),
    };
  }, [students]);

  // Upcoming scheduled 1-hour slots
  const upcomingSlots = useMemo(() => {
    return students
      .flatMap(st => (st.schedule_slots || []).map(s => ({ ...s, studentName: `${st.first_name} ${st.last_name}`, studentId: st.id })))
      .filter(s => s.status === 'scheduled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [students]);

  // Candidates with pending exam results
  const pendingExamStudents = useMemo(() => {
    return students.filter(st => st.exams.some(e => e.result === 'pending')).slice(0, 5);
  }, [students]);

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Welcome Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Session {currentYear}
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">• {school.commune}, {school.wilaya}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Tableau de Bord — {school.commercial_name || school.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi temps réel des dossiers candidats, des 3 étapes d&apos;examen et des leçons de conduite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/candidates"
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition shadow-xs shadow-blue-600/20"
          >
            <Users className="w-4 h-4" />
            <span>Tous les candidats</span>
          </Link>
          <Link
            href="/pipeline"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition shadow-xs"
          >
            <Award className="w-4 h-4" />
            <span>Sessions d&apos;examen</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Dossiers */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Candidats Inscrits</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white font-mono">{stats.total}</span>
            <span className="text-xs text-slate-400 ml-2">dossiers actifs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-border-subtle pt-2">
            <span>En cours de formation</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono font-medium">{stats.total - stats.graduated}</strong>
          </div>
        </div>

        {/* Étape Code */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">1. Code de la Route</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white font-mono">{stats.codeReady}</span>
            <span className="text-xs text-slate-400 ml-2">en apprentissage</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-border-subtle pt-2">
            <span>Quota minimum légal</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">10 heures</span>
          </div>
        </div>

        {/* Étape Créneau & Conduite */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">2. Créneau & Route</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white font-mono">{stats.creneauReady + stats.circulationReady}</span>
            <span className="text-xs text-slate-400 ml-2">en conduite</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-border-subtle pt-2">
            <span>Créneau ({stats.creneauReady}) • Circuit ({stats.circulationReady})</span>
          </div>
        </div>

        {/* Permis Délivrés */}
        <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Permis Obtenus</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{stats.graduated}</span>
            <span className="text-xs text-slate-400 ml-2">admis aux 3 étapes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-border-subtle pt-2">
            <span>Taux de réussite global</span>
            <strong className="text-emerald-600 font-mono font-medium">
              {stats.total > 0 ? Math.round((stats.graduated / stats.total) * 100) : 0}%
            </strong>
          </div>
        </div>

      </div>

      {/* Actionable Priorities & Alerts Strip */}
      {alerts.totalCount > 0 && (
        <div className="bg-surface p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Priorités &amp; Alertes ({alerts.totalCount})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Actions recommandées</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {alerts.expiringVehicles.length > 0 && (
              <Link
                href="/vehicles"
                className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 hover:border-rose-300 transition flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-800 dark:text-rose-300">Documents Véhicules</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200">
                    {alerts.expiringVehicles.length}
                  </span>
                </div>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 truncate">
                  {alerts.expiringVehicles[0].label} ({alerts.expiringVehicles[0].date})
                </p>
              </Link>
            )}

            {alerts.unpaidExamFees.length > 0 && (
              <Link
                href="/pipeline"
                className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 hover:border-amber-300 transition flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">Droits d&apos;Examen Impayés</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200">
                    {alerts.unpaidExamFees.length}
                  </span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 truncate">
                  {alerts.unpaidExamFees[0].studentName} • {alerts.unpaidExamFees[0].amount.toLocaleString()} DZD
                </p>
              </Link>
            )}

            {alerts.readyForExam.length > 0 && (
              <Link
                href={`/candidates/${alerts.readyForExam[0].id}`}
                className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 hover:border-blue-300 transition flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-800 dark:text-blue-300">Prêts pour l&apos;Examen (10h+)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200">
                    {alerts.readyForExam.length}
                  </span>
                </div>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 truncate">
                  {alerts.readyForExam[0].name} ({alerts.readyForExam[0].stage})
                </p>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Owner Financial Snapshot */}
      {isOwner && (
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Aperçu Comptable & Recettes Forfaits</h3>
            </div>
            <Link href="/finances" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Registre détaillé →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-3.5 bg-slate-50/70 dark:bg-surface-elevated/60 rounded-xl border border-border-subtle">
              <span className="text-[10px] text-slate-400 font-sans block uppercase tracking-wider font-medium">Total Contrats Signés</span>
              <strong className="text-base font-semibold text-slate-900 dark:text-white mt-1 block">
                {stats.totalRevenue.toLocaleString()} DZD
              </strong>
            </div>

            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans block uppercase tracking-wider font-medium">Total Encaissé</span>
              <strong className="text-base font-semibold text-emerald-700 dark:text-emerald-300 mt-1 block">
                +{stats.totalPaid.toLocaleString()} DZD
              </strong>
            </div>

            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block uppercase tracking-wider font-medium">Reste à Recouvrer</span>
              <strong className="text-base font-semibold text-amber-700 dark:text-amber-300 mt-1 block">
                {stats.outstanding.toLocaleString()} DZD
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Grid: Upcoming Sessions & Exam Pipeline Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Scheduled 1-Hour Lessons */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Prochaines Séances de Conduite (1h)</h3>
            </div>
            <Link href="/schedule" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Planning complet →
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingSlots.length > 0 ? (
              upcomingSlots.map(slot => (
                <div 
                  key={slot.id}
                  onClick={() => router.push(`/candidates/${slot.studentId}`)}
                  className="p-3 bg-slate-50/70 dark:bg-surface-elevated/70 rounded-xl border border-border-subtle flex items-center justify-between text-xs hover:border-blue-400/40 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono font-medium flex items-center justify-center text-xs">
                      1h
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white font-medium block">
                        {slot.studentName}
                      </strong>
                      <span className="text-[11px] text-slate-500 capitalize">
                        {slot.type === 'code' ? 'Code théorique' : slot.type === 'creneau' ? 'Créneau sur piste' : 'Circulation routière'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium block">
                      {slot.time_start} - {slot.time_end}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{slot.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                Aucune séance programmée aujourd&apos;hui.
              </p>
            )}
          </div>
        </div>

        {/* Pending Exam Candidates */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Examens en Attente de Résultat</h3>
            </div>
            <Link href="/pipeline" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Sessions d&apos;examen →
            </Link>
          </div>

          <div className="space-y-2">
            {pendingExamStudents.length > 0 ? (
              pendingExamStudents.map(st => {
                const pendingExam = st.exams.find(e => e.result === 'pending');
                return (
                  <div 
                    key={st.id}
                    onClick={() => router.push(`/candidates/${st.id}`)}
                    className="p-3 bg-slate-50/70 dark:bg-surface-elevated/70 rounded-xl border border-border-subtle flex items-center justify-between text-xs hover:border-blue-400/40 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadgeClass(st.requested_category)}`}>
                        Cat. {st.requested_category}
                      </span>
                      <div>
                        <strong className="text-slate-900 dark:text-white font-medium block">
                          {st.first_name} {st.last_name}
                        </strong>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {st.dossier_number}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium text-[10px] border border-amber-200 dark:border-amber-800/60 inline-block">
                        {pendingExam?.exam_type === 'code' ? 'Examen Code' : pendingExam?.exam_type === 'creneau' ? 'Examen Créneau' : 'Examen Circulation'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {pendingExam?.exam_date || 'Date non fixée'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                Tous les examens enregistrés ont été notés.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
