import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Bikin client baru tiap request, jangan disimpan di variabel global.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Dipanggil dari Server Component: aman diabaikan, proxy.ts yang refresh sesi.
          }
        },
      },
    },
  );
}
