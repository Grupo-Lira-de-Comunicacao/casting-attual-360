-- Missão 03 — Matching e Shortlist
-- Mantém decisão humana antes de qualquer convite Telegram.

create table if not exists public.casting_shortlist (
  id uuid primary key default gen_random_uuid(),
  casting_call_id uuid not null references public.casting_calls(id) on delete cascade,
  talent_id uuid not null references public.talents(id) on delete cascade,
  match_score numeric(5,2) not null default 0 check (match_score >= 0 and match_score <= 100),
  eligibility_status text not null default 'eligible' check (eligibility_status in ('eligible','ineligible','review')),
  selection_status text not null default 'suggested' check (selection_status in ('suggested','shortlisted','invited','accepted','declined','removed')),
  matched_requirements jsonb not null default '[]'::jsonb,
  failed_requirements jsonb not null default '[]'::jsonb,
  score_explanation jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  invited_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (casting_call_id, talent_id)
);

create index if not exists casting_shortlist_call_score_idx
  on public.casting_shortlist (casting_call_id, eligibility_status, match_score desc);

create index if not exists casting_shortlist_talent_idx
  on public.casting_shortlist (talent_id, selection_status);

alter table public.casting_shortlist enable row level security;

create policy "Admins can read casting shortlist"
  on public.casting_shortlist for select
  using (public.is_admin());

create policy "Admins can insert casting shortlist"
  on public.casting_shortlist for insert
  with check (public.is_admin());

create policy "Admins can update casting shortlist"
  on public.casting_shortlist for update
  using (public.is_admin())
  with check (public.is_admin());

-- Sem DELETE administrativo: remoção lógica via selection_status='removed'.

drop trigger if exists set_casting_shortlist_updated_at on public.casting_shortlist;
create trigger set_casting_shortlist_updated_at
before update on public.casting_shortlist
for each row execute function public.set_updated_at();

alter table public.integration_events
  add column if not exists shortlist_id uuid references public.casting_shortlist(id) on delete set null;

create index if not exists integration_events_shortlist_id_idx
  on public.integration_events (shortlist_id)
  where shortlist_id is not null;

comment on table public.casting_shortlist is
  'Candidatos avaliados por convocação. Matching sugere; seleção e convite exigem decisão humana.';
comment on column public.casting_shortlist.match_score is
  'Score explicável de 0 a 100 calculado somente a partir de requisitos estruturados.';
comment on column public.casting_shortlist.selection_status is
  'Telegram só poderá ser acionado após transição humana para shortlisted/invited.';
