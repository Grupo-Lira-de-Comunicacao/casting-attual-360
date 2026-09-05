# Casting Attual 360

**Talentos, conexões e visibilidade.**

Plataforma do Grupo Lira de Comunicação para gestão de talentos, produções, convocações, matching, shortlist, convites Telegram e integração operacional com o ATTUAL ONE.

## Estado atual

O projeto já ultrapassou a Fase 1 demonstrativa. A `main` atual contém:

- catálogo público de talentos com backend Supabase;
- autenticação e painel administrativo;
- cadastro e edição de talentos;
- Produções;
- Convocações e requisitos estruturados;
- Matching e Shortlist;
- vínculo e convites via Telegram;
- fila de eventos de integração;
- auditoria e métricas operacionais;
- contratos de integração com o ATTUAL ONE;
- acionamento seguro do dispatcher por assinatura Ed25519 a partir da VPS.

O fallback demonstrativo continua no código apenas como mecanismo de contingência quando o backend público não está acessível. Em produção normal, o catálogo deve consumir os registros ativos do Supabase.

## Tecnologias

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage e RLS)
- Vercel
- Telegram Bot API

## Executar localmente

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

## Validação

```bash
npm run lint
npm run typecheck
npm run build
```

Ou:

```bash
npm run check
```

## Supabase

A aplicação usa o projeto Supabase de produção e espera, no mínimo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

As migrations ficam em `supabase/migrations/` e incluem talentos, integrações, Produções, Convocações, Shortlist, Telegram, auditoria e métricas.

## Rotas principais

- `/` — Home institucional
- `/talentos` — catálogo público
- `/talentos/[slug]` — perfil de talento
- `/talentos/cadastrar` — entrada de cadastro
- `/pacotes` — soluções
- `/empresas` — área para marcas e agências
- `/admin` — painel administrativo
- `/admin/producoes` — Produções
- `/admin/integracoes/eventos` — eventos de integração
- `/admin/integracoes/metricas` — métricas operacionais
- `/api/telegram/webhook` — webhook Telegram
- `/api/integrations/dispatch` — dispatcher de integrações autenticado pelo segredo legado
- `/api/integrations/dispatch-signed` — acionamento do dispatcher autenticado por assinatura Ed25519 da VPS

## Dispatcher automático

O acionamento periódico de produção é feito pela VPS do Grupo Lira. A chave privada Ed25519 permanece somente na VPS e a aplicação recebe apenas a chave pública. Cada chamada inclui timestamp e assinatura, com janela curta anti-replay, e então reutiliza o dispatcher interno existente para entregar os eventos ao ATTUAL ONE.

## Deploy

O projeto canônico está em:

`Grupo-Lira-de-Comunicacao/casting-attual-360`

A branch de produção é `main` e o projeto está conectado à Vercel.
