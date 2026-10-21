"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isStatus, validateApplication, type FieldErrors } from "@/lib/validate";

// Error dikembalikan sebagai nilai, bukan di-throw: di production Next menyensor pesan error dari server action.
export type ActionResult = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

const NOT_FOUND = "Lamaran nggak ditemukan. Mungkin udah dihapus.";

async function client() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

// RLS yang memastikan user cuma bisa sentuh barisnya sendiri. Baris milik orang lain = 0 baris = NOT_FOUND.
export async function saveApplication(input: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const supabase = await client();
  if (!supabase) return { ok: false, error: "Sesi habis. Login lagi ya." };

  const v = validateApplication(input);
  if (v.errors) return { ok: false, error: "Cek lagi isian yang ditandai.", fieldErrors: v.errors };

  const query = id
    ? supabase.from("applications").update({ ...v.data, updated_at: new Date().toISOString() }).eq("id", id)
    : supabase.from("applications").insert(v.data);
  const { data, error } = await query.select("id").maybeSingle();

  if (error) return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  if (!data) return { ok: false, error: NOT_FOUND };
  refresh();
  return { ok: true, id: data.id };
}

export async function updateStatus(id: string, status: unknown): Promise<ActionResult> {
  const supabase = await client();
  if (!supabase) return { ok: false, error: "Sesi habis. Login lagi ya." };
  if (!isStatus(status)) return { ok: false, error: "Status nggak valid." };

  const { data, error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "Gagal ganti status. Coba lagi." };
  if (!data) return { ok: false, error: NOT_FOUND };
  refresh();
  return { ok: true, id };
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  const supabase = await client();
  if (!supabase) return { ok: false, error: "Sesi habis. Login lagi ya." };

  const { data, error } = await supabase.from("applications").delete().eq("id", id).select("id").maybeSingle();

  if (error) return { ok: false, error: "Gagal menghapus. Coba lagi." };
  if (!data) return { ok: false, error: NOT_FOUND };
  refresh();
  return { ok: true, id };
}
