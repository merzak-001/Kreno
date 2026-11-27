import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const callerRole = user.app_metadata?.role || user.user_metadata?.role;
    if (callerRole === 'secretary') {
      return NextResponse.json({ error: 'Action réservée au Gérant.' }, { status: 403 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Clé serveur SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Veuillez saisir un email valide.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const rawSchoolId = user.app_metadata?.school_id || user.user_metadata?.school_id;
    const ownerSchoolId =
      typeof rawSchoolId === 'string' && UUID_RE.test(rawSchoolId)
        ? rawSchoolId
        : crypto.randomUUID();
    const ownerSchoolName = user.user_metadata?.school_name || 'Auto-École Kreno';

    // Ensure school row exists in Postgres
    await admin.from('schools').upsert(
      { id: ownerSchoolId, name: ownerSchoolName, email: user.email || '' },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'secretary',
        school_id: ownerSchoolId,
        school_name: ownerSchoolName,
        full_name: fullName,
      },
      app_metadata: {
        role: 'secretary',
        school_id: ownerSchoolId,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Impossible de créer le compte secrétaire.' },
        { status: 400 }
      );
    }

    await admin.from('profiles').insert({
      id: data.user.id,
      school_id: ownerSchoolId,
      role: 'secretary',
      full_name: fullName,
      email,
    });

    return NextResponse.json({
      secretary: {
        id: data.user.id,
        email: data.user.email,
        school_id: ownerSchoolId,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du compte secrétaire.' },
      { status: 500 }
    );
  }
}
