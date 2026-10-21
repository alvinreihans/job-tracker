# Job Tracker

Catatan lamaran kerja pribadi: tabel lamaran, detail responsibilities/requirements, filter, ringkasan status, dan export CSV.
Next.js 16 + Cloudscape Design System + Supabase, di-deploy ke Vercel. Spesifikasi lengkap ada di [SPEC.md](SPEC.md).

## Jalan di lokal

1. `npm install`
2. Bikin `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   CRON_SECRET=<string acak>   # opsional, buat tes /api/keepalive
   ```
3. Jalankan [supabase/schema.sql](supabase/schema.sql) sekali di Supabase → SQL Editor.
4. Supabase → Authentication → URL Configuration: tambahkan `http://localhost:3000/**` ke Redirect URLs.
5. `npm run dev` → http://localhost:3000

Cek kualitas: `npm run lint`, `npm test`, `npm run build`.

## Deploy (Vercel)

1. Import repo ini di Vercel (framework: Next.js). Region function sudah di-set `sin1` lewat [vercel.json](vercel.json).
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `CRON_SECRET` (string acak panjang).
3. Supabase → Authentication → URL Configuration: Site URL = domain Vercel, lalu tambahkan `https://<domain>/**` ke Redirect URLs.
4. Vercel Cron memanggil `/api/keepalive` sehari sekali biar project Supabase gratis nggak di-pause.

## Import dari Excel (sekali)

```
pip install openpyxl
python scripts/import_xlsx.py "path/ke/Job Tracker.xlsx" email@akun.com > supabase/seed.sql
```
Lalu jalankan `supabase/seed.sql` di SQL Editor. File ini berisi data pribadi dan di-ignore git.
