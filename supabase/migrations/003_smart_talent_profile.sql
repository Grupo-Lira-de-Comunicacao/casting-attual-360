-- Casting Attual 360 — Release v0.6 Smart Talent Profile
-- Mantém categoria como principal e subcategorias como categorias adicionais.

alter table public.talents
  add column if not exists especialidades text[] not null default '{}',
  add column if not exists idiomas text[] not null default '{}',
  add column if not exists disponibilidades text[] not null default '{}';

-- Preserva o conteúdo anterior: as antigas subcategorias continuam como
-- categorias adicionais. Não há perda nem transformação destrutiva de dados.

create index if not exists talents_subcategorias_gin_idx
  on public.talents using gin (subcategorias);

create index if not exists talents_especialidades_gin_idx
  on public.talents using gin (especialidades);

create index if not exists talents_habilidades_gin_idx
  on public.talents using gin (habilidades);

create index if not exists talents_idiomas_gin_idx
  on public.talents using gin (idiomas);

create index if not exists talents_disponibilidades_gin_idx
  on public.talents using gin (disponibilidades);

comment on column public.talents.categoria is
  'Categoria profissional principal do talento.';
comment on column public.talents.subcategorias is
  'Categorias profissionais adicionais do talento.';
comment on column public.talents.especialidades is
  'Áreas temáticas ou formatos em que o talento se especializa.';
comment on column public.talents.habilidades is
  'Competências técnicas e comportamentais do talento.';
comment on column public.talents.idiomas is
  'Idiomas informados no perfil do talento.';
comment on column public.talents.disponibilidades is
  'Tipos de trabalho para os quais o talento está disponível.';
