import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Session-only cookie: cleared when the browser window closes
            const sessionOptions = {
              ...options,
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
            };
            delete sessionOptions.maxAge;
            delete sessionOptions.expires;
            supabaseResponse.cookies.set(name, value, sessionOptions);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;
  const isAdminSession = request.cookies.get('kreno_admin_session')?.value === '1';
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/admin');

  if (pathname.startsWith('/admin') && !isAdminSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && isAdminSession) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = '/admin';
    return NextResponse.redirect(adminUrl);
  }

  if (!user && !isPublicRoute && !pathname.startsWith('/admin')) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === '/login') {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  // Server-side role guard: block secretary from owner-only routes
  const metaRole = user?.app_metadata?.role || user?.user_metadata?.role;
  const isOwnerOnlyRoute =
    pathname.startsWith('/finances') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/security');
  if (user && metaRole === 'secretary' && isOwnerOnlyRoute) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
