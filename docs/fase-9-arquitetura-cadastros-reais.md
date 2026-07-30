# Fase 9 — Arquitetura para cadastros reais

## 1. Objetivo e limites

Este documento propõe a arquitetura inicial para substituir, em uma etapa futura e controlada, o catálogo demonstrativo por um fluxo de cadastro, moderação e publicação de talentos reais.

O estado atual do projeto é preservado:

- o catálogo continua sendo alimentado por `src/data/demo-data.ts`;
- as imagens demonstrativas continuam em `public/talentos`;
- a rota `/talentos/cadastrar` continua usando o formulário de solicitação existente;
- o painel administrativo continua gerenciando as solicitações já previstas;
- nenhuma tabela, política, bucket ou credencial é criada por este documento;
- todos os exemplos deste documento são fictícios.

Esta fase deve manter separados:

1. o contato ou interesse inicial enviado pela pessoa;
2. o cadastro estruturado do talento;
3. a análise administrativa;
4. o perfil público aprovado;
5. as mídias privadas enviadas e as mídias liberadas para publicação.

## 2. Princípios da arquitetura

- Dados de contato e dados públicos devem permanecer separados.
- Um cadastro enviado nunca deve se tornar público automaticamente.
- Aprovar e publicar devem ser decisões administrativas distintas, ainda que representadas no fluxo de estados.
- Rejeitar, arquivar ou despublicar não significa apagar dados ou arquivos.
- Exclusões devem ser operações separadas, auditáveis e dependentes de autorização.
- O catálogo público deve receber somente os campos necessários à exibição.
- Toda autorização deve ser validada no servidor e no banco; esconder controles na interface não é uma regra de segurança suficiente.
- Identificadores internos devem ser imutáveis. Nome profissional e `slug` não devem ser usados como identidade primária.
- Alterações administrativas relevantes devem produzir histórico.
- Chaves secretas ou `service_role` nunca devem ser enviadas ao navegador.

## 3. Modelo de dados proposto

Os nomes abaixo são propostas para discussão. Nenhuma tabela foi criada.

### 3.1. `talent_profiles`

Representa o cadastro principal e os campos profissionais que podem, após aprovação, alimentar o catálogo.

| Coluna proposta | Finalidade |
| --- | --- |
| `id` | Identificador interno imutável, preferencialmente UUID |
| `owner_user_id` | Referência opcional ao usuário autenticado proprietário do cadastro |
| `professional_name` | Nome profissional exibível |
| `slug` | Identificador público único e estável para a URL |
| `role` | Função profissional principal |
| `category` | Categoria usada no catálogo |
| `location_city` | Cidade de atuação |
| `location_state` | Estado de atuação |
| `specialty` | Especialidade principal |
| `bio` | Apresentação profissional |
| `availability` | Texto de disponibilidade |
| `highlight` | Destaque curto para cards |
| `status` | Estado editorial do perfil |
| `submitted_at` | Data do envio para análise |
| `approved_at` | Data da aprovação |
| `published_at` | Data da publicação mais recente |
| `unpublished_at` | Data da despublicação mais recente |
| `rejected_at` | Data da rejeição |
| `archived_at` | Data do arquivamento |
| `created_at` | Data de criação |
| `updated_at` | Data da última atualização |

Campos textuais devem ter limites definidos antes da implementação. `category` pode começar como valor controlado pela aplicação e evoluir para uma tabela própria se houver necessidade de gestão administrativa de categorias.

### 3.2. `talent_private_details`

Mantém dados que não devem ser consultados pelo catálogo público.

| Coluna proposta | Finalidade |
| --- | --- |
| `talent_id` | Relação única com `talent_profiles` |
| `legal_name` | Nome civil, se necessário para a operação |
| `email` | E-mail de contato |
| `phone` | Telefone de contato |
| `preferred_contact` | Canal de contato preferido |
| `internal_notes` | Observações administrativas privadas |
| `created_at` | Data de criação |
| `updated_at` | Data da última atualização |

CPF, documentos, endereço completo e outros dados sensíveis não devem ser coletados apenas por conveniência. Se futuramente forem indispensáveis, exigirão finalidade definida, retenção, controles adicionais e revisão específica.

