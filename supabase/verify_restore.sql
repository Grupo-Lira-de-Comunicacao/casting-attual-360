-- Casting Attual 360
-- Verificacao segura apos restaurar o novo projeto Supabase.
-- Execute no SQL Editor depois de:
-- 001_create_requests.sql
-- 002_create_talents.sql
-- seed_talents.sql
-- 003_create_integrations.sql

-- 1. Conferencia das tabelas principais
select
  to_regclass('public.requests') as requests_table,
  to_regclass('public.admin_users') as admin_users_table,
  to_regclass('public.talents') as talents_table,
  to_regclass('public.talent_telegram_accounts') as telegram_accounts_table,
  to_regclass('public.integration_events') as integration_events_table,
  to_regclass('public.notification_deliveries') as notification_deliveries_table;

-- 2. Quantidade de registros restaurados
select 'requests' as recurso, count(*)::bigint as quantidade from public.requests
union all
select 'admin_users', count(*)::bigint from public.admin_users
union all
select 'talents', count(*)::bigint from public.talents
union all
select 'talent_telegram_accounts', count(*)::bigint from public.talent_telegram_accounts
union all
select 'integration_events', count(*)::bigint from public.integration_events
union all
select 'notification_deliveries', count(*)::bigint from public.notification_deliveries
order by recurso;

-- 3. Qualidade minima dos talentos
select
  count(*) filter (where ativo) as talentos_ativos,
  count(*) filter (where destaque and ativo) as talentos_em_destaque,
  count(*) filter (where foto_url is not null or foto_path is not null) as talentos_com_foto,
  count(*) filter (where email is not null) as talentos_com_email,
  count(*) filter (where telefone is not null) as talentos_com_telefone
from public.talents;

-- 4. Duplicidades que nao devem existir
select slug, count(*)
from public.talents
group by slug
having count(*) > 1;

select telegram_user_id, count(*)
from public.talent_telegram_accounts
group by telegram_user_id
having count(*) > 1;

-- 5. Conferencia do bucket de fotos
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'talent-photos';

-- 6. Conferencia de RLS
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'requests',
    'admin_users',
    'talents',
    'talent_telegram_accounts',
    'integration_events',
    'notification_deliveries'
  )
order by tablename;

-- 7. Politicas cadastradas
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename in (
    'requests',
    'admin_users',
    'talents',
    'talent_telegram_accounts',
    'integration_events',
    'notification_deliveries'
  ))
  or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- 8. Triggers esperados
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'talents',
    'talent_telegram_accounts',
    'integration_events',
    'notification_deliveries'
  )
order by event_object_table, trigger_name;

-- Resultado esperado inicial:
-- requests: 0 ou quantidade existente no seed, caso o seed inclua solicitacoes.
-- admin_users: 0 antes da criacao manual do primeiro administrador.
-- talents: quantidade inserida por seed_talents.sql (historicamente esperados: 16).
-- tabelas de integracao: 0 antes de conectar o bot.
-- bucket talent-photos: exatamente 1 registro e public = false.
-- nenhuma consulta de duplicidade deve retornar linhas.
