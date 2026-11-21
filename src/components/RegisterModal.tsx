'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react';
import { Student, LicenseCategory } from '@/types/kreno';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: Omit<Student, 'id' | 'exams' | 'schedule_slots' | 'payments'>) => void;
}

export function RegisterModal({ isOpen, onClose, onSaveStudent }: RegisterModalProps) {
  const [nin, setNin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Homme' | 'Femme'>('Homme');
  const [birthDate, setBirthDate] = useState('2004-01-01');
  const [birthCommune, setBirthCommune] = useState('Beidha Bordj');
  const [birthWilaya, setBirthWilaya] = useState('Setif');
  const [fatherName, setFatherName] = useState('');
  const [motherFullName, setMotherFullName] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [maritalStatus, setMaritalStatus] = useState<'Celibataire' | 'Marie' | 'Divorce' | 'Veuf'>('Celibataire');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [addressCommune, setAddressCommune] = useState('Beidha Bordj');
  const [addressWilaya, setAddressWilaya] = useState('Setif');
  const [addressDetails, setAddressDetails] = useState('');
  const [requestedCategory, setRequestedCategory] = useState<LicenseCategory>('B');
  const [totalPackagePrice, setTotalPackagePrice] = useState(40000);
  const [amountPaid, setAmountPaid] = useState(15000);

  if (!isOpen) return null;

  // Auto-detect gender from 18-digit Algerian NIN
  const handleNinChange = (val: string) => {
    setNin(val);
    if (val.length >= 1) {
      if (val[0] === '1') setGender('Homme');
      if (val[0] === '2') setGender('Femme');
    }
  };

  // Age calculation and validation
  const calculateAge = (dateStr: string) => {
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const candidateAge = calculateAge(birthDate);

  // Check Algerian legal conditions
  let ageWarning = '';
  if (requestedCategory === 'A1' && candidateAge < 16) {
    ageWarning = 'La catégorie A1 exige au minimum 16 ans révolus avec autorisation du tuteur légal.';
  } else if ((requestedCategory === 'B' || requestedCategory === 'A') && candidateAge < 18) {
    ageWarning = `La catégorie ${requestedCategory} exige 18 ans révolus. Âge actuel du candidat: ${candidateAge} ans.`;
  } else if (['C', 'C1', 'D', 'BE', 'CE', 'DE'].includes(requestedCategory) && candidateAge < 25) {
    ageWarning = `Les catégories Poids Lourd et Transport (C, D, E) exigent 25 ans minimum et 2 ans d'ancienneté en Catégorie B.`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phoneNumber || !nin) {
      alert('Veuillez remplir les champs obligatoires: Nom, Prénom, NIN et Téléphone.');
      return;
    }

    const dossierNumber = `DOS-2026-${Math.floor(100 + Math.random() * 900)}`;

    onSaveStudent({
      school_id: 'school-1',
      dossier_number: dossierNumber,
      deposit_date: '2026-11-21',
      nin,
      blood_type: bloodType,
      first_name: firstName,
      last_name: lastName,
      gender,
      birth_date: birthDate,
      birth_commune: birthCommune,
      birth_wilaya: birthWilaya,
      father_name: fatherName,
      mother_full_name: motherFullName,
      marital_status: maritalStatus,
      address_wilaya: addressWilaya,
      address_commune: addressCommune,
      address_details: addressDetails,
      phone_number: phoneNumber,
      email,
      requested_category: requestedCategory,
      total_package_price: totalPackagePrice,
      amount_paid: amountPaid,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Inscription Nouveau Candidat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Création du dossier administratif et génération automatique du planning des séances de 1h
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Age Alert */}
          {ageWarning && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-3 font-medium">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{ageWarning}</span>
            </div>
          )}

          {/* Section 1: Identification */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Identité et État Civil
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* NIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIN - N° Identité Nationale (18 chiffres) *
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={nin}
                  onChange={(e) => handleNinChange(e.target.value)}
                  placeholder="ex: 102198901234567890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400">1 = Homme, 2 = Femme (détection auto)</span>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de famille *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ex: Boussaha"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 uppercase"
                  required
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ex: Yassine"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Sexe */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Genre</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Homme' | 'Femme')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Homme">Masculin (Homme)</option>
                  <option value="Femme">Féminin (Femme)</option>
                </select>
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date de Naissance *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500">Âge calculé: {candidateAge} ans</span>
              </div>

              {/* Commune de naissance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commune de Naissance</label>
                <input
                  type="text"
                  value={birthCommune}
                  onChange={(e) => setBirthCommune(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Groupe Sanguin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Groupe Sanguin</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Nom du Père */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Père</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Nom du père"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Nom & Prénom Mère */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom et Prénom de la Mère</label>
                <input
                  type="text"
                  value={motherFullName}
                  onChange={(e) => setMotherFullName(e.target.value)}
                  placeholder="Nom complet de la mère"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0661 00 00 00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Catégorie & Tarification */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Permis Sollicité et Modalités Financières
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie de Permis *</label>
                <select
                  value={requestedCategory}
                  onChange={(e) => setRequestedCategory(e.target.value as LicenseCategory)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="B">Catégorie B - Véhicule Léger / Tourisme</option>
                  <option value="A">Catégorie A - Moto Lourde</option>
                  <option value="A1">Catégorie A1 - Moto Légère (dès 16 ans)</option>
                  <option value="C">Catégorie C - Poids Lourd (Camion)</option>
                  <option value="C1">Catégorie C1 - Camion Moyen</option>
                  <option value="CE">Catégorie CE - Semi-Remorque</option>
                  <option value="D">Catégorie D - Transport Voyageurs / Bus</option>
                  <option value="BE">Catégorie BE - Voiture + Remorque</option>
                  <option value="F">Catégorie F - Véhicule Adapté</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant Forfait Global (DZD)</label>
                <input
                  type="number"
                  value={totalPackagePrice}
                  onChange={(e) => setTotalPackagePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Premier Acompte Encaissé (DZD)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/30 rounded-lg text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  Reste à payer: {(totalPackagePrice - amountPaid).toLocaleString()} DZD
                </span>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Valider l&apos;Inscription & Générer le Planning</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
