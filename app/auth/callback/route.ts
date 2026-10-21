import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/redirect";

// Tujuan link di email konfirmasi & reset password (template bawaan Supabase).
// `code` ditukar jadi sesi pakai code verifier di cookie, jadi link harus dibuka di browser yang sama.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(safeNext(params.get("next")));
  }

  redirect("/login?error=link");
}