### 3.3. `talent_links`

Armazena links profissionais sem multiplicar colunas no perfil.

| Coluna proposta | Finalidade |
| --- | --- |
| `id` | Identificador do link |
| `talent_id` | Perfil relacionado |
| `link_type` | Tipo controlado, como portfólio ou rede profissional |
| `url` | Endereço validado |
| `label` | Rótulo opcional |
| `display_order` | Ordem de exibição |
| `is_public` | Liberação editorial para exibição |
| `created_at` | Data de criação |
| `updated_at` | Data da última atualização |

### 3.4. `talent_media`

Registra metadados de fotos, galeria e vídeos. O arquivo binário futuro ficará no Storage, não nesta tabela.

| Coluna proposta | Finalidade |
| --- | --- |
| `id` | Identificador imutável da mídia |
| `talent_id` | Perfil proprietário |
| `media_type` | `image` ou `video` |
| `usage_type` | Foto principal, galeria, vídeo de apresentação ou capa |
| `storage_bucket` | Bucket futuro |
| `storage_path` | Caminho interno do objeto |
| `external_url` | Link externo, quando o vídeo não for armazenado |
| `original_filename` | Nome original apenas para referência privada |
| `mime_type` | Tipo MIME validado |
| `file_size` | Tamanho do arquivo |
| `width` | Largura, quando aplicável |
| `height` | Altura, quando aplicável |
| `duration_seconds` | Duração do vídeo, quando aplicável |
| `alt_text` | Texto alternativo da imagem |
| `caption` | Legenda opcional |
| `display_order` | Ordem na galeria |
| `moderation_status` | Pendente, aprovada ou rejeitada |
| `is_public` | Indica se a mídia está liberada para entrega pública |
| `created_at` | Data de criação |
| `updated_at` | Data da última atualização |

O caminho do Storage deve ser derivado de identificadores imutáveis, por exemplo, perfil, mídia e versão. Não deve depender apenas do nome do talento ou do nome original do arquivo.

### 3.5. `talent_moderation`

Concentra a decisão editorial atual sem expor observações internas no perfil.

| Coluna proposta | Finalidade |
| --- | --- |
| `talent_id` | Perfil moderado |
| `assigned_to` | Administrador ou moderador responsável |
| `decision` | Decisão atual |
| `public_feedback` | Orientação que pode ser enviada ao talento |
| `internal_notes` | Justificativas internas |
| `reviewed_by` | Usuário da última revisão |
| `reviewed_at` | Data da última revisão |
| `updated_at` | Data da última alteração |

### 3.6. `talent_status_history`

Trilha somente de acréscimo para mudanças de estado.

| Coluna proposta | Finalidade |
| --- | --- |
| `id` | Identificador do evento |
| `talent_id` | Perfil relacionado |
| `from_status` | Estado anterior |
| `to_status` | Novo estado |
| `reason` | Motivo registrado |
| `changed_by` | Usuário responsável |
| `changed_at` | Momento da alteração |

O histórico não deve ser editável pelo talento. Alterações retroativas ou exclusões de eventos exigiriam autorização administrativa excepcional.

### 3.7. `user_roles` e `role_permissions`

Proposta para autorização administrativa explícita.

| Estrutura | Finalidade |
| --- | --- |
| `user_roles` | Relacionar usuários autenticados a papéis controlados |
| `role_permissions` | Relacionar papéis às ações autorizadas |

Papéis administrativos não devem ser inferidos de `user_metadata`, e-mail ou simples existência de uma sessão autenticada.

## 4. Estados do perfil

Os estados oficiais propostos são:

| Estado | Significado |
| --- | --- |
| `rascunho` | Cadastro ainda editável e não enviado à equipe |
| `em_analise` | Cadastro enviado e disponível na fila de moderação |
| `aprovado` | Conteúdo aceito, mas ainda não necessariamente público |
| `publicado` | Perfil liberado para o catálogo público |
| `rejeitado` | Cadastro não aprovado, com motivo registrado |
| `arquivado` | Registro retirado do fluxo ativo sem exclusão |

