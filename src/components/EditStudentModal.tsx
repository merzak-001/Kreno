'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, DollarSign, Save, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Student, LicenseCategory, ContractDetails } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export function EditStudentModal({ isOpen, onClose, student }: EditStudentModalProps) {
  const { updateStudent } = useKreno();
  const [showContractSection, setShowContractSection] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    first_name_ar: '',
    last_name_ar: '',
    nin: '',
    phone_number: '',
    requested_category: 'B' as LicenseCategory,
    birth_date: '',
    birth_commune: '',
    birth_wilaya: '',
    address_commune: '',
    address_wilaya: '',
    total_package_price: 40000,
  });

  const [contractData, setContractData] = useState<ContractDetails>({
    theory_hours: 15,
    theory_hour_rate: 800,
    practical_hours: 20,
    practical_hour_rate: 1500,
    contract_city: '',
    contract_date: '',
    guardian_name: '',
    guardian_surname: '',
    guardian_birth_date: '',
    guardian_birth_place: '',
    guardian_address: '',
    guardian_phone: '',
  });

  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        first_name_ar: student.first_name_ar || '',
        last_name_ar: student.last_name_ar || '',
        nin: student.nin || '',
        phone_number: student.phone_number || '',
        requested_category: student.requested_category || 'B',
        birth_date: student.birth_date || '',
        birth_commune: student.birth_commune || '',
        birth_wilaya: student.birth_wilaya || '',
        address_commune: student.address_commune || '',
        address_wilaya: student.address_wilaya || '',
        total_package_price: student.total_package_price || 40000,
      });

      setContractData({
        theory_hours: student.contract_details?.theory_hours ?? 15,
        theory_hour_rate: student.contract_details?.theory_hour_rate ?? 800,
        practical_hours: student.contract_details?.practical_hours ?? 20,
        practical_hour_rate: student.contract_details?.practical_hour_rate ?? 1500,
        contract_city: student.contract_details?.contract_city || student.address_commune || '',
        contract_date: student.contract_details?.contract_date || student.deposit_date || '',
        guardian_name: student.contract_details?.guardian_name || '',
        guardian_surname: student.contract_details?.guardian_surname || '',
        guardian_birth_date: student.contract_details?.guardian_birth_date || '',
        guardian_birth_place: student.contract_details?.guardian_birth_place || '',
        guardian_address: student.contract_details?.guardian_address || '',
        guardian_phone: student.contract_details?.guardian_phone || '',
      });
    }
  }, [student]);

  useEscapeKey(isOpen, onClose);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudent(student.id, {
      ...formData,
      total_package_price: Number(formData.total_package_price),
      contract_details: contractData,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-2xl border border-border-subtle overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary border border-primary-subtle-border flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-200">
                Modifier le Dossier Candidat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dossier {student.dossier_number} • {student.first_name} {student.last_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom (Français)</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prénom (Français)</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اللقب (بالعربية)</label>
              <input
                type="text"
                dir="rtl"
                value={formData.last_name_ar}
                onChange={e => setFormData({ ...formData, last_name_ar: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم (بالعربية)</label>
              <input
                type="text"
                dir="rtl"
                value={formData.first_name_ar}
                onChange={e => setFormData({ ...formData, first_name_ar: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Numéro National (NIN 18 chiffres)</label>
              <input
                type="text"
                required
                maxLength={18}
                value={formData.nin}
                onChange={e => setFormData({ ...formData, nin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Numéro de Téléphone</label>
              <input
                type="text"
                required
                value={formData.phone_number}
                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catégorie du Permis</label>
              <select
                value={formData.requested_category}
                onChange={e => setFormData({ ...formData, requested_category: e.target.value as LicenseCategory })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              >
                <option value="A1">Catégorie A1 (Moto légère)</option>
                <option value="A">Catégorie A (Moto)</option>
                <option value="B">Catégorie B (Tourisme)</option>
                <option value="BE">Catégorie BE (Remorque)</option>
                <option value="C1">Catégorie C1 (Poids moyen)</option>
                <option value="C">Catégorie C (Poids lourd)</option>
                <option value="CE">Catégorie CE (Semi-remorque)</option>
                <option value="D">Catégorie D (Transport en commun)</option>
                <option value="DE">Catégorie DE</option>
                <option value="F">Catégorie F (Handicap)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date de Naissance</label>
              <input
                type="date"
                required
                value={formData.birth_date}
                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tarif Forfait (DZD)</label>
              <input
                type="number"
                required
                value={formData.total_package_price}
                onChange={e => setFormData({ ...formData, total_package_price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Commune de Naissance</label>
              <input
                type="text"
                value={formData.birth_commune}
                onChange={e => setFormData({ ...formData, birth_commune: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Wilaya de Naissance</label>
              <input
                type="text"
                value={formData.birth_wilaya}
                onChange={e => setFormData({ ...formData, birth_wilaya: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Section Personnalisation du Contrat d'Enseignement (Page 1 & 2) */}
          <div className="border border-border-subtle rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
            <button
              type="button"
              onClick={() => setShowContractSection(!showContractSection)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Paramètres Spécifiques du Contrat (Page 1 & Page 2)
                </span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Tarification & Tuteur
                </span>
              </div>
              {showContractSection ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showContractSection && (
              <div className="p-4 pt-2 border-t border-border-subtle space-y-4 text-xs">
                {/* 1. Tarifs et Heures de la Page 2 */}
                <div>
                  <h4 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 mb-2">
                    1. Détail de la Grille Tarifaire (Page 2 - خامسا) :
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-border-subtle">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Heures Théoriques (Code)</label>
                      <input
                        type="number"
                        value={contractData.theory_hours ?? 15}
                        onChange={e => setContractData({ ...contractData, theory_hours: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Prix Heure Théorie (DZD)</label>
                      <input
                        type="number"
                        value={contractData.theory_hour_rate ?? 800}
                        onChange={e => setContractData({ ...contractData, theory_hour_rate: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Heures Pratiques (Conduite)</label>
                      <input
                        type="number"
                        value={contractData.practical_hours ?? 20}
                        onChange={e => setContractData({ ...contractData, practical_hours: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Prix Heure Pratique (DZD)</label>
                      <input
                        type="number"
                        value={contractData.practical_hour_rate ?? 1500}
                        onChange={e => setContractData({ ...contractData, practical_hour_rate: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Signature & Lieu */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Lieu de Signature (حرر بـ)</label>
                    <input
                      type="text"
                      placeholder="Ex: Sétif / سطيف"
                      value={contractData.contract_city || ''}
                      onChange={e => setContractData({ ...contractData, contract_city: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-border-subtle bg-white dark:bg-slate-900/50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Date de Signature (بتاريخ)</label>
                    <input
                      type="date"
                      value={contractData.contract_date || ''}
                      onChange={e => setContractData({ ...contractData, contract_date: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-border-subtle bg-white dark:bg-slate-900/50 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* 3. Tuteur Légal (Pour Candidat Mineur) */}
                <div>
                  <h4 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 mb-2">
                    2. Renseignements du Tuteur Légal (عند الاقتضاء - الممثل الشرعي) :
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-border-subtle">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">اللقب (Nom du Tuteur)</label>
                      <input
                        type="text"
                        placeholder="Ex: بن علي"
                        value={contractData.guardian_surname || ''}
                        onChange={e => setContractData({ ...contractData, guardian_surname: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">الاسم (Prénom du Tuteur)</label>
                      <input
                        type="text"
                        placeholder="Ex: محمد"
                        value={contractData.guardian_name || ''}
                        onChange={e => setContractData({ ...contractData, guardian_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">المولود في (Date de naissance)</label>
                      <input
                        type="text"
                        placeholder="JJ/MM/AAAA"
                        value={contractData.guardian_birth_date || ''}
                        onChange={e => setContractData({ ...contractData, guardian_birth_date: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">بـ (Lieu de naissance)</label>
                      <input
                        type="text"
                        placeholder="Ex: سطيف"
                        value={contractData.guardian_birth_place || ''}
                        onChange={e => setContractData({ ...contractData, guardian_birth_place: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">العنوان (Adresse du Tuteur)</label>
                      <input
                        type="text"
                        placeholder="Ex: حي 500 مسكن، سطيف"
                        value={contractData.guardian_address || ''}
                        onChange={e => setContractData({ ...contractData, guardian_address: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">الهاتف (Téléphone du Tuteur)</label>
                      <input
                        type="text"
                        placeholder="0550 00 00 00"
                        value={contractData.guardian_phone || ''}
                        onChange={e => setContractData({ ...contractData, guardian_phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border-subtle bg-surface text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
