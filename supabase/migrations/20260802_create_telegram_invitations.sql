-- Missão 04 — Convites Telegram
-- Convites individuais, auditáveis e vinculados a talentos sem depender de @username.

create table if not exists public.talent_telegram_links (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null unique references public.talents(id) on delete cascade,
  telegram_user_id bigint not null unique,
  telegram_chat_id bigint not null,
  telegram_username text,
  linked_at timestamptz not null default now(),
  verified_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.casting_invitations (
  id uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references public.casting_shortlist(id) on delete cascade,
  casting_call_id uuid not null references public.casting_calls(id) on delete cascade,
  talent_id uuid not null references public.talents(id) on delete cascade,
  channel text not null default 'telegram' check (channel in ('telegram')),
  status text not null default 'pending_link' check (status in ('pending_link','ready','sent','accepted','declined','expired','cancelled','failed')),
  token_hash text not null unique,
  token_expires_at timestamptz not null,
  telegram_link_id uuid references public.talent_telegram_links(id) on delete set null,
  telegram_message_id bigint,
  prepared_at timestamptz not null default now(),
  sent_at timestamptz,
  responded_at timestamptz,
  response_source text check (response_source in ('telegram','admin','system')),
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shortlist_id)
);

create index if not exists talent_telegram_links_active_idx
  on public.talent_telegram_links (talent_id)
  where revoked_at is null;

create index if not exists casting_invitations_status_idx
  on public.casting_invitations (casting_call_id, status, created_at desc);

create index if not exists casting_invitations_talent_idx
  on public.casting_invitations (talent_id, status);

alter table public.talent_telegram_links enable row level security;
alter table public.casting_invitations enable row level security;

create policy "Admins can read talent telegram links"
  on public.talent_telegram_links for select
  using (public.is_admin());

create policy "Admins can manage talent telegram links"
  on public.talent_telegram_links for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can read casting invitations"
  on public.casting_invitations for select
  using (public.is_admin());

create policy "Admins can insert casting invitations"
  on public.casting_invitations for insert
  with check (public.is_admin());

create policy "Admins can update casting invitations"
  on public.casting_invitations for update
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_talent_telegram_links_updated_at on public.talent_telegram_links;
create trigger set_talent_telegram_links_updated_at
before update on public.talent_telegram_links
for each row execute function public.set_updated_at();

drop trigger if exists set_casting_invitations_updated_at on public.casting_invitations;
create trigger set_casting_invitations_updated_at
before update on public.casting_invitations
for each row execute function public.set_updated_at();

alter table public.integration_events
  add column if not exists invitation_id uuid references public.casting_invitations(id) on delete set null;

create index if not exists integration_events_invitation_id_idx
  on public.integration_events (invitation_id)
  where invitation_id is not null;

comment on table public.talent_telegram_links is
  'Vínculo verificado entre talento e identidade numérica do Telegram; username é apenas informativo.';
comment on table public.casting_invitations is
  'Convite individual preparado após decisão humana de shortlist. Token bruto nunca deve ser persistido; apenas token_hash.';
comment on column public.casting_invitations.token_hash is
  'SHA-256 ou equivalente do token de uso único recebido via deep link do bot.';
