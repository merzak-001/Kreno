'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { LicenseCategory, Student, getCategoryBadgeClass } from '@/types/kreno';
import { CandidateSummaryModal } from '@/components/CandidateSummaryModal';
import { EditStudentModal } from '@/components/EditStudentModal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function CandidatesPage() {
  const { students, searchQuery, deleteStudent, userRole } = useKreno();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Registre des Candidats & Dossiers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredStudents.length} candidats trouvés • <strong>Cliquez sur une ligne</strong> pour ouvrir la fiche synthèse (historique, paiements, examens).
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 mr-2">Filtrer par Catégorie:</span>
          {['all', 'B', 'A', 'C', 'D', 'BE'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                categoryFilter === cat 
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'Toutes' : `Cat. ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Dossier</th>
              <th className="p-4">Candidat</th>
              <th className="p-4">NIN</th>
              <th className="p-4">Permis</th>
              <th className="p-4">Téléphone</th>
              <th className="p-4 text-center">Étape 1: Code</th>
              <th className="p-4 text-center">Étape 2: Créneau</th>
              <th className="p-4 text-center">Étape 3: Conduite</th>
              <th className="p-4 text-center">Situation Financière</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStudents.map(st => {
              const codePassed = st.exams.some(e => e.exam_type === 'code' && e.result === 'passed');
              const creneauPassed = st.exams.some(e => e.exam_type === 'creneau' && e.result === 'passed');
              const circPassed = st.exams.some(e => e.exam_type === 'circulation' && e.result === 'passed');
              const remaining = Math.max(0, (st.total_package_price || 0) - (st.amount_paid || 0));

              return (
                <tr 
                  key={st.id} 
                  onClick={() => handleRowClick(st)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                >
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600">
                    {st.dossier_number}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block group-hover:text-emerald-600">
                      {st.first_name} {st.last_name}
                    </span>
                    <span className="text-[10px] text-slate-400">Inscrit le {st.deposit_date}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{st.nin}</td>
                  
                  {/* Eye-friendly distinct category badge */}
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg font-black text-xs border ${getCategoryBadgeClass(st.requested_category)}`}>
                      Cat. {st.requested_category}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="font-mono text-slate-700 dark:text-slate-300 block font-bold">{st.phone_number}</span>
                    <span className="text-[11px] text-slate-400">{st.birth_commune}</span>
                  </td>
                  <td className="p-4 text-center">
                    {codePassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">Admis</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">En cours</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {creneauPassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">Admis</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">En attente</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {circPassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">Admis</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">En attente</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {remaining === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        Soldé ({st.amount_paid.toLocaleString()} DZD)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                        Reste {remaining.toLocaleString()} DZD
                      </span>
                    )}
                  </td>
                  
                  {/* Actions: View / Edit / Delete / Open Profile */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(st)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition cursor-pointer"
                        title="Fiche Synthèse Popup"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingStudent(st)}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        title="Modifier ce candidat"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/candidates/${st.id}`}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                        title="Ouvrir le Profil Complet (Page)"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setConfirmDelete({ isOpen: true, student: st })}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        title="Supprimer définitivement ce candidat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Candidate Summary Modal */}
      <CandidateSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
      />

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
