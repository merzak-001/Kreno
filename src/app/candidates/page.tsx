'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Printer, 
  DollarSign, 
  Eye, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { Student, getCategoryBadgeClass } from '@/types/kreno';
import { EditStudentModal } from '@/components/EditStudentModal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function CandidatesPage() {
  const router = useRouter();
  const { students, searchQuery: globalSearch, setSearchQuery: setGlobalSearch, deleteStudent, userRole } = useKreno();
  const [localSearch, setLocalSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'graduated' | 'all'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; student: Student | null }>({
    isOpen: false,
    student: null,
  });

  const isOwner = userRole === 'owner';

  // Counts for tabs
  const counts = useMemo(() => {
    let active = 0;
    let graduated = 0;
    students.forEach(st => {
      const hasCirculationPassed = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');
      if (hasCirculationPassed) {
        graduated++;
      } else {
        active++;
      }
    });
    return { active, graduated, total: students.length };
  }, [students]);

  // Combined search and filters
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      // 1. Status Filter: by default 'active' (in-training), or 'graduated' (got license), or 'all'
      const hasCirculationPassed = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');
      if (statusFilter === 'active' && hasCirculationPassed) return false;
      if (statusFilter === 'graduated' && !hasCirculationPassed) return false;

      // 2. Category Filter
      if (categoryFilter !== 'all' && st.requested_category !== categoryFilter) return false;

      // 3. Search query (supports both dedicated in-page search and header search)
      const q = (localSearch || globalSearch).trim().toLowerCase();
      if (!q) return true;

      const matchesName = 
        st.first_name.toLowerCase().includes(q) ||
        st.last_name.toLowerCase().includes(q) ||
        (st.first_name_ar && st.first_name_ar.includes(q)) ||
        (st.last_name_ar && st.last_name_ar.includes(q));

      const matchesDetails = 
        st.nin.includes(q) ||
        st.phone_number.includes(q) ||
        st.dossier_number.toLowerCase().includes(q);

      return matchesName || matchesDetails;
    });
  }, [students, localSearch, globalSearch, statusFilter, categoryFilter]);

  const handleNavigateToCandidate = (id: string) => {
    router.push(`/candidates/${id}`);
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Banner: Title & Primary Status Filter (Active vs Graduated) */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs transition-colors space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Registre Général des Candidats</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Suivi administratif, formation 30 heures et épreuves de conduite • Cliquez sur un candidat pour son dossier.
            </p>
          </div>

          {/* Status Segmented Tabs: Default Active */}
          <div className="flex items-center bg-slate-100 dark:bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs font-medium">
            <button
              onClick={() => setStatusFilter('active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-blue-500" />
              <span>En cours de formation</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'active' 
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {counts.active}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('graduated')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
                statusFilter === 'graduated'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Permis Obtenu / Terminés</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'graduated' 
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {counts.graduated}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Tous</span>
              <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                {counts.total}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row: Dedicated Search Box + Category Pills */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-border-subtle">
          
          {/* Dedicated In-Page Search Box */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (globalSearch) setGlobalSearch(''); // sync
              }}
              placeholder="Rechercher par nom, prénom, NIN, téléphone, dossier..."
              className="w-full pr-8 pl-10 py-2.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {localSearch && (
              <button 
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-500 dark:text-slate-400 mr-1 text-[11px] font-medium">Catégorie :</span>
            {['all', 'B', 'A', 'A1', 'C', 'C1', 'D', 'BE'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer text-xs font-medium border ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? 'Toutes' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Candidates Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 dark:text-slate-400 border-b border-border-subtle uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Dossier / Identité</th>
                <th className="py-3 px-4">Catégorie & NIN</th>
                <th className="py-3 px-4">Épreuve Actuelle</th>
                <th className="py-3 px-4">Formation 30h</th>
                <th className="py-3 px-4">Situation Forfait</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const codePassed = student.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
                  const creneauPassed = student.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
                  const circulationPassed = student.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');
                  const remaining = Math.max(0, (student.total_package_price || 0) - (student.amount_paid || 0));
                  const hoursCount = (student.schedule_slots || []).length;
                  const completedHours = (student.schedule_slots || []).filter(s => s.status === 'completed').length;

                  return (
                    <tr 
                      key={student.id}
                      onClick={() => handleNavigateToCandidate(student.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/50 transition cursor-pointer group"
                    >
                      {/* 1. Dossier & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold flex items-center justify-center text-xs shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition flex items-center gap-1.5">
                              <span>{student.first_name} {student.last_name}</span>
                              {student.first_name_ar && (
                                <span className="text-[11px] font-normal text-slate-400">({student.first_name_ar})</span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">
                              {student.dossier_number} • {student.phone_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Catégorie & NIN */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadgeClass(student.requested_category)}`}>
                          Catégorie {student.requested_category}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 block mt-1">
                          NIN: {student.nin}
                        </span>
                      </td>

                      {/* 3. Épreuve en cours */}
                      <td className="py-3.5 px-4">
                        {circulationPassed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Permis Obtenu
                          </span>
                        ) : creneauPassed ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-xs">
                            <Clock className="w-3.5 h-3.5" /> 3. Circulation
                          </span>
                        ) : codePassed ? (
                          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium text-xs">
                            <Clock className="w-3.5 h-3.5" /> 2. Créneau
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-xs">
                            <Clock className="w-3.5 h-3.5" /> 1. Code
                          </span>
                        )}
                      </td>

                      {/* 4. Training 30h progress */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                          {completedHours} / {hoursCount || 30}h
                        </span>
                        <div className="w-24 bg-slate-100 dark:bg-surface-elevated rounded-full h-1.5 mt-1 overflow-hidden border border-border-subtle">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, Math.round((completedHours / 30) * 100))}%` }} 
                          />
                        </div>
                      </td>

                      {/* 5. Finances */}
                      <td className="py-3.5 px-4 font-mono">
                        {remaining === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            Soldé
                          </span>
                        ) : (
                          <div>
                            <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                              Reste {remaining.toLocaleString()} DZD
                            </span>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Versé: {(student.amount_paid || 0).toLocaleString()} DZD
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleNavigateToCandidate(student.id)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                            title="Ouvrir le profil"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingStudent(student)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
                            title="Modifier les données"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {isOwner && (
                            <button
                              onClick={() => setConfirmDelete({ isOpen: true, student })}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    Aucun candidat trouvé pour ce filtre de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Supprimer le dossier candidat"
        message={`Êtes-vous certain de vouloir supprimer le dossier de ${confirmDelete.student?.first_name} ${confirmDelete.student?.last_name} (${confirmDelete.student?.dossier_number}) ?`}
        warningNote="Tous les examens, versements et séances seront définitivement effacés."
        confirmText="Supprimer définitivement"
        onConfirm={() => {
          if (confirmDelete.student) {
            deleteStudent(confirmDelete.student.id);
          }
          setConfirmDelete({ isOpen: false, student: null });
        }}
        onCancel={() => setConfirmDelete({ isOpen: false, student: null })}
      />

    </div>
  );
}
