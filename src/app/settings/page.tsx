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
      <div className="bg-card-bg p-12 rounded-2xl border border-card-border text-center space-y-3">
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
      <div className="bg-card-bg p-5 rounded-2xl border border-card-border shadow-xs transition-colors">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-200">Paramètres Généraux de l&apos;Établissement</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configuration de la langue du système, des jours d&apos;ouverture hebdomadaires (Samedi au Jeudi par défaut), des unités de 01 heure et des frais d&apos;examen.
        </p>
      </div>

      {/* Row 1: Language & Exam Fees Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Language Selection Card */}
        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-card-border">
            <Languages className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Langue de l&apos;Interface Applicative</h3>
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
                  ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/20'
                  : 'border-card-border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
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
                  ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/20'
                  : 'border-card-border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
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

        {/* Standard Exam Fee & Tariff */}
        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-card-border">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Droits & Frais d&apos;Examen par Passage</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tarif réglementaire des frais administratifs exigibles à chaque épreuve d&apos;examen (Code, Créneau, Conduite).
          </p>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Frais d&apos;examen par défaut (DZD):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="500"
                  value={settings.standard_exam_fee || 2000}
                  onChange={(e) => updateSettings({ standard_exam_fee: Number(e.target.value) })}
                  className="w-40 px-3 py-2 bg-white dark:bg-slate-800 border border-card-border rounded-xl font-mono font-bold text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-slate-200"
                />
                <span className="text-xs font-bold text-slate-500">DZD / épreuve</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-200">
              <span className="font-bold block">Rappel sur les encaissements :</span>
              <span>Chaque fois qu&apos;un candidat passe un examen, le système enregistre automatiquement cette ligne de frais et permet de marquer son encaissement.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Working Days & Daily Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Working Days */}
        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-card-border">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Jours Ouvrables Hebdomadaires</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Par défaut en Algérie : <strong>du Samedi au Jeudi</strong>. Vendredi est le jour de repos légal. Le générateur de planning automatique respecte strictement ces jours.
          </p>

          <div className="space-y-2 pt-2">
            {daysList.map(d => {
              const isChecked = settings.working_days.includes(d.id);
              return (
                <label 
                  key={d.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer text-xs ${
                    isChecked 
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900 text-slate-900 dark:text-slate-200 font-bold' 
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-card-border text-slate-400 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDay(d.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
                    />
                    <span>{d.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isChecked ? 'Ouvert (Séances programmées)' : 'Fermé'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Working Hours & Unit */}
        <div className="space-y-6">
          <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-card-border">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Créneaux Horaires Quotidiens (Unité 01 Heure)</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Heure d&apos;ouverture:</label>
                <input
                  type="time"
                  value={settings.start_hour}
                  onChange={(e) => updateSettings({ start_hour: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-card-border rounded-lg font-mono font-bold text-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Heure de fermeture:</label>
                <input
                  type="time"
                  value={settings.end_hour}
                  onChange={(e) => updateSettings({ end_hour: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-card-border rounded-lg font-mono font-bold text-slate-900 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-card-border text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold block text-slate-900 dark:text-slate-200">Unité de séance standard:</span>
              <span>1 séance = <strong>01 heure fixe</strong> (ex: 08:00 - 09:00, 09:00 - 10:00). Pause déjeuner de 12:00 à 13:00.</span>
            </div>
          </div>

          {/* School Legal Info */}
          <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-card-border">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Agrément & Établissement</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">N° d&apos;Agrément Officiel:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{school.agrement_number}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Police d&apos;Assurance:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{school.insurance_policy_number}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Gérant Propriétaire:</span>
                <strong className="text-slate-800 dark:text-slate-200">{school.owner_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Téléphone:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{school.phone}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Exceptions & Unavailability Manager (Day or Half-Day) */}
      <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 pb-3 border-b border-card-border">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Indisponibilités & Fermetures Exceptionnelles</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          En cas d&apos;indisponibilité (journée complète ou demi-journée : matinée ou après-midi), déclarez-la ci-dessous. Le système réajuste les plannings automatiquement.
        </p>

        {/* Form to add unavailability */}
        <form onSubmit={handleAddUnavailable} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-card-border grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date d&apos;indisponibilité:</label>
            <input
              type="date"
              value={unDate}
              onChange={(e) => setUnDate(e.target.value)}
              className="w-full px-3 py-2 bg-card-bg border border-card-border rounded-lg font-mono font-bold text-slate-900 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Période d&apos;absence:</label>
            <select
              value={unPeriod}
              onChange={(e) => setUnPeriod(e.target.value as any)}
              className="w-full px-3 py-2 bg-card-bg border border-card-border rounded-lg font-bold text-slate-900 dark:text-slate-200"
            >
              <option value="full_day">Journée entière (Toute la journée)</option>
              <option value="morning">Matinée uniquement (08h - 12h)</option>
              <option value="afternoon">Après-midi uniquement (13h - 17h)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Motif:</label>
            <input
              type="text"
              value={unReason}
              onChange={(e) => setUnReason(e.target.value)}
              placeholder="ex: Maintenance véhicule ou jour férié"
              className="w-full px-3 py-2 bg-card-bg border border-card-border rounded-lg text-slate-900 dark:text-slate-200"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-brand-primary dark:hover:bg-blue-800 text-white rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Enregistrer l&apos;absence
            </button>
          </div>
        </form>

        {/* List of active exceptions */}
        <div className="space-y-2 pt-2">
          {settings.unavailable_periods.length > 0 ? (
            settings.unavailable_periods.map(p => (
              <div key={p.id} className="p-3 bg-white dark:bg-slate-800 border border-card-border rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200 mr-2">{p.date}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 text-[10px] mr-2">
                    {p.period === 'full_day' ? 'Journée complète' : p.period === 'morning' ? 'Matinée (08h-12h)' : 'Après-midi (13h-17h)'}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{p.reason}</span>
                </div>
                <button
                  onClick={() => removeUnavailablePeriod(p.id)}
                  className="text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                  title="Supprimer cette indisponibilité"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Aucune fermeture exceptionnelle déclarée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
