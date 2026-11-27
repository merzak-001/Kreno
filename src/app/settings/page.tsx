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
import { DateInput } from '@/components/DateInput';

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
      <div className="bg-surface p-12 rounded-2xl border border-border-subtle text-center space-y-3 shadow-xs">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Accès Restreint</h3>
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
    if (!unDate || !unReason) return;
    addUnavailablePeriod({
      date: unDate,
      period: unPeriod,
      reason: unReason,
    });
    setUnReason('');
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Title */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Configuration Système
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">• Gérance Auto-École</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Paramètres Généraux & Réglementaires
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Informations de l&apos;agrément ministériel, planning d&apos;ouverture hebdomadaire et grille des frais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. School Information Card */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Agrément & Établissement</h3>
              <p className="text-[11px] text-slate-400">Coordonnées imprimées sur les bordereaux et formulaires Daïra</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Raison Sociale / Nom :</label>
              <input 
                type="text" 
                value={school.name}
                onChange={(e) => setSchool(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">N° d&apos;Agrément :</label>
                <input 
                  type="text" 
                  value={school.agrement_number}
                  onChange={(e) => setSchool(prev => ({ ...prev, agrement_number: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Date d&apos;Agrément :</label>
                <DateInput 
                  value={school.agrement_date || '2021-04-15'}
                  onChange={(val) => setSchool(prev => ({ ...prev, agrement_date: val }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Gérant / Propriétaire :</label>
                <input 
                  type="text" 
                  value={school.owner_name}
                  onChange={(e) => setSchool(prev => ({ ...prev, owner_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Téléphone de l&apos;école :</label>
                <input 
                  type="text" 
                  value={school.phone}
                  onChange={(e) => setSchool(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Adresse complète :</label>
              <input 
                type="text" 
                value={school.address}
                onChange={(e) => setSchool(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Working Days Schedule */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-medium">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Jours Ouvrables de l&apos;Établissement</h3>
              <p className="text-[11px] text-slate-400">Jours pris en compte par le générateur automatique de 30 heures</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {daysList.map(d => {
              const isOpen = settings.working_days.includes(d.id);
              return (
                <div 
                  key={d.id}
                  onClick={() => toggleDay(d.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isOpen 
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900' 
                      : 'bg-slate-50/50 dark:bg-surface-elevated border-border-subtle opacity-60'
                  }`}
                >
                  <span className="font-medium text-slate-900 dark:text-white">{d.label}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-medium border ${
                    isOpen 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                  }`}>
                    {isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2.5 Daily Planning Capacity (6h + 1h Libre) & Extra Hour Fees */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-medium">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Planning Quotidien (6h / Jour : 08h–12h • 14h–16h) &amp; Heures Supplémentaires</h3>
              <p className="text-[11px] text-slate-400">Planning réduit à 6 heures par jour ; option de créneau libre et tarification automatique des absences candidat</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Heure Libre Quotidienne :</label>
              <select
                value={settings.libre_hour || ''}
                onChange={(e) => updateSettings({ libre_hour: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono font-medium text-slate-900 dark:text-white"
              >
                <option value="">Aucune (6h complètes)</option>
                {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'].map((h) => (
                  <option key={h} value={h}>{h} (Libre)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Max Heures / Jour :</label>
              <input
                type="number"
                min={1}
                max={6}
                value={settings.max_hours_per_day ?? 6}
                onChange={(e) => updateSettings({ max_hours_per_day: Math.max(1, Math.min(6, Number(e.target.value) || 6)) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Candidats / Voiture :</label>
              <input
                type="number"
                min={1}
                max={5}
                value={settings.candidates_per_vehicle ?? 3}
                onChange={(e) => updateSettings({ candidates_per_vehicle: Math.max(1, Math.min(5, Number(e.target.value) || 3)) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Tarif Heure Supp. Code (DZD) :</label>
              <input
                type="number"
                min={0}
                step={100}
                value={settings.extra_theory_hour_fee ?? 800}
                onChange={(e) => updateSettings({ extra_theory_hour_fee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Tarif Heure Supp. Pratique (DZD) :</label>
              <input
                type="number"
                min={0}
                step={100}
                value={settings.extra_practical_hour_fee ?? 1500}
                onChange={(e) => updateSettings({ extra_practical_hour_fee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl font-mono font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Exceptional Closures & Unavailable Days */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-medium">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Fermetures Exceptionnelles & Jours Fériés</h3>
              <p className="text-[11px] text-slate-400">Jours automatiquement exclus lors de la génération de plannings</p>
            </div>
          </div>

          {/* Add Closure Form */}
          <form onSubmit={handleAddUnavailable} className="bg-slate-50/70 dark:bg-surface-elevated/60 p-4 rounded-xl border border-border-subtle grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
            <div>
              <label className="block text-slate-500 text-[11px] mb-1 font-medium">Date de fermeture :</label>
              <DateInput 
                required
                value={unDate}
                onChange={setUnDate}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-border-subtle rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[11px] mb-1 font-medium">Période :</label>
              <select
                value={unPeriod}
                onChange={(e) => setUnPeriod(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-border-subtle rounded-lg font-medium"
              >
                <option value="full_day">Journée entière</option>
                <option value="morning">Matinée uniquement</option>
                <option value="afternoon">Après-midi uniquement</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-[11px] mb-1 font-medium">Motif :</label>
              <input 
                type="text"
                required
                placeholder="Ex: Fête nationale, Maintenance..."
                value={unReason}
                onChange={(e) => setUnReason(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-border-subtle rounded-lg font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg font-medium transition cursor-pointer text-xs"
            >
              Ajouter fermeture
            </button>
          </form>

          {/* List of Closures */}
          <div className="space-y-2">
            {settings.unavailable_periods.map(period => (
              <div 
                key={period.id}
                className="p-3 bg-slate-50/70 dark:bg-surface-elevated rounded-xl border border-border-subtle flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-medium text-slate-900 dark:text-white mr-3">{period.date}</span>
                  <span className="text-slate-600 dark:text-slate-300">{period.reason}</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">({period.period})</span>
                </div>
                <button
                  onClick={() => removeUnavailablePeriod(period.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
