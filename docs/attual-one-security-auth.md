# Missão 14 — Segurança e autenticação Casting Attual 360 → ATTUAL ONE

## Objetivo
Definir o mínimo obrigatório de segurança para o endpoint receptor `POST /api/integrations/casting/events`, preservando autenticação entre serviços, proteção contra replay, rotação segura de segredos e rastreabilidade sem expor credenciais.

## 1. Modelo de confiança
- O Casting Attual 360 é o produtor autorizado dos eventos de integração.
- O ATTUAL ONE aceita eventos somente de clientes autenticados explicitamente.
- Telegram nunca chama o ATTUAL ONE diretamente.
- O token do bot Telegram não pode ser reutilizado como credencial do ATTUAL ONE.
- Produção, homologação e desenvolvimento usam segredos distintos.

## 2. Autenticação mínima v1
Cada requisição deve enviar:
- `Authorization: Bearer <integration_secret>`
- `Idempotency-Key: <event_key>`
- `X-Attual-Timestamp: <unix_timestamp>`
- `X-Attual-Signature: <hmac_sha256>`

A assinatura deve ser calculada sobre uma representação canônica contendo, no mínimo:
`timestamp + method + path + event_key + sha256(body)`.

O ATTUAL ONE deve recalcular a assinatura com o segredo ativo e usar comparação em tempo constante.

## 3. Proteção contra replay
- Rejeitar timestamps fora de uma janela de 5 minutos, salvo configuração explícita de homologação.
- Persistir `event_key` na `integration_inbox` com restrição de unicidade.
- Reenvio legítimo do mesmo `event_key` deve retornar sucesso idempotente sem repetir o efeito de negócio.
- Mesmo `event_key` com corpo divergente deve ser tratado como conflito de segurança e auditado.

## 4. Rotação de segredo
A rotação deve permitir duas chaves simultâneas por uma janela curta:
- `current_secret`: usado para novas assinaturas;
- `previous_secret`: aceito temporariamente apenas para transição.

Procedimento:
1. gerar novo segredo fora do código-fonte;
2. cadastrar no ATTUAL ONE como `current_secret`, preservando o anterior como `previous_secret`;
3. atualizar o Casting 360;
4. validar tráfego assinado com a nova chave;
5. revogar `previous_secret` após a janela definida;
6. registrar início, conclusão e responsável pela rotação.

Nunca registrar o valor do segredo em logs, issues, PRs, documentação ou evidências de CI.

## 5. Armazenamento e configuração
- Segredos apenas em secret manager, variáveis de ambiente protegidas ou mecanismo equivalente da infraestrutura.
- Nenhum segredo real no repositório.
- CI usa credenciais próprias e de menor privilégio.
- Homologação usa segredo exclusivo e descartável.
- Em falha de configuração, o receptor deve falhar fechado: sem credencial válida, não processa evento.

## 6. Escopo da credencial
A credencial da integração deve autorizar somente o endpoint de eventos do Casting 360. Ela não concede acesso administrativo ao ATTUAL ONE, leitura de dados de talentos, pagamentos, publicação ou outros módulos.

## 7. Respostas esperadas
- `401` — credencial ausente ou inválida.
- `403` — credencial válida, mas sem escopo para a operação.
- `409` — mesmo `event_key` com conteúdo divergente ou conflito equivalente.
- `422` — payload válido em JSON, mas fora do contrato.
- `429` — limite de requisições excedido.
- `2xx` — evento aceito ou duplicata idempotente legítima.

Detalhes internos de assinatura, segredo, stack trace ou configuração nunca devem ser devolvidos ao cliente.

## 8. Rate limiting e abuso
Aplicar limite por credencial/origem com margem suficiente para retries normais. Rajadas anômalas devem gerar métrica e alerta, sem impedir recuperação automática de incidentes legítimos.

## 9. Logs e auditoria de segurança
Registrar sem segredos:
- `event_key`;
- `invitation_id`, quando disponível;
- `correlation_id`;
- resultado da autenticação;
- motivo normalizado da rejeição;
- timestamp recebido e desvio temporal;
- versão/ID da credencial, nunca seu valor;
- origem técnica;
- código HTTP final.

Tentativas de replay, assinatura inválida repetida e colisão de `event_key` com corpo diferente devem produzir evento de segurança auditável.

## 10. Revogação emergencial
Deve existir procedimento operacional para:
1. revogar imediatamente a credencial comprometida;
2. interromper o dispatcher, se necessário;
3. gerar nova credencial;
4. reprocessar apenas eventos comprovadamente seguros e pendentes;
5. revisar logs desde o último momento conhecido como íntegro.

## 11. Critérios de aceite — SEC01–SEC10
- **SEC01**: requisição sem `Authorization` é rejeitada.
- **SEC02**: Bearer inválido é rejeitado sem revelar detalhes.
- **SEC03**: HMAC inválido é rejeitado.
- **SEC04**: timestamp fora da janela é rejeitado.
- **SEC05**: replay legítimo do mesmo evento é idempotente.
- **SEC06**: mesmo `event_key` com corpo diferente gera conflito e auditoria.
- **SEC07**: segredo de homologação não funciona em produção.
- **SEC08**: rotação aceita temporariamente chave atual e anterior conforme política.
- **SEC09**: após revogação, a chave anterior deixa de autenticar.
- **SEC10**: logs e respostas não expõem tokens, segredos ou assinatura completa.

## 12. Fora do escopo desta missão
Esta especificação não cria o endpoint dentro do repositório do Casting 360 e não substitui a implementação no repositório real do ATTUAL ONE. Ela define o comportamento de segurança obrigatório para a futura implementação da Missão 10.
