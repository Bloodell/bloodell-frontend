# Desenho proposto: portal operacional Bloodell

Estado: aguardando aprovação do usuário antes de implementar. Complementa a [análise de paridade](2026-11-17-paridade-backend-dev-frontend-design.md) e orientará a revisão do [plano existente](../plans/2026-11-17-paridade-backend-dev-frontend.md).

## Objetivo

Tornar o frontend existente útil para equipes autenticadas e visualmente claro no trabalho diário, preservando uma demonstração acadêmica separada. Todos os dados e limites clínicos continuam identificados como didáticos. O frontend permanece uma exportação estática do Next, servida com a API na mesma origem em produção.

## Abordagens consideradas

1. **Evoluir o frontend atual por fluxos (recomendação).** Reutiliza componentes, cores, páginas e rotas existentes, introduz uma entrada autenticada e completa as ações por área. Menor custo de integração e risco visual.
2. **Criar segundo frontend para a equipe.** Permite linguagens visuais distintas, mas duplica telas, contratos e correções; custo elevado sem exigência de produto demonstrada.
3. **Redesenhar tudo antes dos fluxos.** Pode produzir maior mudança estética, porém atrasa autenticação, contratos e regras de segurança. Inadequado para o objetivo de executar todo o plano.

A abordagem 1 é uma recomendação a ser aprovada; as três decisões de produto abaixo foram confirmadas pelo usuário, mas não equivalem à aprovação deste desenho completo.

## Direção visual concreta

- **Identidade:** manter roxo `#5f42f0` como cor de ação, lateral escura `#1b1636`, Instrument Sans para leitura e JetBrains Mono para códigos, números, placas e bolsas. Reduzir áreas de roxo sólido fora de ações e navegação.
- **Estrutura:** lateral agrupada em Operação, Logística, Rede e Administração; mostrar apenas áreas permitidas ao usuário. No mobile, gaveta com a mesma ordem e indicação clara da página ativa. Barra superior identifica usuário, perfil, ambiente e saída.
- **Cabeçalho de tela:** título e descrição curtos, ação principal visível e ações secundárias discretas; filtros logo acima da tabela. Padrões de largura e espaçamento comuns para evitar telas densas em umas áreas e vazias em outras.
- **Tabelas:** números e códigos tabulares, estados como badges com texto, linhas com boa altura de toque, ações contextuais agrupadas, paginação explícita e resumo do total. Em largura estreita, priorizar nome/código, situação e ação; detalhes em painel lateral acessível.
- **Formulários:** uma coluna em telas estreitas; grupos curtos em desktop; rótulo sempre visível, ajuda objetiva e erro junto ao campo. Em requisição, itens múltiplos em cartões numerados com adicionar/remover e erros por item.
- **Feedback:** skeleton com a forma do conteúdo, vazio com próximo passo, erro com tentativa novamente quando aplicável, sucesso sem esconder dados. Confirmações de cancelamento/exclusão descrevem efeitos reais. Sem animação ornamental em fluxos críticos.
- **Mapa e cadeia fria:** identificar dado recebido, estimado e demonstração; posição com horário da leitura. Alertas visíveis com nível por texto e cor. Não mostrar caminhões simulados quando a API falha.
- **Acessibilidade:** foco visível, teclado em menus/diálogos, contraste e estados não dependentes só de cor, alvo de toque adequado, rótulos de formulário, anúncio de erros e testes em desktop/mobile. Tema claro/escuro existente permanece.

Representação textual da página de requisições em desktop:

```text
┌─ Navegação ─┬─ Requisições ────────────────────────────────────────────┐
│ Operação    │ Pedidos hospitalares                    [Nova requisição]│
│ Logística   │ [Na fila 12] [Alocadas 4] [Em rota 2]                 │
│ Rede        │ [Status] [Prioridade] [Hospital] [Limpar]             │
│ Admin*      │ Código  Hospital  Prioridade  Itens  Status  Ações    │
│             │ REQ-…   …         Urgente     2      Na fila ⋯        │
└─────────────┴────────────────────────────────────────────────────────┘
* Somente ADMIN; ações respeitam perfil e escopo no backend.
```

No mobile, os cartões de resumo passam a duas ou uma coluna; a tabela conserva as colunas essenciais e abre os demais dados em painel, sem exigir rolagem horizontal para achar a ação. O login usa a mesma marca e tipografia, com formulário central simples e indicação de ambiente.

## Decisões confirmadas e regras operacionais

- **Acesso:** ADMIN global; operador restrito aos hemocentros vinculados; hospital restrito ao hospital vinculado; logística acessa entregas e veículos das unidades vinculadas. A matriz de ações detalhada por endpoint precisa ser escrita e testada no backend; não será inferida só pelos nomes dos perfis. Associação entre origem, destino e veículo deve ser validada no servidor.
- **Cancelamento:** antes da entrega, reverter a alocação de bolsas ao estoque com evento de rastreabilidade, de forma transacional. Depois da entrega, impedir cancelamento. Qualquer bolsa vencida, descartada ou comprometida não deve voltar automaticamente a DISPONIVEL; o backend deve definir e testar o destino correto. Concorrência com despacho/conclusão exige tratamento explícito.
- **Sessão:** token só em memória. Recarregar a página pede login novamente. Expiração pede novo login; não há refresh. Logout limpa estado e respostas pendentes. 403 não encerra sessão por si só.
- **Demonstração:** proposta de build/configuração próprios apontando para backend de demonstração com dados sintéticos. Simulação local do mapa fica sob escolha explícita e claramente identificada. O seed do cenário só funciona em ambiente habilitado e banco vazio.

## Sequência de construção

1. Base HTTP, login, sessão e permissões reais no backend.
2. Administração e cadastros, incluindo retorno completo do endereço antes de editar unidades.
3. Requisições e entregas; corrigir JSON de rota, paginação, capacidade/origem e cancelamento transacional.
4. Rastreamento e cadeia fria com procedência dos dados, período e erros honestos.
5. Complementos didáticos/indicadores, revisão visual em todas as telas e validação integrada.

Seguir tarefas T1–T11 e B0–B2 do plano revisado. Cada etapa terá critério de aceite e testes. A liberação do fluxo logístico para equipes depende de B0 e B2. Nenhuma regra visual substitui autorização no servidor.

## Fora do escopo derivado

Não há endpoint de reset de senha, resolução de alerta, edição de doação ou busca textual global de bolsas; o desenho não cria controles para essas ações. A roteirização do backend calcula paradas e distância Haversine, não uma linha viária. A interface deve nomear essas diferenças com precisão.

## Pendências para o executor após aprovação

- Antes de tocar o backend, comparar a branch dev com as mudanças já presentes em `fix/s-08-handlers-erros-http`; essa branch contém trabalho de isolamento ainda fora da dev e alterações locais não commitadas em tratamento de erros. Preservar o estado existente. O frontend permanece em `feat/redesign-visual-componentes`, com documentos não rastreados.
- Definir no detalhe de B0 a matriz de cada endpoint e relações cruzadas conforme a política confirmada. Decidir tecnicamente como manter associação de bolsas à requisição/entrega para reversão consistente em B2, com testes antes de alterar a API.
- Não introduzir limite de data de coleta nem comportamento de recuperação de senha sem contrato de backend.
