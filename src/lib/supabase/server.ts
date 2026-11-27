import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Strip maxAge and expires so the cookie is a pure browser-session cookie
              // (automatically cleared when the browser window is closed).
              const sessionOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
              };
              delete sessionOptions.maxAge;
              delete sessionOptions.expires;
              cookieStore.set(name, value, sessionOptions);
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
