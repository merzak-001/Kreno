'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, UserPlus, Award } from 'lucide-react';
import { Student, LicenseCategory, HeldLicense } from '@/types/kreno';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { LICENSE_RULES, checkCirculationEligibility, formatDateFR } from '@/lib/licenseRules';

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

  // Prerequisite held license fields (shown dynamically when category requires another license)
  const [heldNumber, setHeldNumber] = useState('');
  const [heldObtainedDate, setHeldObtainedDate] = useState('');
  const [heldExpiryDate, setHeldExpiryDate] = useState('');
  const [heldAuthority, setHeldAuthority] = useState('Wilaya de Sétif');

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  // Auto-detect gender from 18-digit Algerian NIN
  const handleNinChange = (val: string) => {
    setNin(val);
    if (val.length >= 1) {
      if (val[0] === '1') setGender('Homme');
      if (val[0] === '2') setGender('Femme');
    }
  };

  const rule = LICENSE_RULES[requestedCategory];
  const heldLicensesDraft: HeldLicense[] =
    rule.prerequisite && heldObtainedDate
      ? [
          {
            category: rule.prerequisite,
            license_number: heldNumber.trim(),
            obtained_date: heldObtainedDate,
            expiry_date: heldExpiryDate || undefined,
            issuing_authority: heldAuthority.trim() || undefined,
          },
        ]
      : [];

  const eligibility = checkCirculationEligibility({
    requestedCategory,
    birthDate,
    heldLicenses: heldLicensesDraft,
  });
  const candidateAge = eligibility.age;

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
      deposit_date: new Date().toISOString().split('T')[0],
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
      held_licenses: heldLicensesDraft.length > 0 ? heldLicensesDraft : undefined,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-surface text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-border-subtle">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary border border-primary-subtle-border flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-200">
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
          {/* Regulatory Eligibility Banner (Code & Créneau always allowed; Circulation locked if under age/seniority) */}
          {(!eligibility.circulationEligible || eligibility.isMinor) && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {eligibility.circulationEligible
                    ? 'Candidat mineur — Autorisation du tuteur légal requise'
                    : `Code & Créneau autorisés • Circulation bloquée jusqu'au ${formatDateFR(eligibility.circulationUnlockDate || '') || 'conditions remplies'}`}
                </span>
              </div>
              {eligibility.blockingReasons.map((r, i) => (
                <p key={i} className="text-[11px] pr-6">• {r}</p>
              ))}
            </div>
          )}

          {/* Section 1: Identification */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 pb-1 border-b border-border-subtle flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Identité et État Civil
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* NIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIN - N° Identité Nationale (18 chiffres) *
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={nin}
                  onChange={(e) => handleNinChange(e.target.value)}
                  placeholder="ex: 102198901234567890"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <span className="text-[10px] text-slate-400">1 = Homme, 2 = Femme (détection auto)</span>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nom de famille *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ex: Boussaha"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
                  required
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ex: Yassine"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Sexe */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Genre</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Homme' | 'Femme')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="Homme">Masculin (Homme)</option>
                  <option value="Femme">Féminin (Femme)</option>
                </select>
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date de Naissance *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500">Âge calculé: {candidateAge} ans</span>
              </div>

              {/* Commune de naissance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Commune de Naissance</label>
                <input
                  type="text"
                  value={birthCommune}
                  onChange={(e) => setBirthCommune(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Groupe Sanguin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Groupe Sanguin</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nom du Père</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Nom du père"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Nom & Prénom Mère */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nom et Prénom de la Mère</label>
                <input
                  type="text"
                  value={motherFullName}
                  onChange={(e) => setMotherFullName(e.target.value)}
                  placeholder="Nom complet de la mère"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0661 00 00 00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Catégorie & Tarification */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 pb-1 border-b border-border-subtle flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Permis Sollicité et Modalités Financières
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catégorie de Permis *</label>
                <select
                  value={requestedCategory}
                  onChange={(e) => setRequestedCategory(e.target.value as LicenseCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="B">Catégorie B - Véhicule Léger / Tourisme</option>
                  <option value="A">Catégorie A - Moto Lourde</option>
                  <option value="A1">Catégorie A1 - Moto Légère (dès 16 ans)</option>
                  <option value="BE">Catégorie BE - Voiture + Remorque (B + 2 ans)</option>
                  <option value="C1">Catégorie C1 - Camion Moyen (B + 2 ans)</option>
                  <option value="C1E">Catégorie C1E - C1 + Remorque</option>
                  <option value="C">Catégorie C - Poids Lourd (B + 2 ans)</option>
                  <option value="CE">Catégorie CE - Semi-Remorque (C + 2 ans)</option>
                  <option value="D">Catégorie D - Transport Voyageurs (B + 2 ans)</option>
                  <option value="DE">Catégorie DE - D + Remorque</option>
                  <option value="F">Catégorie F - Véhicule Adapté</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Montant Forfait Global (DZD)</label>
                <input
                  type="number"
                  value={totalPackagePrice}
                  onChange={(e) => setTotalPackagePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-lg text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Premier Acompte Encaissé (DZD)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-primary-subtle border border-primary-subtle-border rounded-lg text-xs font-bold text-primary dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  Reste à payer: {(totalPackagePrice - amountPaid).toLocaleString()} DZD
                </span>
              </div>
            </div>

            {/* Dynamic Prerequisite License Box */}
            {rule.prerequisite && (
              <div className="mt-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>
                      Permis Prérequis Obligatoire : Catégorie {rule.prerequisite} (+ {rule.minSeniorityYears} ans d&apos;ancienneté)
                    </span>
                  </div>
                  {heldObtainedDate && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      eligibility.seniorityMet
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {eligibility.seniorityMet
                        ? `Ancienneté ${rule.minSeniorityYears} ans validée`
                        : `2 ans atteints le ${formatDateFR(eligibility.seniorityUnlockDate || '')}`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      N° du Permis {rule.prerequisite}
                    </label>
                    <input
                      type="text"
                      value={heldNumber}
                      onChange={(e) => setHeldNumber(e.target.value)}
                      placeholder="ex: 19/124578"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-border-subtle rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date d&apos;obtention *
                    </label>
                    <input
                      type="date"
                      value={heldObtainedDate}
                      onChange={(e) => setHeldObtainedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-border-subtle rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date d&apos;expiration
                    </label>
                    <input
                      type="date"
                      value={heldExpiryDate}
                      onChange={(e) => setHeldExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-border-subtle rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Autorité (Wilaya)
                    </label>
                    <input
                      type="text"
                      value={heldAuthority}
                      onChange={(e) => setHeldAuthority(e.target.value)}
                      placeholder="Wilaya de Sétif"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-border-subtle rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
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
