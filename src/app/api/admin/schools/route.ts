import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const ADMIN_COOKIE = 'kreno_admin_session';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local.', schools: [] },
      { status: 503 }
    );
  }

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) {
    return NextResponse.json({ error: error.message, schools: [] }, { status: 500 });
  }

  const ownerUsers = (data.users || []).filter(
    (u) => (u.app_metadata?.role || u.user_metadata?.role) !== 'secretary'
  );

  // Ensure every owner user has a matching row in public.schools & public.profiles
  for (const u of ownerUsers) {
    const rawSchoolId = u.app_metadata?.school_id || u.user_metadata?.school_id;
    const schoolId = typeof rawSchoolId === 'string' && UUID_RE.test(rawSchoolId) ? rawSchoolId : null;
    if (schoolId) {
      await admin.from('schools').upsert(
        {
          id: schoolId,
          name: u.user_metadata?.school_name || 'Auto-École',
          owner_name: u.user_metadata?.owner_name || '',
          email: u.email || '',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      await admin.from('profiles').upsert(
        {
          id: u.id,
          school_id: schoolId,
          role: 'owner',
          full_name: u.user_metadata?.owner_name || '',
          email: u.email || '',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }
  }

  const schools = ownerUsers.map((u) => ({
    id: u.id,
    email: u.email || '',
    school_id: u.app_metadata?.school_id || u.user_metadata?.school_id || 'school-1',
    school_name: u.user_metadata?.school_name || 'Auto-École',
    owner_name: u.user_metadata?.owner_name || '',
    created_at: u.created_at,
  }));

  return NextResponse.json({ schools });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== '1') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { error: 'Clé serveur SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local pour créer des comptes.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const schoolName = typeof body?.schoolName === 'string' ? body.schoolName.trim() : '';
    const ownerName = typeof body?.ownerName === 'string' ? body.ownerName.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!schoolName) {
      return NextResponse.json({ error: "Veuillez saisir le nom de l'auto-école." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Veuillez saisir une adresse email valide.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    const schoolId = crypto.randomUUID();

    // 1. Insert school row in Postgres
    const { error: schoolErr } = await admin.from('schools').insert({
      id: schoolId,
      name: schoolName,
      owner_name: ownerName,
      email,
    });
    if (schoolErr) {
      return NextResponse.json({ error: schoolErr.message }, { status: 500 });
    }

    // 2. Create Auth user
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'owner',
        school_id: schoolId,
        school_name: schoolName,
        owner_name: ownerName,
      },
      app_metadata: {
        role: 'owner',
        school_id: schoolId,
      },
    });

    if (error || !data.user) {
      await admin.from('schools').delete().eq('id', schoolId);
      return NextResponse.json(
        { error: error?.message || 'Impossible de créer le compte.' },
        { status: 400 }
      );
    }

    // 3. Insert profile row in Postgres
    const { error: profileErr } = await admin.from('profiles').insert({
      id: data.user.id,
      school_id: schoolId,
      role: 'owner',
      full_name: ownerName,
      email,
    });
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      school: {
        id: data.user.id,
        email: data.user.email,
        school_id: schoolId,
        school_name: schoolName,
        owner_name: ownerName,
        created_at: data.user.created_at,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur lors de la création.' }, { status: 500 });
  }
}
