'use client';

import React from 'react';
import { Car, ShieldCheck, Wrench, Plus, AlertCircle } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';

export default function VehiclesPage() {
  const { vehicles } = useKreno();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Parc des Véhicules d&apos;Apprentissage</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suivi des dates d&apos;échéance du contrôle technique et des polices d&apos;assurance pour chaque véhicule.
          </p>
        </div>
        <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs">
          <Plus className="w-4 h-4" /> Ajouter un Véhicule
        </button>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  Permis Catégorie {v.category}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">{v.brand} {v.model}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                <Car className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-center text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wider">
              {v.plate_number}
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Validité Assurance:
                </span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{v.insurance_expiry}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" /> Contrôle Technique:
                </span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{v.technical_control_expiry}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
