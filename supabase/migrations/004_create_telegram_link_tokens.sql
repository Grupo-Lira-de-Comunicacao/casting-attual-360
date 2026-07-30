-- Casting Attual 360
-- Codigos temporarios para vincular talentos a contas do Telegram.
-- Execute depois de 003_create_integrations.sql.

create table if not exists public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  token_hash text not null unique,
  solicitado_por uuid references auth.users(id) on delete set null,
  expira_em timestamptz not null,
  usado_em timestamptz,
  cancelado_em timestamptz,
  telegram_user_id bigint,
  telegram_chat_id bigint,
  criado_em timestamptz not null default now(),

  constraint telegram_link_token_hash_length
    check (char_length(token_hash) between 32 and 128),
  constraint telegram_link_token_expiration
    check (expira_em > criado_em),
  constraint telegram_link_token_usage_state
    check (
      usado_em is null
      or (
        telegram_user_id is not null
        and telegram_chat_id is not null
      )
    ),
  constraint telegram_link_token_terminal_state
    check (not (usado_em is not null and cancelado_em is not null))
);

create index if not exists telegram_link_tokens_active_idx
  on public.telegram_link_tokens (talent_id, expira_em)
  where usado_em is null and cancelado_em is null;

create index if not exists telegram_link_tokens_telegram_user_idx
  on public.telegram_link_tokens (telegram_user_id)
  where telegram_user_id is not null;

alter table public.telegram_link_tokens enable row level security;

revoke all on table public.telegram_link_tokens from anon;
revoke all on table public.telegram_link_tokens from authenticated;
grant select, insert, update on table public.telegram_link_tokens to authenticated;

drop policy if exists "Administrador gerencia codigos Telegram" on public.telegram_link_tokens;
create policy "Administrador gerencia codigos Telegram"
on public.telegram_link_tokens
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

comment on table public.telegram_link_tokens is
  'Codigos temporarios armazenados somente como hash para vincular talentos a contas do Telegram.';

comment on column public.telegram_link_tokens.token_hash is
  'Hash SHA-256 do codigo; o codigo em texto puro nunca deve ser persistido.';
