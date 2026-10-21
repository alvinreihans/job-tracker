import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/constants";
import Tracker from "@/components/Tracker";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: claims }, { data, error }] = await Promise.all([
    supabase.auth.getClaims(),
    // RLS yang membatasi ke baris milik user ini.
    supabase
      .from("applications")
      .select("id, company, position, applied_at, job_url, location, source, status, notes, responsibilities, requirements")
      .order("applied_at", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw error;

  return <Tracker email={claims?.claims.email ?? ""} rows={data as Application[]} />;
}
