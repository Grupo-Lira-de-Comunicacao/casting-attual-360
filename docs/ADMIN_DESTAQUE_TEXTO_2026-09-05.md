# Campo textual de Destaque no Admin

Objetivo: permitir editar manualmente o texto exibido no bloco **Destaque** do perfil público, de forma independente do booleano que controla se o talento aparece na seleção de destaques da home.

Implementação prevista:
- nova coluna `talents.destaque_texto`;
- backfill preservando o comportamento visual atual;
- campo de texto no formulário administrativo;
- leitura pública priorizando `destaque_texto` com fallback compatível;
- sem alteração da flag booleana `destaque`.
