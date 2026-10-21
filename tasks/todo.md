# Todo: Job Tracker

Lihat [plan.md](plan.md) buat konteks. 👤 = butuh aksi kamu di dashboard.

## Phase 1: Fondasi

- [x] **T1: Scaffold Next.js + spike Cloudscape**. Build/lint/test + SSR dev lulus. Tinggal kamu cek tampilan di browser (Checkpoint A).
  - Acceptance:
    - `create-next-app` (TS, ESLint, App Router, tanpa Tailwind, tanpa `src/`) + package Cloudscape + Vitest terpasang
    - `app/layout.tsx` import global-styles + `I18nProvider` locale `id`. `app/page.tsx` render AppLayout + Table (data dummy) + tombol buka Modal berisi Select & DatePicker
    - `.gitignore` mencakup `.env*`, `supabase/seed.sql`, `*.xlsx`
  - Verify: `npm run dev` → halaman tampil tanpa error di console browser. `npm run build`, `npm run lint`, `npm test` (1 test dummy) lulus.
  - Files: `package.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `vitest.config.ts`, `.gitignore`
  - Size: M

- [x] **T2: Repo GitHub `job-tracker` (public) + push pertama**
  - Acceptance: commit pertama berisi scaffold + SPEC + tasks. Repo dibuat via `gh`, `main` ter-push.
  - Verify: `git status` bersih, `git ls-files` nggak memuat `.env*`/`.xlsx`/`seed.sql`. Repo kelihatan di GitHub.
  - Files: — (git saja)
  - Depends: T1
  - Size: XS

### Checkpoint A: spike lulus
- [x] Cloudscape jalan di dev + build → **GO** (hydration mismatch diperbaiki dengan render client-only, lihat SPEC)

## Phase 2: Auth

- [x] **T3: Supabase project + koneksi** 👤
  - Acceptance: `supabase/schema.sql` ditulis (tabel + RLS + grant, sesuai SPEC). Kamu bikin project dan jalankan schema. `.env.local` terisi. `lib/supabase/{client,server}.ts` siap. Redirect URL `http://localhost:3000/**` terdaftar.
  - Verify: request REST `applications` pakai publishable key tanpa sesi → ditolak (401 permission denied, karena anon nggak di-grant). `rpc/ping` tanpa sesi → `1`.
  - Files: `supabase/schema.sql`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `.env.local` (nggak di-commit)
  - Depends: T1
  - Size: S

- [x] **T4: Signup / login / logout + proteksi halaman**
  - Acceptance: `/login` (Cloudscape Form) bisa daftar & login. Link konfirmasi → `/auth/callback` → `/`. Tombol logout di header. Belum login → semua halaman kecuali auth di-redirect ke `/login`. Error login generik.
  - Verify: manual. Daftar → email → klik → masuk. Logout → buka `/` → ke `/login`. `npm run build` lulus.
  - Files: `app/(auth)/login/page.tsx`, `app/auth/callback/route.ts`, `proxy.ts`, `app/page.tsx`
  - Depends: T3
  - Size: M

- [x] **T5: Lupa password + reset password**
  - Acceptance: `/forgot-password` kirim email reset (flow implicit). Link → `/reset-password#access_token…` → set password baru → masuk `/`. Jalan walaupun link dibuka di browser/HP lain.
  - Verify: manual sesuai Success Criteria 2b (password lama ditolak, yang baru diterima). Plus: link dibuka di browser lain → form muncul; link dipakai ulang atau `/reset-password` dibuka langsung → "Link reset nggak berlaku".
  - Files: `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`
  - Depends: T4
  - Size: S

### Checkpoint B: auth end-to-end
- [x] Signup, konfirmasi, login, logout, reset jalan di lokal. Build/lint/test lulus. Review.

## Phase 3: Fitur inti

- [x] **T6: Tabel lamaran + split panel detail (read)**
  - Acceptance: `lib/constants.ts` (STATUSES, SOURCES, tipe `Application`). `app/page.tsx` ambil lamaran user → `components/Tracker.tsx` (AppLayout + Table + sort default `applied_at` desc + pagination 20 + empty state). Status tampil pakai `StatusIndicator`. Pilih baris → `SplitPanel` berisi `ApplicationDetail` (info + Responsibilities/Requirements jadi poin lewat `toPoints`).
  - Verify: test Vitest `toPoints` + `formatDate` (baris kosong, bullet `•`/`-`/`*`/`1.`, spasi). Manual: insert 1 baris lewat SQL Editor (pakai `user_id` kamu) → muncul di tabel, klik → detail tampil rapi. Akun lain (nanti di T12) nggak lihat baris itu.
  - Files: `lib/constants.ts`, `lib/format.ts`, `tests/format.test.ts`, `app/page.tsx`, `components/Tracker.tsx`, `components/ApplicationDetail.tsx`
  - Depends: T4
  - Size: S

