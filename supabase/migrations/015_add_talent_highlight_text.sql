-- Add an explicit editable highlight text for talent profiles.
-- Keeps the existing boolean "destaque" flag used to select featured profiles.

alter table public.talents
  add column if not exists destaque_texto text;

update public.talents
set destaque_texto = coalesce(
  nullif(trim(destaque_texto), ''),
  nullif(trim(habilidades[1]), ''),
  nullif(trim(especialidades[1]), ''),
  nullif(trim(subcategorias[1]), ''),
  nullif(trim(categoria), '')
)
where destaque_texto is null or trim(destaque_texto) = '';

alter table public.talents
  drop constraint if exists talents_destaque_texto_length;

alter table public.talents
  add constraint talents_destaque_texto_length
  check (destaque_texto is null or char_length(destaque_texto) <= 160);
