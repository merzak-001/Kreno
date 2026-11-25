'use client';

import React, { useState } from 'react';
import { X, Car } from 'lucide-react';
import { Vehicle, LicenseCategory } from '@/types/kreno';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { DateInput } from '@/components/DateInput';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id'>) => void;
  vehicleToEdit?: Vehicle | null;
}

export function VehicleModal({ isOpen, onClose, onSave, vehicleToEdit }: VehicleModalProps) {
  const [brand, setBrand] = useState(vehicleToEdit?.brand || '');
  const [model, setModel] = useState(vehicleToEdit?.model || '');
  const [plateNumber, setPlateNumber] = useState(vehicleToEdit?.plate_number || '');
  const [category, setCategory] = useState<LicenseCategory>(vehicleToEdit?.category || 'B');
  const [technicalControlExpiry, setTechnicalControlExpiry] = useState(vehicleToEdit?.technical_control_expiry || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(vehicleToEdit?.insurance_expiry || '');

  useEscapeKey(isOpen, onClose);

  // Sync state if editing
  React.useEffect(() => {
    if (vehicleToEdit) {
      setBrand(vehicleToEdit.brand);
      setModel(vehicleToEdit.model);
      setPlateNumber(vehicleToEdit.plate_number);
      setCategory(vehicleToEdit.category);
      setTechnicalControlExpiry(vehicleToEdit.technical_control_expiry);
      setInsuranceExpiry(vehicleToEdit.insurance_expiry);
    } else {
      setBrand('');
      setModel('');
      setPlateNumber('');
      setCategory('B');
      setTechnicalControlExpiry('');
      setInsuranceExpiry('');
    }
  }, [vehicleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !plateNumber) return;

    onSave({
      brand,
      model,
      plate_number: plateNumber,
      category,
      technical_control_expiry: technicalControlExpiry || '2027-01-01',
      insurance_expiry: insuranceExpiry || '2027-01-01',
      is_active: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl w-full max-w-lg shadow-2xl border border-border-subtle overflow-hidden text-slate-900 dark:text-white flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {vehicleToEdit ? 'Modifier le Véhicule' : 'Ajouter un Véhicule'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parc automobile et dates d&apos;échéance
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-elevated transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Marque (ex: Renault, Peugeot) *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="ex: Renault"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Modèle (ex: Clio 4, 208) *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: Clio 4"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Matricule / Immatriculation *
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="12456-118-19"
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Catégorie de Permis *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LicenseCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              >
                <option value="B">Catégorie B (Tourisme)</option>
                <option value="A">Catégorie A (Moto)</option>
                <option value="A1">Catégorie A1</option>
                <option value="BE">Catégorie BE (Remorque)</option>
                <option value="C">Catégorie C (Poids Lourd)</option>
                <option value="C1">Catégorie C1</option>
                <option value="CE">Catégorie CE</option>
                <option value="D">Catégorie D (Transport en commun)</option>
                <option value="F">Catégorie F</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-subtle">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Validité Assurance :
              </label>
              <DateInput
                value={insuranceExpiry}
                onChange={setInsuranceExpiry}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Contrôle Technique :
              </label>
              <DateInput
                value={technicalControlExpiry}
                onChange={setTechnicalControlExpiry}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-elevated border border-border-subtle rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-elevated rounded-xl font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {vehicleToEdit ? 'Mettre à jour' : 'Enregistrer le véhicule'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
