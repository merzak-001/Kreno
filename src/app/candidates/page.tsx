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
  const { students, searchQuery, deleteStudent, userRole } = useKreno();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; student: Student | null }>({
    isOpen: false,
    student: null,
  });

  const isOwner = userRole === 'owner';

  // Filter candidates
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        st.first_name.toLowerCase().includes(q) ||
        st.last_name.toLowerCase().includes(q) ||
        st.nin.includes(searchQuery) ||
        st.phone_number.includes(searchQuery) ||
        st.dossier_number.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'all' || st.requested_category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [students, searchQuery, categoryFilter]);

  const handleNavigateToCandidate = (id: string) => {
    router.push(`/candidates/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Registre des Candidats & Dossiers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredStudents.length} candidats trouvés • Cliquez sur n&apos;importe quelle ligne pour ouvrir la page complète du candidat.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 mr-2">Filtrer par Catégorie :</span>
          {['all', 'B', 'A', 'C', 'D', 'BE'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                categoryFilter === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-surface-hover border border-border-subtle'
              }`}
            >
              {cat === 'all' ? 'Toutes' : `Cat. ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates List Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-400 font-bold border-b border-border-subtle uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Candidat & Dossier</th>
                <th className="p-4">Permis</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4 text-center">Progression Examen</th>
                <th className="p-4 text-center">Règlement Forfait</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredStudents.map(st => {
                const codePassed = st.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
                const creneauPassed = st.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
                const circPassed = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');
                const remaining = Math.max(0, (st.total_package_price || 0) - (st.amount_paid || 0));

                return (
                  <tr 
                    key={st.id} 
                    onClick={() => handleNavigateToCandidate(st.id)}
                    className="hover:bg-slate-50 dark:hover:bg-surface-elevated/70 transition cursor-pointer group"
                  >
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block group-hover:text-primary transition">
                        {st.first_name} {st.last_name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {st.dossier_number} • NIN: {st.nin}
                      </span>
                    </td>
                    
                    {/* Category badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${getCategoryBadgeClass(st.requested_category)}`}>
                        Cat. {st.requested_category}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono text-slate-700 dark:text-slate-300 block font-semibold">{st.phone_number}</span>
                      <span className="text-[11px] text-slate-400">{st.birth_commune}</span>
                    </td>

                    {/* Single clear progression indicator */}
                    <td className="p-4 text-center">
                      {circPassed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Permis Obtenu
                        </span>
                      ) : creneauPassed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 shadow-2xs">
                          3. Prêt pour Conduite
                        </span>
                      ) : codePassed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 shadow-2xs">
                          2. Prêt pour Créneau
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 shadow-2xs">
                          1. En cours de Code
                        </span>
                      )}
                    </td>

                    {/* Financial balance */}
                    <td className="p-4 text-center font-mono">
                      {remaining === 0 ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                          Soldé
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                          Reste {remaining.toLocaleString()} DZD
                        </span>
                      )}
                    </td>
                    
                    {/* Actions: View / Edit / Delete */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <Link
                          href={`/candidates/${st.id}`}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-surface-elevated hover:bg-primary hover:text-white rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          title="Consulter la fiche complète"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ouvrir Fiche</span>
                        </Link>

                        <button
                          onClick={() => setEditingStudent(st)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-surface-elevated rounded-lg text-slate-400 hover:text-primary transition cursor-pointer"
                          title="Modifier le candidat"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {isOwner && (
                          <button
                            onClick={() => setConfirmDelete({ isOpen: true, student: st })}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Supprimer le candidat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
      />

      {/* Confirmation Modal to Prevent Accidental Deletion */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Supprimer le dossier candidat"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le candidat ${confirmDelete.student?.first_name} ${confirmDelete.student?.last_name} (${confirmDelete.student?.dossier_number}) ?`}
        warningNote="Tous les examens, versements et séances associés seront également supprimés. Cette action sera enregistrée dans le journal d'audit."
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
