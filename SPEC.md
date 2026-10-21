# Spec: Job Tracker

## Objective

Pengganti `Job Tracker.xlsx`: web app pribadi buat mencatat lamaran kerja, update status, dan lihat progresnya. Bisa dibuka dari laptop maupun HP.

**Pengguna:** siapa aja bisa daftar sendiri. Tiap user cuma bisa lihat dan ubah lamarannya sendiri.

**User stories**
1. Daftar (sign-up) pakai email + password, konfirmasi lewat email, login, dan logout. Tanpa login, nggak ada halaman/data yang bisa diakses.
1b. Lupa password: masukkan email → dapat link reset → set password baru → langsung login.
2. Lihat semua lamaran di tabel, urut dari tanggal lamar terbaru.
2b. Klik satu baris → **split panel** detail (Cloudscape `SplitPanel`, di sebelah kanan) di halaman yang sama: info lengkap + Responsibilities & Requirements sebagai daftar poin + tombol Edit.
3. Tambah lamaran baru: perusahaan, posisi, tanggal lamar, link lowongan, lokasi, platform, status, catatan, responsibilities, requirements. Responsibilities/Requirements diisi lewat `Textarea` dengan copy-paste dari lowongan, satu poin per baris.
4. Edit lamaran (termasuk ganti status) lewat tombol **Edit** di split panel detail.
5. Hapus lamaran (pakai konfirmasi).
6. Filter by status dan platform, plus search nama perusahaan/posisi.
7. Lihat ringkasan jumlah lamaran per status.
8. Export semua data (atau hasil filter) ke CSV yang bisa langsung dibuka di Excel.
9. 13 lamaran yang ada di Excel di-import sekali di awal, masuk ke akun pemilik.

## Tech Stack

- **Next.js 16.4** (App Router, TypeScript, Turbopack), di-deploy ke **Vercel**. Baca `node_modules/next/dist/docs/` sebelum pakai API Next, karena banyak yang berubah dari versi lama (lihat `AGENTS.md`).
  - `cacheComponents` **dimatikan**. Semua halaman berisi data per-user, jadi model caching lama (render dinamis tiap request) lebih simpel daripada bungkus semua baca sesi pakai `<Suspense>`.
  - Middleware sekarang namanya `proxy.ts` (export `proxy`).
- **Supabase**: Postgres + Auth, akses lewat `@supabase/supabase-js` + `@supabase/ssr`
- **Cloudscape Design System** (AWS) sebagai satu-satunya UI layer:
  - `@cloudscape-design/components`: AppLayout, Table, Form, Modal, Select, DatePicker, TextFilter, StatusIndicator, dll.
  - `@cloudscape-design/global-styles`: di-import sekali di root layout
  - `@cloudscape-design/collection-hooks`: `useCollection` buat filter, sort, dan pagination tabel
  - `I18nProvider` + messages locale `id`, jadi teks bawaan komponen (pagination, empty state, dll.) berbahasa Indonesia
- **Vitest** buat unit test logic murni
- Nggak pakai Tailwind/CSS framework lain (bisa bentrok sama style Cloudscape) dan nggak pakai state library.

**Integrasi Cloudscape + Next.js**
- Semua komponen Cloudscape cuma dipakai di file `'use client'`. Server component cuma ambil data, lalu oper ke client component.
- `I18nProvider` dipasang di `components/Providers.tsx` (`'use client'`), lalu dibungkus di root layout.
- **UI Cloudscape cuma di-render di client.** `Providers` baru render children setelah mount (`useSyncExternalStore`). Alasannya, Cloudscape ngukur DOM waktu render (`browserScrollbarSize`, `useVisualRefresh`), jadi HTML dari SSR selalu beda sama client dan bikin hydration mismatch. Data tetap diambil di server component dan mutasi tetap lewat server action. Konsekuensinya, first paint kosong sebentar sampai JS jalan. Nggak masalah buat app di balik login yang nggak butuh SEO.
- `transpilePackages` **nggak dibutuhkan**. Spike T1 udah buktiin Next 16.4 + Turbopack bisa build, dev, dan SSR Cloudscape tanpa config tambahan.
- Warning `useLayoutEffect` waktu SSR emang dikenal tim Cloudscape dan aman diabaikan.

