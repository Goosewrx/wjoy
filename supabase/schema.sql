create extension if not exists pgcrypto;

create table if not exists public.league_hub_state (
  id text primary key default 'primary',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_hub_audit_logs (
  id uuid primary key default gen_random_uuid(),
  state_id text not null default 'primary',
  actor text not null default 'system',
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_league_hub_state_updated_at on public.league_hub_state;
create trigger set_league_hub_state_updated_at
before update on public.league_hub_state
for each row
execute function public.set_updated_at();

alter table public.league_hub_state enable row level security;
alter table public.league_hub_audit_logs enable row level security;

drop policy if exists "league hub state read" on public.league_hub_state;
create policy "league hub state read"
on public.league_hub_state
for select
using (true);

drop policy if exists "league hub state write" on public.league_hub_state;
create policy "league hub state write"
on public.league_hub_state
for all
using (true)
with check (true);

drop policy if exists "league hub audit read" on public.league_hub_audit_logs;
create policy "league hub audit read"
on public.league_hub_audit_logs
for select
using (true);

drop policy if exists "league hub audit write" on public.league_hub_audit_logs;
create policy "league hub audit write"
on public.league_hub_audit_logs
for insert
with check (true);
