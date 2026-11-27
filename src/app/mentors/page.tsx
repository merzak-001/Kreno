'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  CalendarDays,
  Check,
  X,
  Sliders,
  Users,
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import {
  LicenseCategory,
  Mentor,
  SessionDiscipline,
  getCategoryBadgeClass,
} from '@/types/kreno';

const ALL_CATEGORIES: LicenseCategory[] = [
  'A1',
  'A',
  'B',
  'BE',
  'C1',
  'C1E',
  'C',
  'CE',
  'D',
  'DE',
  'F',
];

const DISCIPLINES: { id: SessionDiscipline; label: string; badgeClass: string }[] = [
  {
    id: 'code',
    label: '1. Code théorique',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'creneau',
    label: '2. Créneau / Piste',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'circulation',
    label: '3. Circulation / Route',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
];

export default function MentorsPage() {
  const {
    mentors,
    addMentor,
    updateMentor,
    deleteMentor,
    students,
    settings,
    updateSettings,
    getSlotCapacityLimit,
  } = useKreno();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState<SessionDiscipline[]>(['creneau', 'circulation']);
  const [licenseCategories, setLicenseCategories] = useState<LicenseCategory[]>(['B']);
  const [isActive, setIsActive] = useState(true);

  const mentorSlotCounts = useMemo(() => {
    const map = new Map<string, { scheduled: number; completed: number }>();
    students.forEach((st) => {
      (st.schedule_slots || []).forEach((slot) => {
        const entry = map.get(slot.instructor_name) || { scheduled: 0, completed: 0 };
        if (slot.status === 'scheduled') entry.scheduled += 1;
        if (slot.status === 'completed') entry.completed += 1;
        map.set(slot.instructor_name, entry);
      });
    });
    return map;
  }, [students]);

  const openAddModal = () => {
    setEditingMentor(null);
    setName('');
    setPhone('');
    setSpecialties(['creneau', 'circulation']);
    setLicenseCategories(['B']);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Mentor) => {
    setEditingMentor(m);
    setName(m.name);
    setPhone(m.phone || '');
    setSpecialties(m.specialties);
    setLicenseCategories(m.license_categories);
    setIsActive(m.is_active);
    setIsModalOpen(true);
  };

  const toggleSpecialty = (sp: SessionDiscipline) => {
    setSpecialties((prev) =>
      prev.includes(sp) ? prev.filter((item) => item !== sp) : [...prev, sp]
    );
  };

  const toggleCategory = (cat: LicenseCategory) => {
    setLicenseCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || specialties.length === 0 || licenseCategories.length === 0) return;

    if (editingMentor) {
      updateMentor(editingMentor.id, {
        name: name.trim(),
        phone: phone.trim(),
        specialties,
        license_categories: licenseCategories,
        is_active: isActive,
      });
    } else {
      addMentor({
        name: name.trim(),
        phone: phone.trim(),
        specialties,
        license_categories: licenseCategories,
        is_active: isActive,
      });
    }
    setIsModalOpen(false);
  };

  const handleCapacityChange = (
    cat: LicenseCategory,
    discipline: SessionDiscipline,
    val: number
  ) => {
    const cleanVal = Math.max(1, Math.min(30, Number.isFinite(val) ? val : 1));
    const currentRules = settings.capacity_rules || {};
    const existingForCat = currentRules[cat] || {
      code: getSlotCapacityLimit('code', cat),
      creneau: getSlotCapacityLimit('creneau', cat),
      circulation: getSlotCapacityLimit('circulation', cat),
    };
    updateSettings({
      capacity_rules: {
        ...currentRules,
        [cat]: {
          ...existingForCat,
          [discipline]: cleanVal,
        },
      },
    });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Équipe Pédagogique
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">
              • {mentors.filter((m) => m.is_active).length} moniteur(s) actif(s)
            </span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Moniteurs &amp; Limites de Capacité Horaire
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chaque moniteur ajouté dispose de son propre onglet dans le planning. Définissez les limites horaires par discipline et par catégorie de permis.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un moniteur</span>
        </button>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mentors.map((mentor) => {
          const stats = mentorSlotCounts.get(mentor.name) || { scheduled: 0, completed: 0 };
          return (
            <div
              key={mentor.id}
              className={`bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col justify-between space-y-4 transition ${
                !mentor.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {mentor.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <Phone className="w-3 h-3" />
                        <span>{mentor.phone || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      mentor.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-surface-elevated text-slate-500 border-border-subtle'
                    }`}
                  >
                    {mentor.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {/* Specialties */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                    Disciplines enseignées
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DISCIPLINES.filter((d) => mentor.specialties.includes(d.id)).map((d) => (
                      <span
                        key={d.id}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${d.badgeClass}`}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* License Categories */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                    Catégories de permis
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mentor.license_categories.map((cat) => (
                      <span
                        key={cat}
                        className={`px-1.5 py-0.5 rounded text-[10px] border ${getCategoryBadgeClass(cat)}`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workload Stats */}
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-slate-500">
                  <span>Séances planifiées : <strong className="font-mono text-slate-900 dark:text-white">{stats.scheduled}h</strong></span>
                  <span>Effectuées : <strong className="font-mono text-emerald-600">{stats.completed}h</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle">
                <Link
                  href={`/schedule?mentor=${encodeURIComponent(mentor.name)}`}
                  className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/60"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Voir son planning</span>
                </Link>
                <button
                  onClick={() => openEditModal(mentor)}
                  className="p-2 rounded-xl border border-border-subtle hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteMentor(mentor.id)}
                  className="p-2 rounded-xl border border-border-subtle hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly Capacity Limits Matrix by Type & License Category */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                Limites de Capacité par Heure (Type de Séance &amp; Permis)
              </h2>
              <p className="text-[11px] text-slate-400">
                Nombre maximum de candidats qu&apos;un moniteur peut prendre en charge sur une même heure selon la discipline et la catégorie de permis.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-slate-300">
            <Users className="w-3.5 h-3.5" />
            <span>Appliqué au générateur automatique et au planning</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-surface-elevated/70 text-slate-500 dark:text-slate-400 border-b border-border-subtle text-[10px] uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Catégorie de Permis</th>
                <th className="py-2.5 px-4 text-blue-600 dark:text-blue-400">1. Code (candidats / h)</th>
                <th className="py-2.5 px-4 text-purple-600 dark:text-purple-400">2. Créneau (candidats / h)</th>
                <th className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">3. Circulation (candidats / h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {ALL_CATEGORIES.map((cat) => (
                <tr key={cat} className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/40">
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryBadgeClass(cat)}`}>
                      Permis {cat}
                    </span>
                  </td>
                  {(['code', 'creneau', 'circulation'] as SessionDiscipline[]).map((disc) => (
                    <td key={disc} className="py-2.5 px-4">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={getSlotCapacityLimit(disc, cat)}
                        onChange={(e) => handleCapacityChange(cat, disc, Number(e.target.value))}
                        className="w-24 px-2.5 py-1.5 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-lg font-mono font-semibold text-slate-900 dark:text-white"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Mentor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-2xl border border-border-subtle shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                {editingMentor ? `Modifier ${editingMentor.name}` : 'Nouveau Moniteur'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-elevated cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[11px] mb-1 font-medium">Nom du moniteur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: M. Karim"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[11px] mb-1 font-medium">Téléphone</label>
                  <input
                    type="text"
                    placeholder="Ex: 0550 12 34 56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1.5 font-medium">
                  Spécialités (Disciplines enseignées) *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINES.map((d) => {
                    const selected = specialties.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleSpecialty(d.id)}
                        className={`px-3 py-1.5 rounded-xl border font-medium transition cursor-pointer inline-flex items-center gap-1.5 ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                        <span>{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1.5 font-medium">
                  Catégories de permis autorisées *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CATEGORIES.map((cat) => {
                    const selected = licenseCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                          selected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900'
                            : 'bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 border-border-subtle'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border-subtle"
                />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Moniteur actif (disponible dans la génération automatique du planning)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-elevated font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {editingMentor ? 'Enregistrer' : 'Ajouter le moniteur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
