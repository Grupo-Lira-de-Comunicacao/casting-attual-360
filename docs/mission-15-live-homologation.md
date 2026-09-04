# Missão 15 — Runbook de homologação real

## Objetivo

Validar em ambiente de homologação/produção controlada que o fluxo Casting Attual 360 → ATTUAL ONE mantém entrega eventual, idempotência, auditoria, ordenação por convite e recuperação segura sob falhas.

Este documento é evidência operacional. Nenhum cenário deve ser marcado como aprovado apenas por inspeção de código.

## Pré-condições

- confirmar o projeto Supabase correto do Casting Attual 360;
- confirmar o projeto Supabase correto do ATTUAL ONE;
- aplicar e verificar as migrations do Casting até `012_extend_integration_observability.sql`;
- confirmar presença, sem expor valores, de `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTEGRATION_DISPATCH_SECRET`, `ATTUAL_ONE_EVENTS_URL` e `ATTUAL_ONE_INTEGRATION_SECRET`;
- confirmar receptor ATTUAL ONE saudável;
- registrar SHA exato do Casting e do ATTUAL ONE usados no teste;
- usar apenas eventos sintéticos identificáveis e removíveis/arquiváveis após homologação.

## Evidência mínima por cenário

Registrar para cada cenário:

- data/hora UTC;
- SHA do Casting;
- SHA do ATTUAL ONE;
- `event_id` e `event_key` sintéticos;
- `invitation_id` sintético quando aplicável;
- estado inicial e final de `integration_events`;
- linhas correspondentes em `integration_event_attempts`;
- dead-letter/circuit breaker quando aplicável;
- estado/projeção correspondente no ATTUAL ONE;
- resultado esperado versus observado;
- conclusão: `PASS` ou `FAIL`.

## RES01 — Timeout gera retry sem perda

1. Direcionar temporariamente um evento sintético para um receptor controlado que exceda 10 segundos.
2. Executar o dispatcher.
3. Confirmar tentativa com falha transitória e evento ainda persistido.
4. Confirmar que a próxima tentativa obedece ao backoff+jitter.
5. Restaurar receptor e executar após a janela de retry.

**PASS:** evento não é perdido, recebe nova tentativa e termina processado após recuperação.

## RES02 — HTTP 500 gera backoff e nova tentativa

1. Fazer o receptor sintético responder `500`.
2. Executar dispatcher e registrar a tentativa.
3. Confirmar estado `falhou`, sem dead-letter antes do limite.
4. Restaurar `2xx` e executar após a janela.

**PASS:** nova tentativa ocorre somente quando devida e o mesmo `event_key` é entregue.

## RES03 — HTTP 429 respeita Retry-After

1. Fazer o receptor responder `429` com `Retry-After: 120`.
2. Executar dispatcher.
3. Confirmar `proxima_tentativa_em` aproximadamente 120 segundos à frente.
4. Executar dispatcher antes da janela e confirmar ausência de nova tentativa.
5. Executar depois da janela com receptor saudável.

**PASS:** nenhuma tentativa ocorre antes do horário solicitado e o evento é entregue depois.

## RES04 — 401 interrompe retry automático

1. Usar evento sintético com autenticação propositalmente inválida no receptor controlado.
2. Executar dispatcher.

**PASS:** evento termina em dead-letter/cancelado sem loop automático e a métrica de 401/403 registra a ocorrência.

## RES05 — 422 vai para dead-letter

1. Enviar payload sintético incompatível com contrato por uma rota controlada.
2. Executar dispatcher.

**PASS:** evento terminal possui registro formal em `integration_event_dead_letters`, com hash, erro e último status HTTP, sem retry infinito.

## RES06 — Esgotamento chega a dead-letter com histórico

1. Manter receptor sintético em falha transitória durante todas as janelas, reduzindo intervalos apenas em ambiente isolado se necessário.
2. Permitir atingir o limite de 7 tentativas.

**PASS:** todas as tentativas ficam auditadas e o evento termina em dead-letter com `attempt_count` correto e primeiro/último erro.

## RES07 — Reprocessar dead-letter não duplica efeito

1. Escolher evento sintético em dead-letter cujo `event_key` já tenha sido recebido pelo ATTUAL ONE ou por receptor idempotente.
2. Usar a ação administrativa de reprocessamento.
3. Executar dispatcher.

**PASS:** o mesmo `event_key` é preservado, `reprocess_count` aumenta e o ATTUAL ONE não produz segundo efeito de negócio.

## RES08 — Conteúdo corrigido gera novo evento lógico

1. Partir de um evento sintético inválido em dead-letter.
2. Criar um novo evento corrigido, com novo `event_key`, referenciando o original na evidência de homologação.

**PASS:** evento corrigido é tratado como novo evento lógico e o original permanece auditável.

## RES09 — Circuit breaker abre e recupera por half-open

1. Gerar 5 falhas elegíveis consecutivas (rede, 408, 429 ou 5xx).
2. Confirmar `integration_circuit_breakers.state = open` e janela de 60 segundos.
3. Executar dispatcher durante a janela e confirmar que não pressiona o destino.
4. Após a janela, restaurar o destino e executar.

**PASS:** um único probe é permitido em `half_open`; sucesso fecha o circuito e zera falhas. Repetir uma vez com probe falhando para comprovar reabertura.

## RES10 — Backlog não bloqueia convites independentes

1. Criar eventos sintéticos para pelo menos três `invitation_id` diferentes.
2. Fazer um convite permanecer temporariamente inelegível/falho.
3. Manter os demais aptos.

**PASS:** convites independentes continuam progredindo; backlog e idade do evento mais antigo aparecem nas métricas.

## RES11 — Dois workers não correm no mesmo invitation_id

1. Criar dois eventos ordenados para o mesmo `invitation_id`.
2. Disparar duas execuções concorrentes do dispatcher.

**PASS:** somente o evento ativo mais antigo consegue transicionar para `processando`; o seguinte só progride depois da liberação do lock.

## RES12 — Recuperação drena backlog preservando idempotência

1. Indisponibilizar receptor e acumular backlog sintético de vários convites.
2. Confirmar crescimento da fila e alerta de SLA quando a idade ultrapassar 60 segundos.
3. Restaurar receptor.
4. Executar dispatcher até drenar a fila.

**PASS:** backlog chega a zero ou apenas a eventos deliberadamente terminais, sem duplicidade de efeitos, com tentativas auditadas e circuit breaker fechado ao final.

## Critérios globais de aceite

A Missão 15 só pode ser encerrada operacionalmente quando:

- RES01–RES12 estiverem `PASS` com evidência;
- nenhum evento persistido for perdido silenciosamente;
- dead-letter ativo for visível no painel administrativo;
- backlog acima de 60 segundos gerar alerta;
- circuit breaker aberto/half-open ficar visível;
- p50/p95/p99 e classes HTTP estiverem disponíveis no painel;
- um reprocessamento preservar idempotência;
- dois workers não inverterem a ordem do mesmo `invitation_id`;
- o ATTUAL ONE refletir o estado final esperado.

## Promoção para produção

Após homologação, promover somente o deployment associado ao SHA aprovado pela esteira. Não fazer rebuild, troca manual de alias ou deploy direto para contornar o ATLAS. Registrar deployment anterior e candidato antes da promoção e executar read-back após a troca.

## Rollback

Rollback de aplicação e recuperação de banco são operações distintas. As migrations 008–012 são aditivas, mas qualquer rollback de aplicação deve verificar compatibilidade com o schema já aplicado. Não remover colunas/tabelas como parte de um rollback emergencial sem plano de recuperação de dados.
