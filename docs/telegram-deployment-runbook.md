# Casting Attual 360 — Runbook de implantação Telegram + ATTUAL ONE

## Objetivo
Implantar com segurança a Missão 04 (Convites Telegram) já integrada à `main`, validar o fluxo ponta a ponta e confirmar a emissão dos eventos destinados ao ATTUAL ONE.

## Escopo
Fluxo esperado:

1. Produção criada;
2. Convocação publicada;
3. Matching calculado;
4. Shortlist aprovada manualmente;
5. Convite Telegram preparado;
6. Talento vincula sua conta pelo deep link;
7. Convite é enviado;
8. Talento aceita ou recusa;
9. Shortlist é atualizada;
10. Eventos de integração ficam disponíveis para o ATTUAL ONE.

## Pré-requisitos
- Aplicação publicada em HTTPS;
- Supabase acessível pelo ambiente de execução;
- bot Telegram criado e sob controle do Grupo Lira;
- usuário/talento de teste sem dados pessoais sensíveis;
- acesso administrativo ao Casting Attual 360.

## Variáveis de ambiente
Configurar exclusivamente no ambiente de execução, nunca no Git:

- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Ordem de implantação

### 1. Banco de dados
Aplicar as migrations que já estão versionadas na `main`, verificando antes se não existem conflitos de schema.

Após aplicar, confirmar a existência e permissões das estruturas ligadas a:
- `casting_shortlist`;
- `talent_telegram_links`;
- `casting_invitations`;
- `integration_events`.

Não inserir tokens reais manualmente no banco.

### 2. Aplicação
Publicar a `main` contendo o merge da Missão 04.

Validar que `/api/telegram/webhook` responde no ambiente HTTPS esperado e que não existe exposição de secrets em HTML, logs públicos ou bundles do navegador.

### 3. Webhook Telegram
Registrar o webhook para:

`https://<dominio-da-aplicacao>/api/telegram/webhook`

Enviar também o secret configurado em `TELEGRAM_WEBHOOK_SECRET`, para que o endpoint possa validar `x-telegram-bot-api-secret-token`.

### 4. Teste controlado de vínculo
Usar um talento de teste:

1. colocar o talento em `shortlisted`;
2. preparar o convite pela Shortlist administrativa;
3. copiar o deep link `/start invite_<token>`;
4. abrir o link com a conta Telegram de teste;
5. confirmar que o vínculo passa a usar `telegram_user_id` e `telegram_chat_id`;
6. confirmar que o token não fica armazenado em texto puro.

Evento esperado:
- `casting.invitation.prepared`;
- `casting.telegram.linked`.

### 5. Teste de envio
Enviar o convite somente após o vínculo.

Confirmar:
- mensagem com dados corretos da produção/convocação;
- botões `Tenho interesse` e `Não posso`;
- mudança da shortlist para `invited`;
- convite em estado `sent`.

Evento esperado:
- `casting.invitation.sent`.

### 6. Teste de aceite
Clicar em `Tenho interesse` com o mesmo usuário Telegram vinculado.

Confirmar:
- validação da identidade Telegram;
- convite em `accepted`;
- shortlist em `accepted`;
- repetição do callback sem efeito colateral duplicado.

Evento esperado:
- `casting.invitation.accepted`.

### 7. Teste de recusa
Executar um segundo caso controlado e clicar em `Não posso`.

Confirmar:
- convite em `declined`;
- shortlist em `declined`;
- callback repetido idempotente.

Evento esperado:
- `casting.invitation.declined`.

## Validação do ATTUAL ONE
Antes de construir consumo automático, verificar em `integration_events` se os cinco eventos Telegram possuem payload suficiente e vínculo correto com produção, convocação, shortlist e convite.

Eventos da Missão 04:
- `casting.invitation.prepared`;
- `casting.telegram.linked`;
- `casting.invitation.sent`;
- `casting.invitation.accepted`;
- `casting.invitation.declined`.

Próxima camada recomendada: um consumidor/outbox do ATTUAL ONE que marque processamento, permita retry e preserve idempotência. Não acoplar lógica crítica diretamente ao webhook do Telegram.

## Critérios de aprovação
A implantação só é considerada concluída quando:

- CI da `main` estiver verde;
- migrations aplicadas sem erro;
- webhook autenticado pelo secret;
- deep link funcionar uma única vez;
- envio ocorrer apenas após aprovação humana;
- Telegram responder apenas para a identidade vinculada;
- aceite e recusa forem idempotentes;
- shortlist refletir o estado final;
- todos os eventos esperados aparecerem em `integration_events`;
- nenhum secret estiver versionado ou exposto.

## Rollback
Se houver falha antes do envio real:
- desregistrar o webhook Telegram;
- manter o bot sem novos disparos;
- interromper a publicação da versão problemática;
- não apagar eventos de auditoria já gravados;
- reverter a aplicação para a versão anterior;
- migrations só devem ser revertidas com análise de dados e dependências.

## Próxima missão
Após o teste ponta a ponta, iniciar a integração operacional com o ATTUAL ONE por consumidor de eventos, com idempotência, retries, observabilidade e trilha de auditoria.