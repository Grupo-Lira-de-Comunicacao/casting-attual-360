# Casting Attual 360

**Talentos, conexões e visibilidade.**

Base da Fase 1 da plataforma institucional que conecta marcas, agências e talentos. A aplicação apresenta a identidade da Casting Attual 360, catálogo e perfis demonstrativos, pacotes, entradas de contato/cadastro e uma visão administrativa inicial.

> Escolha quem vai dar voz, imagem e alcance para sua marca.

## Estado da Fase 1

- Home institucional responsiva com proposta de valor, jornada, casting em destaque e chamadas por público;
- catálogo e páginas estáticas de detalhes de talentos;
- páginas de pacotes, empresas, cadastro de talentos e painel administrativo;
- dados fictícios centralizados e identificados em `src/data/demo-data.ts`;
- configuração de ambiente preparada para futura integração com Supabase;
- TypeScript estrito, ESLint e build de produção configurados.

Os nomes, métricas, preços e demais informações exibidos atualmente são exclusivamente demonstrativos e não representam a operação real.

## Tecnologias

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Estrutura preparada para Supabase

## Executar localmente

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Validação

```bash
npm run lint
npm run typecheck
npm run build
```

Ou execute tudo em sequência:

```bash
npm run check
```

## Supabase

A integração ainda não está ativa. Para a próxima fase, crie um arquivo `.env.local` (não versionado) com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

A configuração provisória está em `src/lib/supabase.ts` e deve ser substituída por um cliente oficial quando o projeto Supabase e o modelo de dados forem definidos.

## Rotas

- `/` — Home institucional
- `/talentos` — catálogo demonstrativo
- `/talentos/[slug]` — perfil demonstrativo
- `/talentos/cadastrar` — entrada de cadastro
- `/pacotes` — ofertas demonstrativas
- `/empresas` — contato para marcas e agências
- `/admin` — painel demonstrativo