- [x] **T7: Tambah / edit / hapus lamaran**
  - Acceptance: `app/actions.ts` (`createApplication`, `updateApplication`, `deleteApplication`) dengan validasi field wajib + enum. `components/ApplicationModal.tsx` (Form: semua field, Textarea buat responsibilities/requirements, DatePicker). Hapus pakai Modal konfirmasi. Error ditampilkan di Form/Flashbar.
  - Verify: test Vitest buat fungsi validasi (wajib kosong, status/source asing → ditolak). Manual: tambah → edit → hapus, dan cek setelah reload.
  - Files: `app/actions.ts`, `components/ApplicationModal.tsx`, `components/Tracker.tsx`, `tests/validate.test.ts`
  - Depends: T6
  - Size: M

- [x] ~~**T8: Ganti status cepat**~~ **Dibatalkan.** Inline edit di tabel ikut buka detail, dan tombol di split panel bikin judul kegencet. Status diganti lewat Modal Edit (T7).

- [x] **T9: Filter status/platform + search + ringkasan status**
  - Acceptance: TextFilter (perusahaan/posisi, case-insensitive) + 2 Select (status, platform), bisa dikombinasi, plus counter jumlah hasil. Ringkasan per status (Container + KeyValuePairs) dari semua data user.
  - Verify: test Vitest buat fungsi `matches()`. Manual: kombinasi filter, dan jumlah di ringkasan = jumlah baris saat difilter status itu.
  - Files: `lib/filter.ts`, `components/Tracker.tsx`, `tests/filter.test.ts`
  - Depends: T6
  - Size: S

### Checkpoint C: CRUD lengkap
- [x] Success Criteria 4–6 & 10 lulus di lokal. Build/lint/test lulus. Review.

## Phase 4: Data & deploy

- [ ] **T10: Export CSV**
  - Acceptance: `lib/csv.ts` `toCsv(rows)` (BOM UTF-8, escape `,` `"` newline). Tombol "Export CSV" download hasil filter yang sedang tampil (semua halaman, bukan cuma halaman aktif).
  - Verify: test Vitest (koma, kutip, newline, en dash). Manual: buka file di Excel → karakter benar dan jumlah baris = counter filter.
  - Files: `lib/csv.ts`, `tests/csv.test.ts`, `components/Tracker.tsx`
  - Depends: T9
  - Size: S

- [ ] **T11: Import data Excel** 👤
  - Acceptance: `scripts/import_xlsx.py <xlsx> <user-uuid>` → `supabase/seed.sql`. Sheet Detail digabung per lamaran (baris kosong = lanjutan lamaran sebelumnya), string di-escape aman buat SQL. Kamu jalankan seed di SQL Editor.
  - Verify: 13 baris muncul di app dengan field + responsibilities/requirements sesuai Excel. `seed.sql` nggak ada di `git status`.
  - Files: `scripts/import_xlsx.py`
  - Depends: T6
  - Size: S

- [ ] **T12: Deploy Vercel + verifikasi akhir** 👤
  - Acceptance: app live di domain Vercel (region `sin1`). Site URL & Redirect URLs Supabase menunjuk ke domain itu.
  - Verify: semua Success Criteria 1–10 dicek di URL production, termasuk tes RLS 2 akun (baca/edit/hapus id milik akun lain → gagal) dan layout di lebar 375px.
  - Files: `README.md` (cara setup singkat)
  - Depends: T2, T5, T8, T10, T11
  - Size: S

- [ ] **T13: Keep-alive Vercel Cron** 👤
  - Acceptance: `app/api/keepalive/route.ts` (401 tanpa `Bearer $CRON_SECRET`, 200 + `rpc('ping')` kalau valid). `vercel.json` cron harian. `proxy.ts` mengecualikan `/api/keepalive`. Kamu set `CRON_SECRET` di env Vercel.
  - Verify: `curl` production tanpa header → 401, dengan header → 200. Vercel → Cron Jobs → "Run" manual → log sukses.
  - Files: `app/api/keepalive/route.ts`, `vercel.json`, `proxy.ts`
  - Depends: T12
  - Size: XS

### Checkpoint D: selesai
- [ ] Semua Success Criteria (1–11) di SPEC terpenuhi di production. Review akhir.
