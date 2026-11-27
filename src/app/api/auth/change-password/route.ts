import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const role = user.app_metadata?.role || user.user_metadata?.role;
    if (role === 'secretary') {
      return NextResponse.json(
        { error: 'Action réservée au Gérant.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Saisissez votre mot de passe actuel et un nouveau mot de passe (min. 6 caractères).' },
        { status: 400 }
      );
    }

    // Verify current password first
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyErr) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect.' },
        { status: 401 }
      );
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message || 'Impossible de modifier le mot de passe.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur lors du changement de mot de passe.' },
      { status: 500 }
    );
  }
}
