import React from 'react';
import Link from 'next/link';
import { KrenoLogo } from '@/components/KrenoLogo';
import {
  CalendarDays,
  Users,
  Award,
  DollarSign,
  ShieldCheck,
  FileText,
  ArrowRight,
  CheckCircle2,
  LogIn,
  Clock,
} from 'lucide-react';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Planning Intelligent 30h',
    color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    desc: 'Répartition automatique des 10h Code, 10h Créneau et 10h Route sans conflit d’horaire, plus une vue Aujourd’hui simple pour pointer les présences.',
  },
  {
    icon: Users,
    title: 'Dossiers Candidats Complets',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    desc: 'Suivi du NIN, catégorie de permis (A1, B, C, D...), disponibilités hebdomadaires et historique complet de chaque élève.',
  },
  {
    icon: FileText,
    title: 'Documents A4 Prêts à Imprimer',
    color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    desc: 'Génération instantanée des contrats, fiches d’inscription, reçus et cartes de progression bilingues (Français / Arabe).',
  },
  {
    icon: Award,
    title: 'Sessions d’Examen',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    desc: 'Préparation des listes Code, Créneau et Circulation, suivi des résultats, inspecteurs d’État et frais d’examen.',
  },
  {
    icon: DollarSign,
    title: 'Finances & Parc Véhicules',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    desc: 'Encaissements, tranches, heures supplémentaires automatiques et alertes d’expiration d’assurance ou de contrôle technique.',
  },
  {
    icon: ShieldCheck,
    title: 'Accès Sécurisé Gérant & Secrétaire',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    desc: 'Droits séparés entre le secrétariat et le gérant, avec fermeture automatique de la session dès la fermeture du navigateur.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <KrenoLogo className="w-9 h-9 rounded-xl shadow-lg shadow-blue-600/30" />
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-none">
                Kreno
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Gestion Auto-École
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">
              Fonctionnalités
            </a>
            <a href="#planning" className="hover:text-white transition">
              Planning &amp; Suivi
            </a>
            <a href="#security" className="hover:text-white transition">
              Sécurité
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/25"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Se connecter</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-transparent to-emerald-500/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Conçu pour les auto-écoles algériennes (Programme 30h)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Pilotez votre auto-école{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                sans paperasse ni conflits.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Kreno centralise les dossiers candidats, le planning automatique des 30 heures (Code, Créneau, Route), les examens, les paiements et le parc automobile dans une interface simple pour le gérant et le secrétariat.
            </p>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-xl shadow-blue-600/30"
              >
                <span>Se connecter à mon espace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-semibold transition"
              >
                <span>Voir les fonctionnalités</span>
              </a>
            </div>

            <div className="flex items-center gap-5 flex-wrap pt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Code · Créneau · Route
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Impression A4 FR / AR
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Rôles Gérant &amp; Secrétaire
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl shadow-blue-950/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-kreno.jpg"
                alt="Kreno - Gestion moderne d'auto-école"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
            Tout-en-un
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Tout ce dont votre auto-école a besoin au quotidien
          </h2>
          <p className="text-sm text-slate-400">
            Une interface claire, pensée pour éviter les erreurs de saisie et gagner du temps chaque matin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-white/20 transition space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${feat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Visual Feature Showcase */}
      <section id="planning" className="border-t border-white/10 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="rounded-3xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/feature-planning.jpg"
                alt="Planification et suivi des séances de conduite"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Simple &amp; Visuel
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Repérez Code, Créneau et Route en un coup d&apos;œil
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Chaque discipline possède sa propre couleur et chaque carte affiche clairement la catégorie de permis. Le secrétariat pointe les présences du jour en un clic, tandis que le gérant garde le contrôle sur les finances, les moniteurs et les paramètres.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span><strong>Code théorique</strong> — Suivi collectif par salle et par moniteur</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                <span><strong>Créneau sur piste</strong> — Respect automatique des capacités par véhicule</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>Circulation routière</strong> — Rattrapages automatiques en cas d&apos;absence</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Security & Final CTA */}
      <section id="security" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600/20 via-slate-900 to-emerald-600/20 border border-white/15 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl font-bold text-white">
              Prêt à ouvrir votre session ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Accédez à votre tableau de bord sécurisé. Pour protéger vos données, votre session se ferme automatiquement dès que vous fermez le navigateur.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-sm font-bold transition shrink-0 shadow-lg"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-6 text-center text-xs text-slate-500">
        Kreno Auto-École — Gestion des candidats, planning 30h &amp; examens.
      </footer>
    </div>
  );
}
