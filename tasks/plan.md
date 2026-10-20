# Implementation Plan: Job Tracker

Sumber kebenaran: [SPEC.md](../SPEC.md). Checklist task ada di [todo.md](todo.md).

## Overview

Next.js (App Router) + Cloudscape + Supabase, deploy ke Vercel. Dibangun per irisan vertikal: tiap task menghasilkan sesuatu yang bisa diklik dan dicek. Task paling berisiko (Cloudscape × App Router) dikerjakan paling awal.

## Dependency Graph

```
T1 Scaffold + spike Cloudscape ──► T2 GitHub repo
        │
        ▼
T3 Supabase project + env (👤) ──► T4 Auth: signup/login/logout ──► T5 Lupa/reset password
                                          │
                                          ▼
                                   T6 Schema + tabel lamaran (read)
                                          │
                     ┌────────────┬───────┴──────┬──────────────┐
                     ▼            ▼              ▼              ▼
              T7 Tambah/edit/  T8 Inline     T9 Filter +     T11 Import Excel
                 hapus          status          ringkasan
                                                 │
                                                 ▼
                                          T10 Export CSV
                                                 │
                                                 ▼
                                   T12 Deploy Vercel + verifikasi akhir
                                                 │
                                                 ▼
                                   T13 Keep-alive Vercel Cron
```

T7–T9 dan T11 nggak saling bergantung. Bisa dikerjakan urut biasa, tapi kalau ada yang ke-block, bisa loncat.

## Architecture Decisions

- **Server component ambil data, client component Cloudscape render.** Satu-satunya pola yang aman buat Cloudscape di App Router. Mutasi lewat server actions + `revalidatePath('/')`.
- **Filter/sort/pagination/export di client** (`useCollection`). Data per user kecil, jadi semua di-load sekali.
- **Auth = Supabase Auth bawaan + form Cloudscape.** Sesi di cookie lewat `@supabase/ssr`. `proxy.ts` refresh sesi dan redirect ke `/login`.
- **Keamanan di DB, bukan di app:** RLS `user_id = auth.uid()` + grant eksplisit ke `authenticated` aja. Validasi di server action cuma buat pesan error yang enak, bukan pengaman utama.
- **Scaffold di folder sementara lalu dipindah.** `create-next-app` nolak folder yang udah berisi `SPEC.md`/`tasks/`.

## Langkah Manual (👤 kamu)

Ada yang butuh login dashboard, jadi nggak bisa saya kerjakan:

| Kapan | Langkah |
|---|---|
| T3 | Bikin project Supabase (region Singapore), kirim **Project URL** + **Publishable key** (aman dibagi, bukan service role) |
| T3 | Jalankan `supabase/schema.sql` di SQL Editor |
| T4 | Daftar akun pertama (akun kamu) + klik link konfirmasi |
| T11 | Jalankan `supabase/seed.sql` di SQL Editor |
| T12 | Import repo di Vercel, isi env, set function region `sin1`; isi Site URL & Redirect URLs di Supabase |
| T12 | Bikin akun kedua buat tes isolasi RLS |
| T13 | Tambah env `CRON_SECRET` di Vercel, lalu redeploy |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Cloudscape error di App Router (CSS dari node_modules, SSR) | High | T1 = spike. `dev` + `build` harus lulus pakai Table/Modal/Select asli. Gagal → stop, diskusi (fallback: Vite SPA). |
| Data pribadi bocor ke repo public | High | `.gitignore` untuk `seed.sql`, `*.xlsx`, `.env*` dipasang di T1 sebelum commit pertama. Cek `git status` sebelum tiap push. |
| SMTP bawaan Supabase kena limit pas testing | Med | Testing signup/reset hemat-hemat. Kalau mentok, sementara konfirmasi user lewat dashboard. |
| Link email mental (redirect URL salah) | Med | Redirect URLs lokal di-set di T3, yang production di T12. Callback route dites di T4 & T5. |
| Lupa grant → tabel kosong tanpa error jelas | Med | Grant ada di `schema.sql`. T6 verifikasi baca/tulis langsung setelah schema jalan. |
| Project Supabase gratis di-pause (7 hari idle) | Med | T13: Vercel Cron harian → `rpc('ping')`. Cadangan: restore manual dari dashboard. |

## Open Questions

Nggak ada.
