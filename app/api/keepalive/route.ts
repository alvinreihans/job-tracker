import { createClient } from "@supabase/supabase-js";

// Dipanggil Vercel Cron sehari sekali (vercel.json) biar project Supabase gratis nggak di-pause karena 7 hari idle.
// Cuma panggil rpc('ping') = `select 1` pakai publishable key, nggak nyentuh data apa pun.
export async function GET(request: Request) {
  // Vercel otomatis kirim "Authorization: Bearer <CRON_SECRET>" kalau env itu di-set.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.rpc("ping");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