### 4.1. Transições permitidas

- `rascunho` → `em_analise`: envio pelo talento ou submissão administrativa.
- `em_analise` → `rascunho`: devolução para ajustes.
- `em_analise` → `aprovado`: aprovação pelo moderador ou administrador autorizado.
- `em_analise` → `rejeitado`: rejeição justificada.
- `aprovado` → `publicado`: publicação explícita por usuário autorizado.
- `aprovado` → `rascunho`: reabertura para ajustes antes da publicação.
- `publicado` → `aprovado`: despublicação mantendo a aprovação editorial.
- `rejeitado` → `rascunho`: reabertura autorizada para correções.
- Qualquer estado ativo → `arquivado`: retirada administrativa do fluxo.
- `arquivado` → estado anterior apropriado: restauração administrativa com registro no histórico.

Transições fora dessa lista devem ser recusadas no servidor e futuramente no banco. A interface deve apresentar somente ações compatíveis com o estado atual.

## 5. Fluxo de cadastro e moderação

1. O talento inicia um cadastro em `rascunho`.
2. A aplicação valida os campos obrigatórios e as mídias antes do envio.
3. O envio altera o estado para `em_analise` e registra `submitted_at`.
4. O cadastro entra na fila administrativa, sem aparecer no catálogo.
5. Um moderador assume ou recebe a análise.
6. Dados públicos, dados privados, links e cada mídia são revisados separadamente.
7. O moderador pode devolver o cadastro a `rascunho`, com orientações, ou decidir entre aprovação e rejeição.
8. A aprovação altera o estado para `aprovado`, mas não publica automaticamente.
9. Um usuário com permissão de publicação confere a prévia e altera o estado para `publicado`.
10. Cada mudança gera evento de histórico com responsável, data e motivo quando exigido.

O painel deve oferecer:

- busca por nome profissional, cidade, categoria e responsável;
- filtro pelos seis estados;
- indicação de pendências de mídia;
- visualização separada de informações públicas e privadas;
- prévia fiel da página pública;
- histórico de mudanças;
- ações condicionadas à permissão do usuário.

## 6. Regras de publicação e despublicação

### 6.1. Publicação

Um perfil somente pode ser publicado quando:

- estiver no estado `aprovado`;
- possuir nome profissional, `slug`, função, categoria, localização, especialidade e biografia válidos;
- possuir foto principal aprovada;
- não possuir pendência impeditiva definida pela moderação;
- todas as mídias selecionadas para exibição estiverem aprovadas;
- a ação for realizada por administrador ou papel com permissão específica de publicação.

A publicação deve:

- registrar o responsável e a data;
- mudar o estado para `publicado`;
- tornar consultáveis somente os campos e mídias públicos;
- invalidar ou revalidar as páginas públicas necessárias;
- manter dados de contato e notas internas inacessíveis ao catálogo.

### 6.2. Despublicação

A despublicação deve:

- exigir motivo;
- registrar usuário, data e mudança no histórico;
- alterar `publicado` para `aprovado`;
- retirar o perfil do catálogo e impedir acesso público pela rota individual;
- preservar cadastro, mídias, aprovação anterior e histórico;
- não apagar objetos do Storage.

Uma despublicação urgente pode ser permitida ao administrador. A possibilidade de o moderador despublicar diretamente é uma decisão pendente.

### 6.3. Catálogo público

O catálogo público deve retornar apenas:

- perfis em estado `publicado`;
- campos explicitamente públicos;
- mídias aprovadas e marcadas como públicas;
- categorias e filtros derivados de perfis publicáveis.

Não se deve carregar uma linha completa e ocultar dados privados apenas no componente React.

## 7. Fotos, galeria e vídeo

### 7.1. Foto principal

- Deve existir no máximo uma foto principal ativa por perfil.
- Deve estar aprovada antes da publicação.
- Precisa de texto alternativo.
- Alterar a foto principal de um perfil publicado deve exigir nova validação da mídia.

### 7.2. Galeria