## Data Model

```sql
create table applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  company          text not null,
  position         text not null,
  applied_at       date not null default current_date,
  job_url          text,
  location         text,
  source           text not null check (source in
                     ('Jobstreet','Kalibrr','LinkedIn','Astra Career','Glints',
                      'Website Perusahaan','Referral','Lainnya')),
  status           text not null default 'Applied' check (status in
                     ('Applied','Seen','Psikotes','Interview HR','Interview User',
                      'Offering','Diterima','Ditolak')),
  notes            text,
  responsibilities text,   -- 1 poin per baris
  requirements     text,   -- 1 poin per baris
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table applications enable row level security;
create policy "owner only" on applications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Project dibuat dengan "Automatically expose new tables" = OFF,
-- jadi akses Data API harus di-grant eksplisit. Role anon sengaja nggak dikasih apa-apa.
grant select, insert, update, delete on applications to authenticated;

-- Keep-alive: target ping harian dari Vercel Cron (lihat Infra & Config).
create function public.ping() returns int language sql stable as 'select 1';
grant execute on function public.ping() to anon;
```

- Sheet **Detail** dari Excel digabung jadi kolom `responsibilities` / `requirements`, jadi nggak ada tabel kedua.
- Daftar status/platform disimpan sekali di `lib/constants.ts` (buat UI) dan di-mirror di check constraint (buat DB).
- RLS per `user_id` yang misahin data antar user. Ini juga yang bikin anon key aman walaupun ke-expose di browser.
- Akun dikelola Supabase Auth (`auth.users`). Nggak ada tabel profile di v1.

## Auth

Backend-nya pakai Supabase Auth bawaan, jadi nggak bikin sistem auth sendiri. UI-nya dibikin sendiri pakai form Cloudscape (Auth UI resmi Supabase udah nggak dimaintain dan nggak nyambung sama Cloudscape).

| Flow | Panggilan Supabase |
|---|---|
| Daftar | `auth.signUp({ email, password, options: { emailRedirectTo: <origin>/auth/callback?next=/ } })` |
| Konfirmasi email | link di email → `/auth/callback?code` → `exchangeCodeForSession` → `/` |
| Login | `auth.signInWithPassword` |
| Logout | `auth.signOut` |
| Lupa password | client `supabase-js` terpisah dengan `flowType: "implicit", persistSession: false` → `resetPasswordForEmail(email, { redirectTo: <origin>/reset-password })` |
| Set password baru | `/reset-password#access_token&refresh_token` → `setSession` → hapus hash → `auth.updateUser({ password })` |

- Template email tetap bawaan, karena template baru bisa diedit kalau pakai custom SMTP. Polanya sama kayak `money-tracker` (commit `677e7f0`).
- **Signup = PKCE (`code`).** Link konfirmasi cuma bisa ditukar jadi sesi di browser yang dipakai buat daftar. Kalau dibuka di browser lain, `/login?error=link` minta user login aja, karena konfirmasi email-nya tetap tercatat di Supabase.
- **Reset password = implicit.** Link PKCE butuh cookie code verifier dari browser yang minta reset, jadi bakal gagal kalau dibuka di app email atau HP. Flow implicit bawa token di hash URL (nggak terkirim ke server), lalu `/reset-password` pasang sesinya sendiri.
  - `/reset-password` harus **publik** di `proxy.ts`. Kalau nggak, request tanpa cookie di-redirect ke `/login` dan hash-nya ikut kebawa.
  - Tombol simpan nonaktif selama sesi belum terpasang, karena `updateUser` bakal gagal "Auth session missing".
  - Tanpa token dan tanpa sesi (link kedaluwarsa atau halaman dibuka langsung) → tampil "Link reset nggak berlaku" + tombol minta link baru.
