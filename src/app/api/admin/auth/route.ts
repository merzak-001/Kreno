import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'kreno_admin_session';

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === '1';
  return NextResponse.json({ authenticated: isAdmin });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password : '';
    const expected = process.env.ADMIN_PASSWORD || 'admin123';

    if (password !== expected) {
      return NextResponse.json(
        { error: 'Mot de passe administrateur incorrect.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    // Session-only cookie (no maxAge/expires -> cleared when browser closes)
    res.cookies.set(ADMIN_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
