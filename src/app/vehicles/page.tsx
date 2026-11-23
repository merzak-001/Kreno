'use client';

import React, { useState } from 'react';
import { Car, ShieldCheck, Wrench, Plus, Edit2, Trash2 } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';
import { Vehicle } from '@/types/kreno';
import { VehicleModal } from '@/components/VehicleModal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, userRole } = useKreno();
  const isOwner = userRole === 'owner';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; vehicle: Vehicle | null }>({
    isOpen: false,
    vehicle: null,
  });

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, vehicleData);
    } else {
      addVehicle(vehicleData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Parc des Véhicules d&apos;Apprentissage</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {vehicles.length} véhicules répertoriés • Suivi des dates d&apos;échéance du contrôle technique et des polices d&apos;assurance.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Véhicule</span>
        </button>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vehicles.map(v => (
          <div key={v.id} className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900 shadow-2xs">
                  Permis Catégorie {v.category}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">{v.brand} {v.model}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                  title="Modifier ce véhicule"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {isOwner && (
                  <button
                    onClick={() => setConfirmDelete({ isOpen: true, vehicle: v })}
                    className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    title="Supprimer ce véhicule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-surface-elevated text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs border border-border-subtle ml-1">
                  <Car className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-surface-elevated rounded-xl border border-border-subtle font-mono text-center text-sm font-bold text-slate-900 dark:text-white tracking-wider shadow-inner">
              {v.plate_number}
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-border-subtle">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Validité Assurance :</span>
                </span>
                <strong className="font-mono text-slate-900 dark:text-white">{v.insurance_expiry}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Contrôle Technique :</span>
                </span>
                <strong className="font-mono text-slate-900 dark:text-white">{v.technical_control_expiry}</strong>
              </div>
            </div>
          </div>
        ))}

        {vehicles.length === 0 && (
          <div className="col-span-full bg-surface p-12 rounded-2xl border border-dashed border-border-subtle text-center text-slate-400">
            <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm">Aucun véhicule enregistré.</p>
            <p className="text-xs text-slate-500 mt-1">Cliquez sur &quot;Ajouter un Véhicule&quot; pour enrichir votre flotte.</p>
          </div>
        )}
      </div>

      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVehicle}
        vehicleToEdit={editingVehicle}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Supprimer le véhicule"
        message={`Êtes-vous sûr de vouloir supprimer le véhicule ${confirmDelete.vehicle?.brand} ${confirmDelete.vehicle?.model} (${confirmDelete.vehicle?.plate_number}) ?`}
        warningNote="Cette opération sera enregistrée dans le journal d'audit."
        confirmText="Supprimer"
        onConfirm={() => {
          if (confirmDelete.vehicle) {
            deleteVehicle(confirmDelete.vehicle.id);
          }
          setConfirmDelete({ isOpen: false, vehicle: null });
        }}
        onCancel={() => setConfirmDelete({ isOpen: false, vehicle: null })}
      />
    </div>
  );
}
