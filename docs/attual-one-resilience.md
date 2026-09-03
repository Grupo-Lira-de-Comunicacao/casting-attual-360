# Missão 15 — Resiliência operacional Casting Attual 360 → ATTUAL ONE

## Objetivo
Definir o comportamento obrigatório do dispatcher e do receptor diante de falhas transitórias, indisponibilidade, lentidão, duplicidade, backlog e reprocessamento, garantindo entrega eventual sem repetir efeitos de negócio.

## 1. Princípios
- O Casting 360 persiste o evento antes de tentar entregá-lo ao ATTUAL ONE.
- Falha de rede não pode significar perda do evento.
- Retry nunca pode repetir o efeito de negócio graças à idempotência por `event_key`.
- Falhas permanentes devem sair da fila ativa e ir para tratamento explícito.
- Recuperação automática é preferível; reprocessamento manual precisa ser auditável.

## 2. Timeout
Valores iniciais recomendados para homologação:
- conexão: 3 s;
- resposta total: 10 s;
- nenhuma tentativa individual deve bloquear a fila indefinidamente.

Timeout é tratado como falha transitória, salvo regra específica posterior.

## 3. Política de retry
Aplicar exponential backoff com jitter.

Sequência inicial sugerida:
1. tentativa imediata;
2. +30 s;
3. +2 min;
4. +10 min;
5. +30 min;
6. +2 h;
7. +6 h.

Após o limite configurado, o evento deixa a fila normal e vai para dead-letter.

Não fazer retry automático para erros claramente permanentes de contrato/autorização, como `401`, `403` e `422`, salvo mudança conhecida de configuração.

## 4. Classificação de respostas
- `2xx`: entregue; marcar como concluído.
- `408`, timeout de cliente, erro de conexão: transitório; retry.
- `409`: não repetir automaticamente sem classificar se é duplicata legítima ou conflito de payload.
- `429`: retry respeitando `Retry-After` quando presente.
- `5xx`: transitório; retry.
- `401`/`403`: bloquear novas tentativas automáticas e gerar alerta de credencial/configuração.
- `422`: erro de contrato; enviar para dead-letter com evidência suficiente para correção.

## 5. Dead-letter
Eventos que esgotarem tentativas ou apresentarem erro permanente devem registrar, no mínimo:
- `event_key`;
- `invitation_id`;
- tipo do evento;
- payload hash;
- número de tentativas;
- primeiro e último erro normalizado;
- primeiro e último timestamp de tentativa;
- último status HTTP, quando houver;
- `correlation_id`;
- estado: `dead_letter`.

O payload sensível não deve ser duplicado desnecessariamente em logs.

## 6. Reprocessamento seguro
Reprocessar um evento dead-letter deve:
1. preservar o mesmo `event_key` quando o evento lógico é o mesmo;
2. nunca criar um segundo efeito no ATTUAL ONE;
3. registrar ator/origem do reprocessamento;
4. registrar motivo;
5. incrementar contador de reprocessamentos;
6. manter histórico das falhas anteriores.

Se o conteúdo precisar ser corrigido, isso deve gerar novo evento lógico com novo `event_key`, ligado ao anterior por referência de correção.

## 7. Circuit breaker
Quando o ATTUAL ONE demonstrar falha sistêmica, o dispatcher deve reduzir pressão.

Política inicial sugerida:
- abrir circuito após 5 falhas consecutivas elegíveis em janela curta;
- pausar novas entregas por 60 s;
- entrar em half-open com poucas tentativas de prova;
- fechar ao observar recuperação consistente.

O circuito não apaga nem descarta eventos; apenas adia entrega.

## 8. Backlog e ordenação
A fila pode continuar recebendo eventos enquanto o receptor estiver indisponível.

Regras:
- preservar ordem por `invitation_id` sempre que praticável;
- não bloquear toda a fila por causa de um único convite problemático;
- estados finais no ATTUAL ONE continuam protegidos pela máquina de estados da Missão 12;
- backlog crescente deve gerar métrica e alerta.

## 9. Concorrência
O dispatcher pode processar eventos em paralelo, mas deve evitar corrida sobre o mesmo `invitation_id`.

Estratégias aceitas:
- lock lógico por convite;
- partição por chave;
- worker serial por `invitation_id`.

A escolha final depende da infraestrutura do Casting 360, mas o comportamento observado deve ser equivalente.

## 10. Observabilidade mínima
Métricas:
- tamanho da fila pendente;
- idade do evento mais antigo;
- taxa de sucesso;
- taxa de retry;
- total em dead-letter;
- latência p50/p95/p99;
- circuit breaker aberto/fechado;
- erros por classe HTTP.

Alertas mínimos:
- dead-letter > 0 por período relevante;
- fila crescendo continuamente;
- evento mais antigo acima do SLA;
- `401`/`403` recorrentes;
- circuito aberto além da janela esperada.

## 11. SLA operacional inicial
Para a primeira versão:
- objetivo de entrega normal: até 1 minuto;
- durante indisponibilidade: entrega eventual assim que o receptor voltar;
- nenhum evento confirmado como persistido pode ser descartado silenciosamente.

Esses números são operacionais e podem ser calibrados após dados reais.

## 12. Cenários de aceite — RES01–RES12
- **RES01**: timeout gera retry sem perda do evento.
- **RES02**: `500` gera backoff e nova tentativa.
- **RES03**: `429` respeita `Retry-After` quando presente.
- **RES04**: `401` interrompe retry automático e gera alerta.
- **RES05**: `422` vai para dead-letter sem loop infinito.
- **RES06**: evento que falha repetidamente chega a dead-letter com histórico.
- **RES07**: reprocessar dead-letter com mesmo `event_key` não duplica efeito de negócio.
- **RES08**: conteúdo corrigido gera novo evento lógico e referência ao original.
- **RES09**: circuit breaker abre após falha sistêmica e volta por half-open.
- **RES10**: backlog não bloqueia permanentemente convites independentes.
- **RES11**: dois workers não produzem corrida destrutiva no mesmo `invitation_id`.
- **RES12**: recuperação do ATTUAL ONE drena a fila preservando idempotência e auditoria.

## 13. Fora do escopo
Esta missão não define a tecnologia concreta da fila, broker ou worker. Redis, banco, fila gerenciada ou outro mecanismo podem ser usados desde que cumpram o contrato acima.