- **Upgrade path (kalau udah pasang custom SMTP):** edit template ke `token_hash` + `verifyOtp` di `/auth/callback`. Signup juga jadi aman lintas browser, dan client implicit nggak perlu lagi.
- `?next=` divalidasi `safeNext()` (cuma path relatif) biar nggak bisa dipakai buat open redirect.
- Konfirmasi email: **nyala** (default Supabase).
- Email dikirim SMTP bawaan Supabase. Limitnya kecil (beberapa email per jam), dan **cuma ngirim ke alamat anggota tim project Supabase**. Orang lain yang daftar nggak bakal dapat email konfirmasi atau reset. Lihat Open Questions.
- Pesan error login sengaja generik ("Email atau password salah") biar nggak bocorin email mana yang terdaftar. Halaman lupa password juga selalu bilang "kalau email itu terdaftar, link udah dikirim".

## Infra & Config

- **Supabase:** project baru `job-tracker`, region **Southeast Asia (Singapore)**. Data API ON, auto-expose tables OFF, Postgres default.
- **Vercel:** import repo GitHub. Function region di-set `sin1` (Singapore) biar dekat sama DB.
- **Env vars** (`.env.local` dan Vercel):
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  CRON_SECRET=<string acak panjang>     # cuma di Vercel
  ```
- **Keep-alive:** project Supabase gratis di-pause setelah 7 hari tanpa aktivitas. `vercel.json` jadwalin Vercel Cron sehari sekali ke `GET /api/keepalive`. Route itu nolak request tanpa header `Authorization: Bearer $CRON_SECRET`, lalu manggil `rpc('ping')`. Route ini dikecualikan dari redirect login di `proxy.ts`. Kalau suatu saat tetap ke-pause, restore manual dari dashboard (data aman).
- **Supabase → Auth → URL Configuration:** Site URL = domain Vercel. Redirect URLs = `http://localhost:3000/**` dan `https://<domain-vercel>/**`. Tanpa ini, link konfirmasi dan reset password bakal mental.

## Commands

```
Dev:    npm run dev
Build:  npm run build
Lint:   npm run lint
Test:   npm test            # vitest run
Import: python scripts/import_xlsx.py "D:\Document\apply-for-a-job\Job Tracker.xlsx" <owner-user-uuid> > supabase/seed.sql
```

## Project Structure

```
app/
  layout.tsx              → import global-styles + I18nProvider (locale id)
  (auth)/layout.tsx       → wrapper tengah buat halaman auth
  (auth)/login/page.tsx   → form login + sign-up + link "lupa password"
  (auth)/forgot-password/ → input email → kirim link reset
  (auth)/reset-password/  → input password baru
  auth/callback/route.ts  → exchangeCodeForSession buat konfirmasi email & reset, lalu redirect ke ?next
  page.tsx                → server component: ambil semua lamaran milik user → <Tracker>
  actions.ts              → server actions: create / update / delete
  api/keepalive/route.ts  → target Vercel Cron, cek CRON_SECRET → rpc('ping')
components/
  Tracker.tsx             → 'use client': AppLayout + ringkasan status + Table + filter + tombol export + SplitPanel
  ApplicationDetail.tsx   → 'use client': isi split panel (info + daftar poin)
  ApplicationModal.tsx    → 'use client': Modal + Form tambah/edit
  Providers.tsx           → 'use client': I18nProvider locale id
vercel.json               → jadwal cron harian keepalive
lib/
  constants.ts            → STATUSES, SOURCES
  supabase/client.ts      → client browser
  supabase/server.ts      → client server (cookies)
  redirect.ts             → safeNext() (ada test-nya)
  auth-errors.ts          → terjemahan error Supabase Auth
  csv.ts                  → toCsv() (logic murni, ada test-nya)
  filter.ts               → matches() (search + status + platform) + countByStatus() (ada test-nya)
  validate.ts             → validateApplication() + isStatus() (ada test-nya)
  format.ts               → todayIso() + toPoints() (teks → daftar poin, buang baris kosong & bullet •, -, *, 1.) + formatDate() ("9 Okt 2026") (ada test-nya)
proxy.ts                  → redirect ke /login kalau belum login
supabase/
  schema.sql              → tabel + RLS (di atas)
  seed.sql                → hasil import (di-generate, nggak diedit manual)
scripts/import_xlsx.py    → Excel → seed.sql
tests/                    → test vitest
SPEC.md
```

## Code Style

Server component ambil data, client component Cloudscape yang render, mutasi lewat server action:

