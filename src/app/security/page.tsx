'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useKreno } from '@/context/KrenoContext';

export default function SecurityPage() {
  const { userRole, authEmail, settings, updateSettings } = useKreno();
  const isOwner = userRole === 'owner';

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwFeedback, setPwFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // PIN form state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isOwner) {
    return (
      <div className="bg-surface p-10 rounded-2xl border border-border-subtle text-center space-y-2 max-w-md mx-auto mt-10">
        <ShieldCheck className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Accès réservé au Gérant
        </h2>
        <p className="text-xs text-slate-500">
          Seul le Gérant de l&apos;auto-école peut consulter ou modifier le mot de passe et le code PIN.
        </p>
      </div>
    );
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwFeedback(null);
    if (newPassword !== confirmPassword) {
      setPwFeedback({ ok: false, text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwFeedback({ ok: false, text: data.error || 'Erreur lors de la mise à jour.' });
      } else {
        setPwFeedback({ ok: true, text: 'Mot de passe modifié avec succès.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPwFeedback({ ok: false, text: 'Impossible de contacter le serveur.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinFeedback(null);
    const activePin = (settings.owner_pin || '1234').trim();
    if (currentPin.trim() !== activePin) {
      setPinFeedback({ ok: false, text: 'Code PIN actuel incorrect.' });
      return;
    }
    if (newPin.trim().length < 4) {
      setPinFeedback({ ok: false, text: 'Le nouveau code PIN doit contenir au moins 4 caractères.' });
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setPinFeedback({ ok: false, text: 'Les deux nouveaux codes PIN ne correspondent pas.' });
      return;
    }
    updateSettings({ owner_pin: newPin.trim() });
    setPinFeedback({ ok: true, text: 'Code PIN Gérant mis à jour avec succès.' });
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              Gérant uniquement
            </span>
            {authEmail && (
              <span className="text-xs text-slate-400 font-mono">{authEmail}</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Sécurité, Mot de passe &amp; Code PIN
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modifiez votre mot de passe de connexion et votre code PIN de bascule Gérant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Change Owner Login Password */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                Changer mon mot de passe
              </h2>
              <p className="text-[11px] text-slate-400">Mot de passe de connexion à l&apos;application</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nouveau mot de passe (min. 6 caractères)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated"
              />
            </div>

            {pwFeedback && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                  pwFeedback.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-800 dark:text-amber-200'
                }`}
              >
                {pwFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{pwFeedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold cursor-pointer transition"
            >
              {pwLoading ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        </div>

        {/* 2. Change Owner PIN */}
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                Changer le Code PIN Gérant
              </h2>
              <p className="text-[11px] text-slate-400">Utilisé pour quitter le mode Secrétaire</p>
            </div>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Code PIN actuel
              </label>
              <input
                type="password"
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nouveau Code PIN (min. 4 caractères)
              </label>
              <input
                type="password"
                required
                minLength={4}
                maxLength={12}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Confirmer le nouveau Code PIN
              </label>
              <input
                type="password"
                required
                minLength={4}
                maxLength={12}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-slate-50 dark:bg-surface-elevated font-mono"
              />
            </div>

            {pinFeedback && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                  pinFeedback.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-800 dark:text-amber-200'
                }`}
              >
                {pinFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{pinFeedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer transition"
            >
              Mettre à jour le Code PIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
