# Missão 12 — Máquina de estados do convite no ATTUAL ONE

## Objetivo

Transformar os cinco eventos oficiais do Casting Attual 360 em uma máquina de estados explícita, idempotente e auditável no ATTUAL ONE, protegendo o receptor contra eventos duplicados, atrasados ou fora de ordem.

## Estados operacionais

- `prepared` — convite preparado no Casting 360 e projetado no ATTUAL ONE.
- `linked` — identidade/canal Telegram vinculado ao talento.
- `sent` — convite efetivamente enviado e aguardando resposta.
- `accepted` — talento aceitou o convite.
- `declined` — talento recusou o convite.

`accepted` e `declined` são estados finais da primeira versão.

## Eventos oficiais

| Evento | Estado projetado |
|---|---|
| `casting.invitation.prepared` | `prepared` |
| `casting.telegram.linked` | `linked` |
| `casting.invitation.sent` | `sent` |
| `casting.invitation.accepted` | `accepted` |
| `casting.invitation.declined` | `declined` |

## Transições válidas

Fluxo nominal:

`prepared -> linked -> sent -> accepted`

ou

`prepared -> linked -> sent -> declined`

Também são aceitas progressões incompletas quando o ATTUAL ONE recebe o primeiro evento já em uma etapa posterior, desde que o evento seja válido e carregue o contexto obrigatório do contrato. Nesses casos, o receptor cria/atualiza a projeção diretamente para o estado mais avançado recebido, preservando auditoria de que etapas intermediárias não foram observadas localmente.

Exemplos aceitos:

- ausência local de `prepared` + chegada de `linked` => criar projeção em `linked`;
- ausência de `linked` + chegada de `sent` => avançar para `sent`;
- ausência de eventos anteriores + chegada de `accepted` => projetar `accepted` sem inventar eventos ausentes;
- ausência de eventos anteriores + chegada de `declined` => projetar `declined` sem inventar eventos ausentes.

## Regra de precedência

A precedência dos estados é:

`prepared < linked < sent < accepted/declined`

O receptor pode avançar para um estado de maior precedência, mas não pode regredir automaticamente para um estado anterior.

Exemplos:

- projeção `sent` + evento atrasado `linked` => manter `sent` e registrar o evento na inbox/auditoria;
- projeção `accepted` + evento atrasado `sent` => manter `accepted`;
- projeção `declined` + evento atrasado `prepared` => manter `declined`.

## Estados finais conflitantes

`accepted` e `declined` têm a mesma precedência e representam decisões mutuamente exclusivas.

Se a projeção já estiver em `accepted` e chegar `declined`, ou vice-versa, o receptor NÃO deve trocar o estado automaticamente. Deve:

1. persistir o evento recebido na `integration_inbox`;
2. marcar o evento como conflito de estado final;
3. manter o estado final já projetado;
4. gerar evidência/auditoria para revisão administrativa.

Isso impede que mensagens repetidas, callbacks atrasados ou erros de origem reescrevam uma decisão final silenciosamente.

## Idempotência

A idempotência é obrigatória em duas camadas:

1. **Entrada:** o mesmo `event_key` não deve ser processado duas vezes.
2. **Efeito de negócio:** mesmo que a camada de transporte repita a entrega, não pode haver duplicação de efeitos internos.

Um `event_key` já processado deve retornar sucesso idempotente e referenciar o processamento original.

## Correção administrativa

Correções manuais são permitidas apenas por ação administrativa explícita e auditada. Não devem ser simuladas através da reexecução de eventos do Casting.

Toda correção deve registrar, no mínimo:

- `invitation_id`;
- estado anterior;
- estado corrigido;
- usuário/admin responsável;
- motivo;
- data/hora;
- referência opcional ao evento que motivou a correção.

Correções de `accepted` para `declined` ou de `declined` para `accepted` exigem motivo obrigatório.

## Efeitos que NÃO pertencem à máquina de estados

A projeção em `accepted` não deve, por si só:

- criar contrato jurídico;
- autorizar pagamento;
- publicar escala;
- publicar nome/foto do talento;
- disparar comunicação externa irreversível.

A projeção em `declined` pode sinalizar necessidade de substituição, mas não deve escolher automaticamente outro talento sem regra própria no ATTUAL ONE.

## Matriz mínima de testes

| Caso | Estado atual | Evento recebido | Resultado esperado |
|---|---|---|---|
| S01 | inexistente | `prepared` | `prepared` |
| S02 | `prepared` | `linked` | `linked` |
| S03 | `linked` | `sent` | `sent` |
| S04 | `sent` | `accepted` | `accepted` |
| S05 | `sent` | `declined` | `declined` |
| S06 | inexistente | `sent` | `sent` + auditoria de etapas não observadas |
| S07 | `sent` | `linked` | manter `sent` |
| S08 | `accepted` | `sent` | manter `accepted` |
| S09 | `declined` | `prepared` | manter `declined` |
| S10 | `accepted` | `declined` | manter `accepted` + conflito auditado |
| S11 | `declined` | `accepted` | manter `declined` + conflito auditado |
| S12 | qualquer | mesmo `event_key` novamente | sucesso idempotente, sem novo efeito |

## Critérios de aceite da implementação no ATTUAL ONE

A Missão 12 estará implementada quando o receptor real do ATTUAL ONE:

- respeitar a precedência dos estados;
- impedir regressão automática;
- tratar `accepted/declined` como finais e mutuamente exclusivos;
- registrar conflitos de estado final;
- suportar primeiro evento recebido em etapa intermediária/final sem inventar eventos;
- garantir idempotência de entrada e de efeito;
- permitir correção administrativa apenas com auditoria;
- passar S01–S12 de forma automatizada.

## Relação com as missões anteriores

Esta máquina complementa o contrato de eventos, a `integration_inbox`, a matriz de efeitos de negócio e os payloads H01–H05 já definidos. Ela não substitui o Casting 360 como fonte do fluxo original; define apenas como o ATTUAL ONE mantém sua projeção operacional de cada `invitation_id`.
