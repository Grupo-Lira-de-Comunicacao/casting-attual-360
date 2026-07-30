# Contrato inicial de integração — Casting Attual 360 ↔ ATTUAL ONE

## Objetivo

Definir a primeira versão do contrato técnico entre o Casting Attual 360, o Telegram e o ATTUAL ONE sem acoplamento direto entre bancos.

## Responsabilidades

- **Casting Attual 360:** talentos, vínculos com Telegram, oportunidades, convites e histórico operacional.
- **Telegram:** canal de entrada, confirmação e notificações.
- **ATTUAL ONE:** organizações, projetos, clientes, usuários e coordenação central.
- **ATLAS:** processamento assistido, relatórios e automações aprovadas.

## Transporte inicial

A integração será assíncrona por eventos registrados em `public.integration_events`.

Campos obrigatórios:

- `event_key`: identificador idempotente do evento;
- `event_type`: nome versionado do evento;
- `source_system`: sistema de origem;
- `target_system`: sistema de destino;
- `payload`: conteúdo do evento;
- `status`: estado de processamento;
- `tentativas`: número de tentativas;
- `criado_em` e `atualizado_em`: auditoria temporal.

Referências externas opcionais:

- `organization_external_id`;
- `project_external_id`;
- `talent_id`.

## Convenção de nomes

Formato:

```text
<dominio>.<acao>.v1
```

Eventos iniciais:

```text
telegram.command.received.v1
talent.telegram.link.requested.v1
talent.telegram.linked.v1
talent.updated.v1
opportunity.created.v1
invitation.created.v1
invitation.responded.v1
notification.requested.v1
notification.sent.v1
integration.failed.v1
```

## Envelope do payload

```json
{
  "occurred_at": "2026-07-30T21:00:00Z",
  "actor": {
    "type": "telegram_user|admin|system",
    "external_id": "string"
  },
  "subject": {
    "type": "talent|opportunity|invitation|notification",
    "id": "string"
  },
  "data": {},
  "metadata": {
    "correlation_id": "uuid",
    "source_version": "string"
  }
}
```

## Estados de processamento

```text
pendente → processando → processado
                     ↘ falhou
                     ↘ cancelado
```

Regras:

1. Um consumidor deve verificar `event_key` antes de executar qualquer efeito externo.
2. Falhas temporárias podem ser reenfileiradas até o limite definido pelo serviço.
3. Falhas permanentes devem registrar `ultimo_erro` sem salvar segredos.
4. Eventos processados não devem ser alterados, salvo para auditoria administrativa.

## Primeiro fluxo operacional

### Comando recebido pelo Telegram

1. Telegram chama o webhook protegido.
2. O webhook valida `x-telegram-bot-api-secret-token`.
3. O Casting registra `telegram.command.received.v1`.
4. O bot responde ao usuário quando o comando for reconhecido.
5. Eventos que exigirem ação do ATTUAL ONE serão criados com `target_system = 'attual-one'`.

### Vínculo Telegram–talento

1. O talento solicita vínculo.
2. O sistema gera um código temporário e de uso único.
3. O usuário envia o código pelo Telegram.
4. O backend valida o código e o consentimento.
5. O vínculo é salvo em `talent_telegram_accounts`.
6. O sistema registra `talent.telegram.linked.v1`.

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
- `TELEGRAM_BOT_TOKEN` e `TELEGRAM_WEBHOOK_SECRET` nunca no cliente ou no Git.
- O ATTUAL ONE deverá autenticar consumidores por segredo rotacionável ou assinatura HMAC.
- Payloads não devem conter senhas, tokens, documentos completos ou dados desnecessários.
- Ações críticas exigem usuário autorizado e registro de auditoria.

## Critérios de aceite da primeira integração

- webhook rejeita chamadas sem segredo válido;
- comando Telegram é registrado uma única vez;
- evento contém `event_key`, origem, destino e payload mínimo;
- evento pode ser marcado como processado ou falhou;
- falha não interrompe o recebimento de novos eventos;
- nenhum segredo aparece em logs ou respostas públicas;
- referências do ATTUAL ONE permanecem externas até a definição da arquitetura central.

## Próxima implementação

Criar a migration `004_create_telegram_link_tokens.sql` para suportar códigos temporários, expiração, uso único e auditoria do vínculo entre talento e conta do Telegram.