- Deve possuir ordem explícita.
- Cada item deve ser moderado individualmente.
- Itens rejeitados ou pendentes nunca devem ser exibidos publicamente.
- A remoção da galeria não deve apagar imediatamente o arquivo físico.
- Limites de quantidade, dimensão e tamanho precisam ser definidos antes da integração real.

### 7.3. Vídeo

A primeira entrega pode admitir:

- link externo de provedor aprovado; ou
- arquivo enviado ao Storage, após definição de custos e limites.

Para arquivos enviados:

- validar MIME, extensão, tamanho e duração;
- manter o original privado durante a análise;
- usar upload retomável para arquivos maiores quando a integração for autorizada;
- armazenar metadados no banco;
- moderar capa e vídeo separadamente quando necessário;
- nunca expor o caminho privado como URL pública permanente.

Transcodificação, geração automática de thumbnails e streaming adaptativo não fazem parte desta arquitetura inicial e dependem de infraestrutura, custo e decisão técnica específicos.

## 8. Permissões

### 8.1. Talento

Pode:

- criar e editar o próprio `rascunho`;
- consultar o próprio cadastro e retorno de moderação;
- enviar o próprio perfil para análise;
- adicionar ou substituir as próprias mídias enquanto permitido pelo fluxo.

Não pode:

- consultar cadastros de outros talentos;
- definir aprovação ou publicação;
- editar notas internas;
- alterar o proprietário do cadastro;
- tornar mídia pública diretamente;
- apagar histórico;
- modificar o cadastro livremente enquanto estiver publicado sem passar por nova análise.

### 8.2. Moderador

Pode:

- consultar cadastros enviados;
- assumir análise;
- revisar dados, links e mídias;
- devolver para ajustes;
- aprovar ou rejeitar conforme permissão definida;
- registrar observações e decisões;
- consultar histórico.

Não pode, por padrão:

- gerenciar papéis administrativos;
- apagar cadastros, mídias ou histórico;
- publicar ou despublicar, salvo se essa permissão for concedida explicitamente.

### 8.3. Administrador

Pode:

- executar todas as ações de moderação;
- publicar e despublicar;
- arquivar e restaurar;
- corrigir campos administrativos autorizados;
- atribuir responsáveis;
- gerenciar papéis e permissões, se possuir a permissão de segurança correspondente.

Mesmo o administrador não deve apagar dados ou arquivos fora de um fluxo específico, auditável e previamente autorizado.

## 9. Proposta futura para Supabase Storage

Esta proposta não cria buckets nem políticas.

### 9.1. Separação de acesso

Recomenda-se separar mídias privadas e públicas por regras de acesso distintas:

- `talent-submissions-private`: originais enviados, capas pendentes e mídias em moderação;
- `talent-media-public`: cópias ou versões explicitamente liberadas para o catálogo.

A decisão entre dois buckets ou um bucket privado com entrega por URLs controladas deve considerar custo, cache, transformação de imagem e simplicidade operacional.

### 9.2. Organização dos objetos

Estrutura conceitual:

`{talent_id}/{media_id}/{version}/{generated_filename}`

Regras:

- não confiar no nome original para construir o caminho;
- normalizar ou gerar o nome do objeto;
- preferir novo caminho para nova versão em vez de sobrescrever;
- manter bucket e caminho registrados em `talent_media`;
- tratar metadados internos do schema `storage` como gerenciados pelo Supabase;
- usar a API do Storage para upload, cópia, movimentação e exclusão.

### 9.3. Acesso futuro

- Talento autenticado: upload e leitura de objetos vinculados ao próprio cadastro privado.
- Moderador: leitura de mídias dos perfis que pode moderar.
- Publicador: liberação da versão aprovada.
- Público: leitura apenas de mídia publicada.
- `service_role`: nunca no navegador e não usada como substituto de RLS.

Buckets privados exigem controle para leitura e podem usar URLs assinadas com validade limitada. Buckets públicos facilitam a entrega de mídia aprovada, mas qualquer pessoa com a URL consegue acessá-la.

### 9.4. Restrições futuras

Antes de ativar uploads, definir:

