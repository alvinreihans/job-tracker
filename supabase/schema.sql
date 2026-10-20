-- Jalankan sekali di Supabase → SQL Editor. Sumber: SPEC.md § Data Model.

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
  responsibilities text,
  requirements     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index on applications (user_id);

alter table applications enable row level security;
create policy "owner only" on applications
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- "Automatically expose new tables" = OFF, jadi grant eksplisit. anon sengaja nggak dikasih apa-apa.
grant select, insert, update, delete on applications to authenticated;

-- Target ping harian Vercel Cron biar project gratis nggak di-pause.
create function public.ping() returns int language sql stable as 'select 1';
grant execute on function public.ping() to anon;
