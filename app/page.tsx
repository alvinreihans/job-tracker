import { createClient } from "@/lib/supabase/server";
import Tracker from "@/components/Tracker";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <Tracker email={data?.claims.email ?? ""} />;
}