- tipos MIME permitidos;
- tamanho máximo por tipo de mídia;
- quantidade máxima por perfil;
- dimensões mínimas e máximas de imagem;
- duração e formato de vídeo;
- estratégia de verificação de conteúdo;
- retenção de originais rejeitados ou abandonados;
- impacto no plano e nos custos do Supabase.

## 10. Proposta futura de RLS e políticas

Não há SQL neste documento. As regras abaixo são requisitos conceituais para uma proposta posterior.

### 10.1. Regras gerais

- Habilitar RLS em todas as tabelas expostas pela Data API.
- Verificar separadamente se os papéis `anon` e `authenticated` possuem acesso à tabela na configuração da Data API; concessão de acesso e RLS são camadas diferentes.
- Autenticação não equivale a autorização: políticas para `authenticated` também devem verificar propriedade ou permissão.
- Não usar `user_metadata` para decisões de autorização.
- Políticas de atualização precisam validar tanto a linha existente quanto os novos valores.
- Views públicas, se adotadas, devem respeitar RLS e usar comportamento de invocador quando suportado.
- Funções privilegiadas não devem ser usadas apenas para contornar erros de permissão.

### 10.2. Matriz conceitual

| Recurso | Público | Talento proprietário | Moderador | Administrador |
| --- | --- | --- | --- | --- |
| `talent_profiles` | Ler somente publicados e campos públicos | Criar e editar o próprio perfil conforme estado | Ler e moderar perfis permitidos | Gestão completa autorizada |
| `talent_private_details` | Sem acesso | Ler e editar os próprios dados permitidos | Ler apenas quando necessário à moderação | Gestão autorizada |
| `talent_links` | Ler apenas links públicos de perfis publicados | Gerir os próprios links conforme estado | Moderar | Gestão autorizada |
| `talent_media` | Ler metadados públicos aprovados | Gerir as próprias mídias conforme estado | Moderar | Gestão autorizada |
| `talent_moderation` | Sem acesso | Ler apenas retorno destinado ao talento | Ler e editar conforme atribuição | Gestão autorizada |
| `talent_status_history` | Sem acesso | Leitura limitada do próprio histórico, se aprovada | Leitura | Leitura e inserção pelo fluxo controlado |
| `user_roles` | Sem acesso | Sem acesso | Sem gestão | Gestão restrita |

### 10.3. Políticas de estado

Além de propriedade e papel, futuras políticas ou ações de servidor devem impedir:

- edição direta de perfil publicado pelo talento;
- mudança de estado para `aprovado` ou `publicado` pelo proprietário;
- troca de `owner_user_id`;
- marcação direta de mídia como pública;
- alteração ou exclusão do histórico;
- leitura pública de perfil despublicado, rejeitado ou arquivado.

### 10.4. Storage

As políticas futuras de `storage.objects` devem restringir:

- bucket;
- pasta ou caminho vinculado ao usuário e ao perfil;
- operação solicitada;
- propriedade do objeto ou permissão administrativa;
- leitura pública somente ao modelo de publicação aprovado.

Se for adotado `upsert`, serão necessárias permissões coerentes de inserção, leitura e atualização. A opção preferencial é versionar caminhos para reduzir colisões e problemas de cache.

## 11. O que pode ser feito agora sem banco

Após autorização específica para código, pode ser desenvolvido sem conexão real com novas tabelas:

- tipos TypeScript para perfil, mídia, estado e permissões;
- repositório ou adaptador de dados com implementação demonstrativa;
- formulário estruturado usando somente dados fictícios e sem persistência real;
- telas de fila e moderação com registros fictícios;
- componentes de prévia, estados e histórico demonstrativo;
- matriz de permissões aplicada à interface como protótipo, sem alegar segurança real;
- validações locais de campos e arquivos sem upload;
- testes unitários das transições de estado e validações;
- documentação de campos obrigatórios e critérios de aceite;
- plano de migração do `demo-data.ts` para a futura fonte persistente.

Esses trabalhos não devem fingir que gravam dados reais, concedem segurança ou publicam perfis reais.

## 12. O que exige autorização específica

