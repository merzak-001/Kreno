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
    <div className="space-y-6 w-full">
      
      {/* Title */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Parc des Véhicules d&apos;Apprentissage</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {vehicles.length} véhicules répertoriés • Suivi des dates d&apos;échéance du contrôle technique et des polices d&apos;assurance.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-blue-600/20"
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
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-900">
                  Permis Catégorie {v.category}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-2">{v.brand} {v.model}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isOwner && (
                  <button
                    onClick={() => setConfirmDelete({ isOpen: true, vehicle: v })}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-border-subtle pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Immatriculation :</span>
                <strong className="font-mono text-slate-900 dark:text-white font-medium">{v.plate_number}</strong>
              </div>
            </div>

            {/* Insurance & Inspection Expiry Badges */}
            <div className="bg-slate-50/70 dark:bg-surface-elevated/60 p-3 rounded-xl border border-border-subtle space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-slate-400" />
                  <span>Contrôle technique :</span>
                </span>
                <strong className="font-mono text-slate-800 dark:text-slate-200 font-medium">{v.technical_control_expiry}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  <span>Assurance auto :</span>
                </span>
                <strong className="font-mono text-slate-800 dark:text-slate-200 font-medium">{v.insurance_expiry}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Statut :</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                v.is_active 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}>
                {v.is_active ? 'Opérationnel' : 'En révision'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Add/Edit Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicleToEdit={editingVehicle}
        onSave={handleSaveVehicle}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Supprimer un véhicule"
        message={`Êtes-vous certain de vouloir retirer le véhicule ${confirmDelete.vehicle?.brand} ${confirmDelete.vehicle?.model} (${confirmDelete.vehicle?.plate_number}) du parc ?`}
        warningNote="Cette action est irréversible."
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
