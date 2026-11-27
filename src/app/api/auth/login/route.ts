import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request, email: string): string {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || 'local';
  return `${ip}:${email.toLowerCase()}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Veuillez saisir un email valide et un mot de passe.' },
        { status: 400 }
      );
    }

    const key = getClientKey(request, email);
    const now = Date.now();
    if (failedAttempts.size > 500) {
      for (const [k, v] of failedAttempts.entries()) {
        if (v.resetAt <= now) failedAttempts.delete(k);
      }
    }
    const record = failedAttempts.get(key);
    if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Trop de tentatives échouées. Réessayez dans 15 minutes.' },
        { status: 429 }
      );
    }

    // Super-Admin login check (redirects to /admin)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kreno.dz').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (email.toLowerCase() === adminEmail) {
      if (password !== adminPassword) {
        const current = record && record.resetAt > now ? record : { count: 0, resetAt: now + WINDOW_MS };
        current.count += 1;
        failedAttempts.set(key, current);
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect.' },
          { status: 401 }
        );
      }

      failedAttempts.delete(key);
      const res = NextResponse.json({
        redirectTo: '/admin',
        user: { email: adminEmail, role: 'admin' },
      });
      res.cookies.set('kreno_admin_session', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return res;
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      const current = record && record.resetAt > now ? record : { count: 0, resetAt: now + WINDOW_MS };
      current.count += 1;
      failedAttempts.set(key, current);
      return NextResponse.json(
        {
          error:
            error?.message === 'Email not confirmed'
              ? 'Email non confirmé. Demandez à l’administrateur de réinitialiser le compte.'
              : 'Email ou mot de passe incorrect.',
        },
        { status: 401 }
      );
    }

    failedAttempts.delete(key);

    const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role;
    const role = metaRole === 'secretary' ? 'secretary' : 'owner';

    return NextResponse.json({
      redirectTo: '/dashboard',
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la connexion.' },
      { status: 500 }
    );
  }
}
