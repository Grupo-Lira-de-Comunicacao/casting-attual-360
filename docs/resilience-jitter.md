# Retry jitter — Casting → ATTUAL ONE

Esta alteração adiciona jitter determinístico e limitado ao backoff do dispatcher.

- mantém as janelas base existentes;
- adiciona de 0% a 20% de atraso extra por evento;
- usa `event_key` + número da tentativa como chave estável;
- evita recalcular um limiar diferente a cada polling;
- não altera `MAX_ATTEMPTS`, classificação HTTP ou política terminal.

O objetivo é reduzir rajadas sincronizadas de retry sem tornar o comportamento imprevisível durante uma mesma tentativa.

## Validação na esteira

As responsabilidades ficam separadas para evitar duplicação e travamentos desnecessários:

- CI: instala dependências e executa lint, typecheck, testes e build;
- Promotion Gate: valida o SHA exato, a segurança de migrations e gera o manifest de promoção;
- produção continua fora dos workflows do GitHub e depende da promoção governada pelo ATLAS.
