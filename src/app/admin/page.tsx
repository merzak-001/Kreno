'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KrenoLogo } from '@/components/KrenoLogo';
import {
  ShieldCheck,
  Lock,
  Building2,
  User,
  Mail,
  Plus,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Users,
  KeyRound,
  Ban,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface SchoolAccount {
  id: string;
  email: string;
  school_id: string;
  school_name: string;
  owner_name: string;
  created_at: string;
}

interface ManagedUser {
  id: string;
  email: string;
  role: 'owner' | 'secretary';
  full_name: string;
  school_id: string;
  school_name: string;
  is_banned: boolean;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'schools' | 'users'>('schools');

  const [schools, setSchools] = useState<SchoolAccount[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [userNotice, setUserNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Create School form
  const [schoolName, setSchoolName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const loadSchools = async () => {
    setListError(null);
    try {
      const res = await fetch('/api/admin/schools');
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error || 'Impossible de charger les auto-écoles.');
      } else {
        setSchools(data.schools || []);
      }
    } catch {
      setListError('Erreur réseau.');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          loadSchools();
          loadUsers();
        }
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleAdminLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setSchools([]);
    setUsers([]);
    router.push('/login');
    router.refresh();
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFeedback(null);
    setCreating(true);
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, ownerName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateFeedback({ ok: false, text: data.error || 'Erreur lors de la création.' });
      } else {
        setCreateFeedback({
          ok: true,
          text: `Auto-école "${data.school.school_name}" créée (${data.school.email}).`,
        });
        setSchoolName('');
        setOwnerName('');
        setEmail('');
        setPassword('');
        setSchools((prev) => [data.school, ...prev]);
        loadUsers();
      }
    } catch {
      setCreateFeedback({ ok: false, text: 'Erreur serveur.' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleBan = async (u: ManagedUser) => {
    setUserNotice(null);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, ban: !u.is_banned }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUserNotice({ ok: false, text: data.error || 'Erreur.' });
    } else {
      setUserNotice({ ok: true, text: data.message });
      setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, is_banned: !u.is_banned } : item)));
    }
  };

  const handleDeleteUser = async (u: ManagedUser) => {
    setUserNotice(null);
    const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(u.id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      setUserNotice({ ok: false, text: data.error || 'Erreur lors de la suppression.' });
    } else {
      setUserNotice({ ok: true, text: `Utilisateur ${u.email} supprimé.` });
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      loadSchools();
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setUserNotice(null);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetTarget.id, newPassword: resetPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUserNotice({ ok: false, text: data.error || 'Erreur.' });
    } else {
      setUserNotice({ ok: true, text: `Mot de passe mis à jour pour ${resetTarget.email}.` });
      setResetTarget(null);
      setResetPassword('');
    }
  };

  if (checkingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <KrenoLogo className="w-10 h-10 rounded-xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">Console Super-Admin Kreno</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gérez les auto-écoles et tous les comptes utilisateurs (Gérants &amp; Secrétaires).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('schools')}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 transition ${
                  activeTab === 'schools' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Auto-Écoles ({schools.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 transition ${
                  activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Utilisateurs ({users.length})</span>
              </button>
            </div>

            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition"
            >
              Page Login
            </Link>
            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quitter Admin</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SCHOOLS */}
        {activeTab === 'schools' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Créer une nouvelle Auto-École</span>
              </h2>

              <form onSubmit={handleCreateSchool} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nom de l&apos;auto-école *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Auto-École El-Nadjah"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nom du Gérant</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ahmed Benali"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email de connexion *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="gerant@autoecole.dz"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mot de passe (min. 6 caractères) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white font-medium"
                    />
                  </div>
                </div>

                {createFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] font-semibold flex items-start gap-2 ${
                      createFeedback.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {createFeedback.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{createFeedback.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold cursor-pointer transition"
                >
                  {creating ? 'Création en cours...' : 'Créer le compte Auto-École'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">
                  Auto-Écoles enregistrées ({schools.length})
                </h2>
                <button
                  onClick={loadSchools}
                  className="text-xs text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Actualiser</span>
                </button>
              </div>

              {listError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  {listError}
                </div>
              )}

              <div className="space-y-2.5">
                {schools.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{sc.school_name}</div>
                      <div className="text-slate-400 mt-0.5">
                        {sc.owner_name ? `${sc.owner_name} • ` : ''}
                        <span className="font-mono text-slate-300">{sc.email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                        Actif
                      </span>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        {sc.school_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
                {schools.length === 0 && !listError && (
                  <p className="text-xs text-slate-500 py-8 text-center italic">
                    Aucune auto-école créée pour le moment.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Gestion de tous les utilisateurs</h2>
                <p className="text-xs text-slate-400">
                  Réinitialisez un mot de passe, suspendez ou supprimez un compte Gérant ou Secrétaire.
                </p>
              </div>
              <button
                onClick={loadUsers}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser</span>
              </button>
            </div>

            {userNotice && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  userNotice.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {userNotice.text}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/10 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Auto-École</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{u.full_name || '—'}</div>
                        <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{u.school_name}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {u.school_id ? `${u.school_id.slice(0, 8)}...` : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            u.role === 'owner'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          }`}
                        >
                          {u.role === 'owner' ? 'Gérant' : 'Secrétaire'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            u.is_banned
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {u.is_banned ? 'Suspendu' : 'Actif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setResetTarget(u);
                              setResetPassword('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold cursor-pointer inline-flex items-center gap-1"
                            title="Changer le mot de passe"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Mot de passe</span>
                          </button>
                          <button
                            onClick={() => handleToggleBan(u)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 font-semibold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" />
                            <span>{u.is_banned ? 'Réactiver' : 'Suspendre'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 cursor-pointer"
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPasswordSubmit}
            className="bg-slate-900 rounded-2xl w-full max-w-sm border border-white/15 p-5 space-y-4 text-xs"
          >
            <div>
              <h3 className="text-sm font-bold text-white">Réinitialiser le mot de passe</h3>
              <p className="text-slate-400 font-mono mt-0.5">{resetTarget.email}</p>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nouveau mot de passe (min. 6 caractères)
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoFocus
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-950 text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
