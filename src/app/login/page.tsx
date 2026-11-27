'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KrenoLogo } from '@/components/KrenoLogo';
import {
  Lock,
  Mail,
  LogIn,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Identifiants invalides.');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100">
      {/* Left Brand & Visual Panel */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-10 overflow-hidden border-r border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/60">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <KrenoLogo className="w-10 h-10 rounded-xl shadow-lg shadow-blue-600/30" />
            <div>
              <span className="font-bold text-lg text-white block leading-none">Kreno</span>
              <span className="text-[11px] text-slate-400">Auto-École Management</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        <div className="my-auto py-8 space-y-6 max-w-xl">
          <div className="rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-kreno.jpg"
              alt="Kreno Auto-École"
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">
              Votre auto-école organisée, en toute sécurité.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connectez-vous avec votre compte Gérant ou Secrétariat pour accéder aux dossiers, au planning 30h et aux examens.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fermeture auto à la sortie du navigateur</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Accès séparés Gérant / Secrétaire</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Kreno Auto-École • Connexion chiffrée Supabase Auth
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <KrenoLogo className="w-9 h-9 rounded-xl" />
              <span className="font-bold text-base text-white">Kreno</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </Link>
          </div>

          <div className="bg-slate-900/90 rounded-3xl border border-white/10 shadow-2xl p-7 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Session Sécurisée</span>
              </div>
              <h1 className="text-2xl font-bold text-white pt-1">
                Connexion
              </h1>
              <p className="text-xs text-slate-400">
                Entrez vos identifiants (Gérant ou Secrétaire) fournis par votre auto-école.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gerant@autoecole.dz"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-white/10 bg-slate-950/80 text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-slate-950/80 text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-blue-600/25"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 text-center">
              La session se ferme automatiquement lorsque vous fermez la fenêtre du navigateur.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