```tsx
// components/Tracker.tsx
'use client'
export default function Tracker({ rows }: { rows: Application[] }) {
  const { items, collectionProps, filterProps, paginationProps } = useCollection(rows, {
    filtering: { filteringFunction: (r, text) => matches(r, { text, status, source }) },
    sorting: { defaultState: { sortingColumn: { sortingField: 'applied_at' }, isDescending: true } },
    pagination: { pageSize: 20 },
  })
  return (
    <Table {...collectionProps} items={items} columnDefinitions={COLUMNS}
      onRowClick={({ detail }) => setSelectedId(detail.item.id)}
      filter={<TextFilter {...filterProps} filteringPlaceholder="Cari perusahaan / posisi" />}
      pagination={<Pagination {...paginationProps} />} />
  )
}
```

```tsx
// app/actions.ts
'use server'
export async function deleteApplication(id: string): Promise<ActionResult> {
  const supabase = await client()                    // null kalau sesi habis
  if (!supabase) return { ok: false, error: 'Sesi habis. Login lagi ya.' }
  const { data, error } = await supabase.from('applications')
    .delete().eq('id', id).select('id').maybeSingle()
  if (error) return { ok: false, error: 'Gagal menghapus. Coba lagi.' }
  if (!data) return { ok: false, error: NOT_FOUND }  // RLS: baris orang lain = 0 baris
  refresh()                                          // next/cache (Next 16)
  return { ok: true, id }
}
```

- Server action **return** `{ ok, error, fieldErrors }`, bukan throw, karena di production Next menyensor pesan error dari server action. Validasi input di `lib/validate.ts` (batas kepercayaan) + check constraint di DB.
- Nama tabel/kolom DB: `snake_case` bahasa Inggris. Label UI: bahasa Indonesia.
- **Struktur halaman utama (pola Cloudscape):** `AppLayout` → `ContentLayout` dengan `Header` h1 "Lamaran" + aksi **Tambah lamaran**. Di bawahnya Container **Ringkasan status** (angka per status, klik = filter tabel ke status itu), lalu Table **Daftar lamaran** (`variant="container"`, `stickyColumns={{ first: 1 }}` biar nama perusahaan tetap kelihatan waktu scroll samping di HP).
- **Responsif:** jumlah kolom ditentukan Cloudscape (`KeyValuePairs`/`ColumnLayout` pakai `minColumnWidth`, filter pakai `Grid` dengan breakpoint). Nggak ada media query sendiri.
- **Split panel:** posisi default samping (`onSplitPanelPreferencesChange` dipasang, user bisa pindah ke bawah lewat ikon ⚙). Di HP otomatis di bawah. Tombol Edit/Hapus ada di **isi** panel, bukan `headerActions`, karena `headerActions` nggak bisa wrap dan bikin judul kegencet di panel samping.
- **Cek layout** di 375 (HP), 768/1024 (tablet), dan 1366 (desktop) pakai emulasi perangkat (DevTools Device Mode). Iframe atau jendela headless kecil nggak akurat.
- Semua lamaran milik user di-load sekali. Filter, search, sort, dan pagination jalan di client lewat `useCollection`. Datanya kecil (ratusan baris per user), jadi nggak perlu query per filter.
- Export CSV dibikin di browser dari hasil filter yang lagi tampil (Blob + download), jadi nggak perlu API route.
- Semua perubahan, termasuk status, lewat Modal **Edit**. Header split panel cuma berisi Edit + Hapus, biar judul nggak kegencet di panel samping yang sempit. Nggak pakai inline edit di tabel, karena klik sel ikut memicu `onRowClick` dan buka detail.
- Detail per lamaran di `SplitPanel` (posisi **samping kanan**, otomatis pindah ke bawah di layar sempit; terbuka saat baris dipilih). Teks responsibilities/requirements disimpan apa adanya, dan baru dirapikan jadi poin waktu ditampilkan (`toPoints`), jadi data asli nggak pernah diubah.
- Warna status pakai `StatusIndicator`: Applied/Seen = info, Psikotes/Interview = in-progress, Offering/Diterima = success, Ditolak = error.
- Pakai komponen dan design token Cloudscape. Nggak ada CSS custom kecuali kepepet.
- Form ikut pola Cloudscape (Single page create): **cuma field opsional yang ditandai**, pakai label + *- opsional* miring, tanpa asterisk. Tombol primary **nggak di-disable** walaupun field wajib belum diisi. Validasi jalan waktu submit, dan error tampil di field-nya.
- Render kondisional pakai `cond ? <X /> : null`, jangan `str && <X />`. String kosong `""` ikut jadi child dan bikin warning `key` di `SpaceBetween` Cloudscape.
- Nggak ada abstraksi buat jaga-jaga. Satu halaman utama, satu file actions.

