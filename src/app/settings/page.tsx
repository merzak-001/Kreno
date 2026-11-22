'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Calendar, 
  Check, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Building,
  ShieldCheck,
  Languages,
  DollarSign
} from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { DayOfWeek } from '@/types/kreno';

export default function SettingsPage() {
  const { 
    settings, 
    updateSettings, 
    addUnavailablePeriod, 
    removeUnavailablePeriod, 
    school, 
    setSchool, 
    userRole,
    lang,
    setLang
  } = useKreno();
  const isOwner = userRole === 'owner';

  // State for adding unavailable period
  const [unDate, setUnDate] = useState('2026-12-01');
  const [unPeriod, setUnPeriod] = useState<'full_day' | 'morning' | 'afternoon'>('full_day');
  const [unReason, setUnReason] = useState('Fermeture exceptionnelle');

  // Days list: in French mode, zero Arabic characters!
  const daysList: { id: DayOfWeek; label: string }[] = [
    { id: 'saturday', label: 'Samedi' },
    { id: 'sunday', label: 'Dimanche' },
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi (Jour de Repos Hebdomadaire)' },
  ];

  if (!isOwner) {
    return (
      <div className="bg-surface p-12 rounded-3xl border border-border-subtle text-center space-y-3 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Accès Restreint</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Seul le Propriétaire (Gérant de l&apos;auto-école) peut modifier les paramètres généraux, jours ouvrables et tarifs.
        </p>
      </div>
    );
  }

  const toggleDay = (day: DayOfWeek) => {
    let updated: DayOfWeek[];
    if (settings.working_days.includes(day)) {
      updated = settings.working_days.filter(d => d !== day);
    } else {
      updated = [...settings.working_days, day];
    }
    updateSettings({ working_days: updated });
  };

  const handleAddUnavailable = (e: React.FormEvent) => {
    e.preventDefault();
    addUnavailablePeriod({
      date: unDate,
      period: unPeriod,
      reason: unReason,
    });
    setUnReason('');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs transition-colors">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Paramètres Généraux de l&apos;Établissement</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configuration de la langue du système, des jours d&apos;ouverture hebdomadaires (Samedi au Jeudi par défaut), des unités de 01 heure et des frais d&apos;examen.
        </p>
      </div>

      {/* Row 1: Language & Exam Fees Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Language Selection Card */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <Languages className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Langue de l&apos;Interface Applicative</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sélectionnez la langue par défaut. Votre choix est mémorisé sur ce poste de travail jusqu&apos;à modification ultérieure.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                lang === 'fr'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/20'
                  : 'border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-sm">Français (France / DZ)</span>
                {lang === 'fr' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Mode standard avec zéro caractère arabe dans les menus et interfaces de gestion.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                lang === 'ar'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/20'
                  : 'border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-sm">Mode Hybride (FR/AR)</span>
                {lang === 'ar' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Permet l&apos;affichage bilingue pour l&apos;impression directe des documents administratifs.
              </span>
            </button>
          </div>
        </div>

        {/* Exam Fees Settings Card */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Frais Réglementaires d&apos;Examen par Catégorie</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fixez le tarif officiel de l&apos;examen pour chaque catégorie de permis (Code, Créneau, Conduite). Ces montants s&apos;appliquent automatiquement.
          </p>

          <div className="p-4 rounded-xl border border-border-subtle bg-slate-50/70 dark:bg-surface-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tarif Standard Général :</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.standard_exam_fee}
                  onChange={(e) => updateSettings({ standard_exam_fee: Number(e.target.value) || 2000 })}
                  className="w-28 px-3 py-1.5 border border-border-subtle rounded-lg font-mono font-bold text-sm text-right bg-white dark:bg-surface text-slate-900 dark:text-white"
                />
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">DZD</span>
              </div>
            </div>

            {/* Grid for each category fee */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2 uppercase tracking-wider">
                Frais Fixes par Catégorie de Permis :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(['A1', 'A', 'B', 'BE', 'C1', 'C', 'CE', 'D'] as const).map(cat => {
                  const currentFee = settings.category_exam_fees?.[cat] ?? settings.standard_exam_fee ?? 2000;
                  return (
                    <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">Cat. {cat}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={currentFee}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            updateSettings({
                              category_exam_fees: {
                                ...(settings.category_exam_fees || {}),
                                [cat]: val,
                              }
                            });
                          }}
                          className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">DZD</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Working Days & Working Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Working Days Card */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Jours Ouvrables de la Semaine</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Par défaut : <strong>Du Samedi au Jeudi</strong>. Le planning s&apos;ajuste automatiquement selon les jours cochés ci-dessous.
          </p>

          <div className="space-y-2 pt-1">
            {daysList.map(d => {
              const isChecked = settings.working_days.includes(d.id);
              return (
                <div 
                  key={d.id} 
                  onClick={() => toggleDay(d.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isChecked 
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200' 
                      : 'border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-bold">{d.label}</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition ${
                    isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Working Hours & 1h Unit Card */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Amplitude Horaire Quotidienne (Unité: 01 Heure)</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Toutes les séances de formation sont calculées en unités de <strong>01 heure</strong> fixe.
          </p>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border-subtle bg-slate-50/70 dark:bg-surface-elevated">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Heure de Début :
              </label>
              <input
                type="time"
                value={settings.start_hour}
                onChange={(e) => updateSettings({ start_hour: e.target.value })}
                className="w-full px-3 py-2 border border-border-subtle rounded-xl font-mono text-sm font-bold bg-white dark:bg-surface text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Heure de Fin :
              </label>
              <input
                type="time"
                value={settings.end_hour}
                onChange={(e) => updateSettings({ end_hour: e.target.value })}
                className="w-full px-3 py-2 border border-border-subtle rounded-xl font-mono text-sm font-bold bg-white dark:bg-surface text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* School Identity */}
          <div className="pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle mb-3">
              <Building className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Établissement & Agrément</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Nom de l&apos;Auto-École :</label>
                <input
                  type="text"
                  value={school.name}
                  onChange={(e) => setSchool({ ...school, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg font-bold bg-white dark:bg-surface text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">N° d&apos;Agrément :</label>
                <input
                  type="text"
                  value={school.agrement_number}
                  onChange={(e) => setSchool({ ...school, agrement_number: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg font-mono font-bold bg-white dark:bg-surface text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Wilaya :</label>
                <input
                  type="text"
                  value={school.wilaya}
                  onChange={(e) => setSchool({ ...school, wilaya: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg font-bold bg-white dark:bg-surface text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Téléphone :</label>
                <input
                  type="text"
                  value={school.phone}
                  onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg font-mono font-bold bg-white dark:bg-surface text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Manage Unavailabilities */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Déclarer une Indisponibilité ou Fermeture Exceptionnelle</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Si l&apos;auto-école ou un moniteur s&apos;absente sur une demi-journée ou journée entière, le planning se réadapte instantanément.
        </p>

        {/* Add Form */}
        <form onSubmit={handleAddUnavailable} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-slate-50/70 dark:bg-surface-elevated p-4 rounded-xl border border-border-subtle">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Date concernée :</label>
            <input
              type="date"
              value={unDate}
              onChange={(e) => setUnDate(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg font-mono bg-white dark:bg-surface text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Période d&apos;absence :</label>
            <select
              value={unPeriod}
              onChange={(e) => setUnPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg font-bold bg-white dark:bg-surface text-slate-900 dark:text-white"
            >
              <option value="full_day">Journée entière (24h)</option>
              <option value="morning">Matinée uniquement</option>
              <option value="afternoon">Après-midi uniquement</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Motif / Justification :</label>
            <input
              type="text"
              value={unReason}
              onChange={(e) => setUnReason(e.target.value)}
              placeholder="Ex: Entretien véhicule, congé, etc."
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-white dark:bg-surface text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer l&apos;Absence</span>
            </button>
          </div>
        </form>

        {/* Existing Unavailabilities List */}
        <div className="space-y-2 pt-2">
          {settings.unavailable_periods.length > 0 ? (
            settings.unavailable_periods.map(p => (
              <div 
                key={p.id}
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-amber-900 dark:text-amber-200">{p.date}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="font-bold capitalize text-slate-700 dark:text-slate-300">
                    {p.period === 'full_day' ? 'Journée entière' : p.period === 'morning' ? 'Matinée' : 'Après-midi'}
                  </span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-slate-600 dark:text-slate-400">{p.reason}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeUnavailablePeriod(p.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                  title="Supprimer cette indisponibilité"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Aucune indisponibilité déclarée actuellement.</p>
          )}
        </div>
      </div>
    </div>
  );
}