Exige autorização expressa antes de qualquer execução:

- criar ou alterar tabelas, tipos, índices, funções, triggers ou views;
- criar migration SQL;
- executar SQL local ou remoto;
- criar buckets;
- criar ou alterar políticas RLS e políticas de Storage;
- alterar configurações da Data API;
- criar usuários, papéis, claims ou Auth Hooks;
- enviar, copiar, mover ou excluir objetos no Storage;
- configurar credenciais ou variáveis de ambiente;
- importar dados reais;
- migrar registros demonstrativos;
- ativar o cadastro real;
- publicar em produção;
- realizar qualquer operação que afete custos.

Uma autorização para escrever a proposta de migration não equivale a autorização para executá-la.

## 13. Riscos e dependências

### 13.1. Riscos

- Exposição de contato ou notas internas por consultas públicas excessivas.
- Usuário autenticado acessar ou alterar perfil de outro talento por política baseada apenas em `authenticated`.
- Perfil aparecer no catálogo antes da aprovação.
- Mídia rejeitada continuar acessível por URL pública.
- Alteração de mídia publicada causar conteúdo antigo em cache.
- Upload de arquivos grandes, inválidos ou maliciosos.
- Crescimento de custos de armazenamento, entrega e vídeo sem limites definidos.
- Uso de `slug` ou nome como identidade e quebra de relações após renomeação.
- Mudanças administrativas sem histórico suficiente.
- Claims de autorização desatualizadas durante a validade de uma sessão.
- Coleta excessiva de dados pessoais sem finalidade operacional definida.
- Mistura entre registros demonstrativos e cadastros reais.

### 13.2. Dependências

- definição do fluxo operacional por Sérgio Lira;
- definição de quem poderá moderar e publicar;
- decisão sobre criação de contas para talentos;
- revisão dos campos públicos e privados;
- critérios editoriais de aprovação;
- regras de consentimento, privacidade e retenção;
- limites de mídia e orçamento de Storage;
- revisão atualizada da documentação do Supabase antes da implementação;
- ambiente Supabase autorizado para desenvolvimento e validação;
- aprovação separada da proposta de schema e RLS.

## 14. Decisões pendentes

1. O talento terá conta própria na primeira versão real ou o cadastro será mediado pela equipe?
2. O e-mail de uma solicitação existente poderá ser convertido em convite de cadastro?
3. Moderadores poderão aprovar ou apenas recomendar aprovação?
4. Moderadores poderão despublicar em emergência?
5. Quem pode restaurar um perfil arquivado?
6. Categorias serão fixas no código ou administráveis no banco?
7. Alterações de um perfil publicado criarão revisão pendente sem retirar a versão pública atual?
8. Vídeos serão links externos, arquivos próprios ou ambos?
9. Mídias aprovadas ficarão em bucket público ou serão servidas de bucket privado?
10. Quais limites de quantidade, formato, tamanho e duração serão adotados?
11. Qual será o prazo de retenção para rascunhos abandonados, rejeições e originais substituídos?
12. Quais campos e consentimentos são obrigatórios para um cadastro real?
13. Será necessário preservar redirecionamento quando o `slug` mudar?
14. Qual será o procedimento excepcional de exclusão e quem poderá autorizá-lo?

## 15. Referências para a etapa de implementação

Antes de qualquer implementação Supabase, as referências devem ser verificadas novamente, pois os recursos e recomendações podem mudar:

- [Supabase Storage — controle de acesso](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage — buckets públicos e privados](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase Storage — uploads padrão](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Supabase Storage — limites de arquivos](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Supabase — custom claims e RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)
- [Supabase — segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api)

## 16. Critério para avançar

Este documento é somente arquitetura inicial. O próximo passo seguro é revisar e aprovar:

1. os campos do cadastro;
2. as transições de estado;
3. a matriz de permissões;
4. as decisões pendentes;
5. o escopo de uma implementação demonstrativa sem banco.

Somente depois deve ser preparada, sob autorização separada, uma proposta de schema e políticas. A execução de SQL, criação de Storage e entrada de dados reais continuam fora do escopo autorizado.
