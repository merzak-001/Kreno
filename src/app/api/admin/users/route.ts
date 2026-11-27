import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const ADMIN_COOKIE = 'kreno_admin_session';

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== '1') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquante.', users: [] }, { status: 503 });
  }

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 500 });
  if (error) {
    return NextResponse.json({ error: error.message, users: [] }, { status: 500 });
  }

  const users = (data.users || []).map((u) => {
    const role = (u.app_metadata?.role || u.user_metadata?.role) === 'secretary' ? 'secretary' : 'owner';
    const bannedUntil = (u as unknown as { banned_until?: string | null }).banned_until;
    const isBanned = Boolean(bannedUntil && new Date(bannedUntil) > new Date());
    return {
      id: u.id,
      email: u.email || '',
      role,
      full_name: u.user_metadata?.full_name || u.user_metadata?.owner_name || '',
      school_id: u.app_metadata?.school_id || u.user_metadata?.school_id || '',
      school_name: u.user_metadata?.school_name || 'Auto-École',
      is_banned: isBanned,
      created_at: u.created_at,
    };
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== '1') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquante.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    const ban = typeof body?.ban === 'boolean' ? body.ban : undefined;

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant.' }, { status: 400 });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
          { status: 400 }
        );
      }
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: newPassword,
        email_confirm: true,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true, message: 'Mot de passe mis à jour.' });
    }

    if (ban !== undefined) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: ban ? '876000h' : 'none',
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        message: ban ? 'Compte suspendu.' : 'Compte réactivé.',
      });
    }

    return NextResponse.json({ error: 'Aucune action spécifiée.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== '1') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquante.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant.' }, { status: 400 });
    }

    await admin.from('profiles').delete().eq('id', userId);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