## Testing Strategy

- **Unit (Vitest):** `lib/csv.ts` (escape koma/kutip/newline, BOM UTF-8 buat Excel) dan validasi input di server action.
- **DB:** RLS dicek manual pakai 2 akun. Tanpa login → 0 baris. User B nggak bisa baca, edit, atau hapus baris milik user A (termasuk lewat request langsung pakai id-nya).
- **Manual smoke test** sebelum deploy: jalani user stories 1–8 di `npm run dev`, lalu sekali lagi di URL Vercel.
- Nggak ada E2E framework di v1.

## Boundaries

- **Always:** validasi status/source di server action, `npm run build && npm test` lulus sebelum commit, secret cuma di `.env.local` / env Vercel.
- **Ask first:** ubah schema DB, tambah dependency di luar Tech Stack, apa pun yang nyentuh project Supabase/Vercel (bikin project, set env, deploy).
- **Never:** commit `.env*`, `supabase/seed.sql`, file `.xlsx`, atau service role key (repo-nya public), pakai service role key di kode app, matikan RLS.

## Success Criteria

1. Buka URL Vercel tanpa login → di-redirect ke `/login`. Query `applications` pakai publishable key tanpa sesi → ditolak (401).
2. User baru bisa daftar, konfirmasi email, login, dan mulai dengan tabel kosong. User B nggak pernah lihat data user A.
2b. Lupa password → email masuk → set password baru → bisa login pakai password baru, dan password lama ditolak.
3. Setelah pemilik login, 13 lamaran dari Excel muncul dengan field yang sama (termasuk responsibilities/requirements).
4. Tambah, edit (termasuk ganti status), dan hapus lamaran langsung kelihatan efeknya setelah reload.
5. Filter status + platform + search bisa dikombinasi, dan jumlah hasil filter ditampilkan.
6. Jumlah di ringkasan status = jumlah baris di tabel buat status itu.
7. CSV hasil export kebuka di Excel dengan karakter yang benar (en dash, dll.) dan isinya sama kayak tabel yang sedang difilter, cuma data milik user yang login.
8. Layout kepakai di lebar 375px (HP) tanpa scroll horizontal di level halaman (tabel boleh scroll sendiri).
9. `npm run build`, `npm run lint`, `npm test` semuanya lulus.
10. Semua UI pakai komponen Cloudscape dan teks bawaan komponennya berbahasa Indonesia.
11. `GET /api/keepalive` tanpa secret → 401. Dengan secret → 200. Cron job kelihatan di Vercel → Settings → Cron Jobs dan log eksekusinya sukses.

## Open Questions

1. **Signup buat orang lain butuh custom SMTP.** SMTP bawaan cuma ngirim ke anggota tim project, jadi user lain nggak bisa konfirmasi email atau reset password. Opsinya: (a) pasang Resend/Brevo (gratis) sebelum app dibagikan ke orang lain, sekaligus pindah ke `token_hash`; (b) matikan konfirmasi email, tapi reset password tetap nggak jalan buat mereka. Keputusan paling telat di T12, sebelum app dibagikan.

**Resolved**
- Repo GitHub: `job-tracker`, **public**. Karena itu `supabase/seed.sql` dan file `.xlsx` (isinya data lamaran pribadi) masuk `.gitignore`.
- Supabase: project baru (setting di Infra & Config). Vercel: akun udah ada, deploy lewat import repo GitHub.
- Git: udah `git init -b main`.
- Karakter `–` di Excel ternyata valid (U+2013), cuma salah tampil di terminal. Import nulis UTF-8 apa adanya.
- Konfirmasi email: nyala. Reset password: masuk v1.
