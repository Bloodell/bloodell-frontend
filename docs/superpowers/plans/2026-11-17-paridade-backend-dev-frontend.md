# Paridade com backend dev — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar os fluxos do frontend para equipes autenticadas, mantendo a demonstração separada e respeitando os contratos efetivos da dev.

**Architecture:** Evoluir o frontend existente por fluxo, com cliente HTTP e sessão compartilhados, mantendo exportação estática. O backend é autoridade de autorização e transições; requisitos ainda ausentes nele são tarefas condicionais explícitas. Não transformar todo endpoint técnico em tela.

**Tech Stack:** Next.js/React/TypeScript/Tailwind e componentes locais; backend Spring Boot/Java 25/PostgreSQL. Node >=22 conforme package.json. Proposta para testes futuros: Vitest + Testing Library para unidade/componentes, Playwright para fluxos de navegador; versões compatíveis devem ser resolvidas e fixadas no lockfile na execução, sem upgrades das bibliotecas existentes por conveniência.

**Spec:** [Análise e desenho](../specs/2026-11-17-paridade-backend-dev-frontend-design.md).

**Estado:** plano proposto para revisão, não executado. O usuário autorizou análise/plano, não implementação. Os requisitos “equipes autenticadas” e “demonstração separada” foram confirmados; demais propostas estão identificadas como tal. Não houve aprovação do desenho para construir.

## Global Constraints

- Preservar exportação estática do Next; sem pressupor middleware, BFF, Server Actions ou servidor Node de produção.
- Novas telas seguem `src/app` + `src/features`, componentes atuais e tipos escritos manualmente; sem gerador de boilerplate.
- Autorização final permanece no backend. Ocultar menu administrativo melhora UX, não substitui 403 no servidor.
- Não usar resposta de outra sessão/entidade como dado atual. Limpar recursos no logout/troca de identidade e ignorar requisições antigas.
- Tratar 400 por campo, 401, 403, 404, 409, 422, 503 e erro de rede; não repetir mutações automaticamente.
- Separar dado sintético, estimado e recebido; preservar avisos acadêmicos e não declarar uso clínico pronto.
- Não implementar agora; alterações de backend descritas são pré-requisitos propostos, não realizadas.

## Review Focus

1. Logout/login ou troca rápida de entidade enquanto há requisição pendente: nunca exibir dados da identidade/entidade anterior (T1/T2/T9).
2. Perfil ADMIN alterado por outra sessão: menu/ação devem reagir ao perfil atual; 403 não pode virar loop de logout/login (T2/T3).
3. PUT de unidade sem endereço no GET: preservar campos existentes, inclusive quando só nome muda (B1/T4).
4. Mais de 100 requisições e rota/status/posição mudando sem mudar IDs: não omitir entregas nem manter mapa antigo (T7/T8).
5. Operação parcial/conflitante: alocação incompleta, duplo envio, cancelamento concorrente e 202 ainda não persistido não podem ser apresentados como conclusão integral (T5/T6/B2/T9/T11).

## Ordem, prioridades e dependências

| Fase | Tarefas | Dependências / resultado verificável |
|---|---|---|
| P0 — acesso e contrato | T1 → T2; correção de rota em T6 | Sessão autenticada e integração sem texto inválido em rota |
| P0 — condição de liberação por equipe/unidade | B0 | Matriz de acesso e isolamento no backend, antes de declarar acesso restrito entre equipes |
| P1 — administração | T3 após T2; B1 → T4 | Usuários e cadastros completos sem perda de endereço |
| P1 — operação | T5 após T1/T2; T6 após T1/T2; B2 → cancelamentos avançados | Requisições de vários itens, prioridade e planejamento/roteirização |
| P1 — integridade das consultas | T7 após T1; T8 após T2/T6/T7 | Nenhuma entrega perdida pela primeira página; mapa reflete atualização |
| P2 — monitoramento | T9 após T1/T2; T10 após T2 | Períodos, vínculos, indicadores e demo separados |
| Encerramento | T11 após tarefas liberadas | Fluxos validados com backend autenticado e exportação estática |

T3, T4 e T5 podem ser entregas independentes após suas bases. T6 sem cancelamento avançado também. Não bloquear toda evolução por decisões de B0/B2, mas não liberar os cenários que dependem delas. Prioridade P0 não significa reescrever telas já funcionais.

**Critério proposto após revisão:** manter criação/despacho/conclusão para desenvolvimento/homologação sintética durante a migração; liberação logística para uso por equipes operacionais exige B0 e B2 aceitos. Se houver decisão de adiar B2, limitar a entrega à homologação, sem chamar o fluxo de operação pronta. Demo proposta: frontend em modo demonstracao aponta para backend dedicado com dados sintéticos; mapa local simulado continua alternativa explícita. Não usar banco operacional para seed nem exigir mocks de todas as telas. Ambos os pontos são propostas para revisão, não decisões atribuídas ao usuário.

## Convenções de arquivos e verificação

Todos os caminhos `src/...`, `tests/...`, `package.json`, `README.md` e `next.config.ts` abaixo são relativos a `C:/dev/PI/frontend/bloodell-frontend`. Arquivos marcados **criar** são propostas, não existentes. Backend: `C:/dev/PI/bloodell-backend`; `B/<arquivo>` expande para `src/main/java/br/edu/cesar/bloodell/<arquivo>`. Começar execução futura a partir dos commits registrados no desenho ou revalidar diferenças antes de aplicar o plano.

Na primeira tarefa, adicionar scripts propostos `test` = `vitest run`, `test:watch` = `vitest`, `test:e2e` = `playwright test`, configurações e dependências de teste. Hoje só existem lint/typecheck/build/contraste; não alegar suíte de frontend existente.

Cada tarefa segue ciclo: escrever cenários especificados → executar teste focal e observar falha relevante → implementar → repetir teste focal + lint/typecheck → revisar diff e fazer commit somente no fluxo de implementação aprovado. Comandos neste documento são **para execução futura**, não resultados observados. Não repetir verificação ampla a cada mudança pequena; build e e2e completos ficam no marco T11.

## T1 — Cliente HTTP completo e recursos seguros (P0; G01)

**Modificar:** `src/lib/api/cliente.ts`, `src/lib/api/use-recurso.ts`, `src/lib/api/tipos.ts`, `package.json`, `package-lock.json`.
**Criar:** `vitest.config.ts`, `tests/setup.ts`, `src/lib/api/cliente.test.ts`, `src/lib/api/use-recurso.test.tsx`, `src/lib/api/eventos.ts`.

**Interfaces propostas:** preservar `api.buscar<T>(caminho)`, `api.enviar<T>(caminho, corpo?)`; acrescentar `api.substituir<T>(caminho, corpo): Promise<T>` (PUT), `api.alterar<T>(caminho, corpo): Promise<T>` (PATCH), `api.remover(caminho): Promise<void>` (DELETE). Acrescentar `configurarCredencial(obterToken: () => string | null): void` e `assinarSessaoExpirada(listener: () => void): () => void`; o cliente não depende de React. `useRecurso<T>(caminho: string | null, escopo?: string)` mantém contrato atual e acrescenta `statusHttp: number | null` para tratamento de falhas sem inspecionar texto. O provider de T2 repassa escopo/generation de sessão pelo contexto.

- [ ] Escrever testes `envia_metodos_e_bearer`, `delete_204_nao_le_json`, `preserva_campos_e_correlacao`, `erro_html_preserva_status_401`, `json_invalido_nao_vaza_syntaxerror`, `nao_repete_post_apos_falha`, `troca_de_escopo_descarta_resposta_antiga`, `caminho_null_limpa_dados`.
- [ ] Rodar `npm run test -- src/lib/api/cliente.test.ts src/lib/api/use-recurso.test.tsx`; observar falhas das interfaces/comportamentos novos.
- [ ] Implementar parsing defensivo: erro HTTP mantém status mesmo sem JSON; resposta 204 retorna vazio; diferenciar rede. Notificar expiração só para requisição autenticada 401, sem disparar evento para falha do próprio login. 403 mantém sessão.
- [ ] Em `useRecurso`, dados só pertencem à mesma entidade/escopo. Pode manter dados ao atualizar a mesma chave, mas deve marcar falha/defasagem; limpar em null, mudança de caminho ou identidade. Cancelar/ignorar respostas antigas.
- [ ] Rodar teste focal, `npm run lint`, `npm run typecheck`; revisar e registrar commit da tarefa na execução.

**Aceite:** todas as mutações futuras usam um cliente; não há bypass de autorização nem erro 401 escondido por JSON.parse.

## T2 — Login, identidade e separação de ambientes (P0; G01/G09, D02/D05)

**Criar:** `src/app/login/page.tsx`, `src/features/autenticacao/pagina-de-login.tsx`, `provedor-de-sessao.tsx`, `acesso-autenticado.tsx`, `sessao.ts`, `permissoes.ts`, `sessao.test.ts`, `pagina-de-login.test.tsx` dentro de `src/features/autenticacao/`; `src/components/layout/estrutura-da-aplicacao.tsx`, `src/lib/ambiente.ts`.
**Modificar:** `src/app/layout.tsx`, `src/components/layout/barra-superior.tsx`, `lateral.tsx`, `navegacao.ts`, `src/lib/api/tipos.ts`, `src/lib/api/use-recurso.ts`, `.env.example`, `README.md`.

**Contratos:** `Perfil = 'OPERADOR_HEMOCENTRO' | 'USUARIO_HOSPITAL' | 'LOGISTICA' | 'ADMIN'`; `UsuarioAtual = {id:number; nome:string; email:string; perfil:Perfil}`; `RespostaLogin = {accessToken:string; tokenType:string; expiresIn:number; usuario:UsuarioAtual}`. `useSessao()` expõe `{estado:'anonima'|'autenticando'|'autenticada'; usuario:UsuarioAtual|null; geracao:number; entrar(email:string,senha:string):Promise<void>; sair():void; atualizarUsuario():Promise<void>}`. `podeGerenciarUsuarios(usuario:UsuarioAtual|null): boolean` só para ADMIN. Modo proposto `NEXT_PUBLIC_MODO_APLICACAO=operacao|demonstracao`, padrão `operacao`.

- [ ] Confirmar D02 antes de implementação: proposta em memória, sem token persistido e sem refresh inexistente. Não guardar senha.
- [ ] Testar login válido/inválido, expiração pelo `expiresIn`, reload exigindo login, `/auth/me`, saída limpando dados e formulários, 403 sem destruir sessão, resposta atrasada de login após saída, retorno apenas a caminho interno válido.
- [ ] Rodar `npm run test -- src/features/autenticacao`; observar falhas e implementar sessão/provider/gate.
- [ ] Montar login fora do chrome operacional e só montar telas consumidoras de dados após autenticação. `/login` precisa ser exportável; não usar middleware/Server Actions. `/usuarios` recebe guarda ADMIN além do servidor.
- [ ] Exibir nome/perfil reais e botão Sair no desktop/mobile. Em demo, identificar modo claramente e esconder gestão de contas quando backend não oferece auth. Erros em produção nunca habilitam demo automaticamente.
- [ ] Acrescentar teste de reconsulta de perfil após 403 em administração e retorno de foco à janela; atualizar menus a partir de `/me`, não de claim antigo.
- [ ] Rodar testes focais/lint/typecheck, revisar diff e commit futuro.

**Aceite:** operação com auth habilitada, sem chamadas de negócio anônimas; não afirmar segmentação por unidade até B0. Validade de 15 minutos é padrão do backend, mas interface usa `expiresIn` retornado.

## B0 — Autorização por função/unidade (P0 para liberação; G09/D01)

**Pré-condição de produto:** definir ações de cada um dos quatro perfis, vínculo a uma ou várias unidades e visibilidade dos indicadores. Isso não está especificado na dev; não inferir matriz apenas pelo nome do perfil.

**Backend a revisar/modificar:** `B/config/ConfiguracaoSeguranca.java`, `B/autenticacao/apresentacao/AutenticacaoDtos.java`, controllers/services de unidades, bolsas, estoque, doações, requisições, entregas, veículos, alertas, indicadores e AED. **Criar ou incorporar após revisão:** `B/autenticacao/aplicacao/AcessoUnidade.java`, `B/autenticacao/apresentacao/VinculoDeUnidadeController.java`, vínculo persistido e migration. Esses arquivos existem em outra linha local, mas não são contrato da dev examinada; antes de criar, conferir o diff da mudança candidata.

- [ ] Registrar matriz aprovada em documento próprio, incluindo relações cruzadas (entrega/requisição/veículo/origem).
- [ ] Revisar/incorporar trabalho existente em branch dedicada; nunca mover automaticamente as alterações locais atuais.
- [ ] Criar `src/test/java/br/edu/cesar/bloodell/api/PermissoesPorPerfilIT.java` e `IsolamentoMultiunidadeIT.java` com dois hospitais/dois hemocentros: negar consulta/mutação por ID fora do escopo; filtrar listas/indicadores; garantir acesso ADMIN definido; negar relações cruzadas inválidas.
- [ ] Só após estabilizar DTO de vínculos, atualizar tipos/provider/permissões do front e seletores conforme contrato aprovado. Não definir agora uma assinatura fictícia para endpoint ausente.
- [ ] Verificar via API direta e navegador: trocar ID na URL/corpo não amplia acesso. Rodar testes autenticados isolados e regressões existentes.

**Entrega:** plano complementar de backend e contrato aprovado; bloqueia liberação multiunidade, não a implementação de login. Comando focal após criar testes: `.\mvnw.cmd "-Dit.test=PermissoesPorPerfilIT,IsolamentoMultiunidadeIT" test-compile failsafe:integration-test failsafe:verify` (Docker/JDK 25 necessários).

## T3 — Administração de usuários (P1; G02)

**Criar:** `src/app/usuarios/page.tsx`; em `src/features/usuarios/`: `pagina-de-usuarios.tsx`, `formulario-de-usuario.tsx`, `painel-de-usuario.tsx`, `usuarios-api.ts`, `usuarios.test.tsx`.
**Modificar:** `src/lib/api/tipos.ts`, `src/components/layout/navegacao.ts`, `lateral.tsx`.

**Interfaces:** `listarUsuarios(page:number,size:number):Promise<Pagina<UsuarioAtual>>`; `buscarUsuario(id:number):Promise<UsuarioAtual>`; `cadastrarUsuario(entrada:{nome:string;email:string;perfil:Perfil;senha:string}):Promise<UsuarioAtual>`; `atualizarUsuario(id:number,entrada:Partial<Pick<UsuarioAtual,'nome'|'email'|'perfil'>>):Promise<UsuarioAtual>`. Consulta detalhada por painel/ID em estado/query, sem rota dinâmica incompatível com exportação estática.

- [ ] Testar `admin_lista_cria_edita`, `nao_admin_nao_monta_pagina`, `pagina_vazia_e_404`, `senha_unicode_respeita_72_bytes`, `email_duplicado_409`, `ultimo_admin_409`, `patch_envia_so_campos_alterados`, `autorrebaixamento_reconsulta_me`.
- [ ] Rodar `npm run test -- src/features/usuarios`; implementar paginação de servidor 20/página, form criar e editar separados (senha só criar), erro por campo e conflito geral preservando valores.
- [ ] Aplicar mínimo 12 caracteres/máximo 72 bytes UTF-8 na senha e não enviar null/senha/extras no PATCH. Não enviar PATCH vazio.
- [ ] Após alterar o próprio cadastro, atualizar sessão com `/auth/me`; ao perder ADMIN sair da área administrativa, sem tentar manter privilégios do token antigo.
- [ ] Rodar testes focais/lint/typecheck e commit futuro.

**Aceite:** fluxo completo ADMIN; nenhum botão de excluir, resetar senha ou cadastro público inventado.

## B1/T4 — Unidades e veículos editáveis sem perda de dados (P1; G04)

**B1 backend obrigatório para editar unidade:** modificar `B/unidade/apresentacao/UnidadeDtos.java` e `B/unidade/aplicacao/UnidadeService.java` para devolver `logradouro,numero,bairro,cep` como strings anuláveis; ampliar `src/test/java/br/edu/cesar/bloodell/api/CadastrosIT.java`.

- [ ] Criar teste GET→PUT alterando só nome e preservando endereço completo; testar endereço parcialmente nulo.
- [ ] Rodar `.\mvnw.cmd "-Dit.test=CadastrosIT" test-compile failsafe:integration-test failsafe:verify`, observar falha; implementar retorno aditivo, repetir. Não habilitar edição no front antes de backend compatível.

**T4 frontend modificar:** `src/features/unidades/formulario-de-unidade.tsx`, `pagina-de-unidades.tsx`, `src/features/cadeia-fria/formulario-de-veiculo.tsx`, `pagina-da-cadeia-fria.tsx`, `src/lib/api/tipos.ts`.
**Criar:** `src/features/unidades/unidades-api.ts`, `unidades.test.tsx`; `src/features/cadeia-fria/veiculos-api.ts`, `veiculos.test.tsx`; `src/components/form/confirmar-acao.tsx`.

**Interfaces:** `EntradaUnidade` espelha UnidadeRequisicao incluindo endereço completo; `salvarUnidade(tipo:'hemocentros'|'hospitais',id:number|null,entrada:EntradaUnidade):Promise<Unidade>`; `removerUnidade(tipo,id):Promise<void>`. `EntradaVeiculo={placa:string;hemocentroBaseId:number;capacidadeBolsas:number;latitude:number;longitude:number}`; `salvarVeiculo(id:number|null,entrada:EntradaVeiculo):Promise<Veiculo>`, `removerVeiculo(id:number):Promise<void>`. `ConfirmarAcao({aberto,titulo,descricao,ocupado,aoConfirmar,aoFechar})` reutiliza Dialog existente com foco/teclado.

- [ ] Testar formulário preenchido por GET detalhe, PUT correto, DELETE 204, 409 preservando linha, 404 recarregando lista, coordenadas limites, placa duplicada e veículo EM_ROTA bloqueado (422 se estado mudou).
- [ ] Rodar `npm run test -- src/features/unidades src/features/cadeia-fria/veiculos.test.tsx`; implementar modos criar/editar, ações por linha e confirmação de exclusão nomeando entidade.
- [ ] Respeitar tipo original da unidade; PUT não converte hospital em hemocentro. Veículo não tem edição arbitrária de status via esse contrato.
- [ ] Adicionar filtro de frota por status; não derivar “sem histórico” no cliente: deixar API decidir exclusão.
- [ ] Rodar testes focais/lint/typecheck e commit futuro.

**Aceite:** editar preserva endereço, exclusões não somem visualmente antes de sucesso e vínculos bloqueados são explicados.

## T5 — Requisições completas (P1; G05/G10)

**Modificar:** `src/features/requisicoes/formulario-de-requisicao.tsx`, `pagina-de-requisicoes.tsx`, `tabela-de-requisicoes.tsx`, `painel-de-alocacao.tsx`, `src/lib/api/tipos.ts`.
**Criar:** `src/features/requisicoes/editor-de-itens.tsx`, `painel-de-requisicao.tsx`, `requisicoes-api.ts`, `requisicoes.test.tsx`.

**Interfaces:** `ItemRequisicaoEntrada={componente:TipoComponente;tipoSanguineo:string;quantidade:number}`; `criarRequisicao({hospitalId,prioridade,itens}: {hospitalId:number;prioridade:Prioridade;itens:ItemRequisicaoEntrada[]}):Promise<Requisicao>`; `alterarPrioridade(id:number,prioridade:Prioridade):Promise<Requisicao>` envia PUT `{prioridade}`; `cancelarRequisicao(id:number):Promise<void>` envia DELETE. Detail GET `/requisicoes/{id}`. Campos de erro mantêm índice `itens[n].campo`.

- [ ] Testar dois itens de tipos/componentes diferentes, remoção de item sem perder erros correspondentes, lista vazia impedida, quantidade não inteira/zero, erro `itens[1].quantidade` só na segunda linha.
- [ ] Testar prioridade NA_FILA alterando fila; estado concorrente responde 422 e recarrega; cancelamento CRIADA/NA_FILA com confirmação; ATENDIDA sem ações inválidas.
- [ ] Testar alocação parcial (ex.: 1 de 3): mostrar pendência e diário, nunca rotular “atendimento completo”; zero elegível 409 preserva pedido na fila.
- [ ] Rodar `npm run test -- src/features/requisicoes`; implementar itens dinâmicos, detalhe e ações permitidas. Não oferecer edição de hospital/itens depois da criação, pois PUT não suporta.
- [ ] Não persistir diário só no navegador como se fosse histórico consultável: resposta da alocação é transitória, API não fornece GET desse diário. Detalhe persistente mostra o que GET realmente devolve.
- [ ] Rodar testes focais/lint/typecheck e commit futuro. Cancelamento ALOCADA/EM_ROTA depende de B2.

## T6 — Planejamento, rota e transições de entrega (P0 contrato, P1 restante; G03/G06)

**Modificar:** `src/features/entregas/formulario-de-entrega.tsx`, `pagina-de-entregas.tsx`, `src/lib/api/tipos.ts`.
**Criar:** `src/features/entregas/entregas-api.ts`, `rota-planejada.ts`, `painel-de-entrega.tsx`, `formulario-de-planejamento.tsx`, `entregas.test.tsx`, `rota-planejada.test.ts`.

**Interfaces:** `ParadaRota={ordem:number;tipo:string;unidadeId:number;nome:string;latitude:number;longitude:number}`; `RotaPlanejada={paradas:ParadaRota[]}`; `interpretarRota(rota:string|null):RotaPlanejada|null` valida estrutura/números antes de usar. `atualizarPlanejamento(id:number,entrada:{rota:string|null;distanciaKm:number|null;tempoEstimadoMin:number|null}):Promise<Entrega>`; `roteirizarEntrega(id:number):Promise<Entrega>` usa POST sem corpo. `cancelarEntrega(id:number):Promise<void>` só exposto após B2.

- [ ] Testar criação sem rota envia null e funciona; remover texto livre que hoje gera 400. Não usar JSON bruto como campo de produto.
- [ ] Testar roteirização PLANEJADA exibe paradas ordenadas e distância; JSON inválido/antigo apresenta “rota indisponível” sem quebrar página. A API admite outros JSON: não afirmar que toda string é RotaPlanejada.
- [ ] Testar PUT preservando rota existente ao alterar tempo, distância zero permitida, tempo zero/decimal proibido, campos opcionais vazios viram null. Exibir diferença entre distância do backend e trajeto viário estimado.
- [ ] Testar filtros de veículo DISPONIVEL e requisicões já usadas em entrega ativa; servidor continua autoridade caso haja concorrência. Não prometer validação de capacidade/origem ausente em B2.
- [ ] Rodar `npm run test -- src/features/entregas`; implementar detalhe com distância, estimativa, início/conclusão; edição só de planejamento PLANEJADA; preservar três ações de avanço já existentes, com botão ocupado e reconciliação após erro.
- [ ] Se roteirização for sugerida logo após criar, mostrar sucesso da criação mesmo se segundo POST falhar; não reenviar criação. Proposta mais simples: ação explícita “Calcular rota” no detalhe.
- [ ] Rodar testes focais/lint/typecheck e commit futuro.

**Aceite:** nenhum texto inválido enviado como rota; planejamento do backend visível; não vender Haversine como rota por ruas.

## B2 — Consistência logística e cancelamentos avançados (P1 condicional; G10/D03/D07)

**Backend a modificar após decisões:** `B/requisicao/aplicacao/RequisicaoService.java`, `B/entrega/aplicacao/EntregaService.java`, `B/alocacao/aplicacao/AlocacaoService.java`, modelos/repositórios de associação bolsa–requisição/entrega conforme regra aprovada, `B/estoque/aplicacao/SincronizadorDeEstoque.java`, `B/rastreabilidade/aplicacao/RegistradorDeEventos.java`.
**Testes criar:** `src/test/java/br/edu/cesar/bloodell/api/CancelamentoOperacionalIT.java`; ampliar `EntregaIT.java`.

- [ ] Definir destino de bolsas já alocadas/em transporte, recontagem de estoque, rastreabilidade e efeito sobre requisição; definir se pedido parcialmente alocado pode ser concluído e como atender saldo.
- [ ] Definir origem da entrega consistente com bolsas alocadas e validação de capacidade; persistir associação suficiente para cumprir regra, caso histórico sozinho não baste.
- [ ] Testar cancelamentos antes/depois de despacho, concorrência com conclusão, segunda tentativa, múltiplas entregas usando o mesmo veículo e preservação de histórico. Verificar status/quantidade de todos os agregados envolvidos, não apenas HTTP 204.
- [ ] Implementar transação e contrato escolhido; executar `.\mvnw.cmd "-Dit.test=CancelamentoOperacionalIT,EntregaIT" test-compile failsafe:integration-test failsafe:verify`.
- [ ] Só então ligar `cancelarEntrega` e ampliar `cancelarRequisicao` em T5/T6; texto da confirmação deve informar efeitos reais aprovados, sem prometer devolução que a dev não realiza.

**Limite:** esta tarefa é planejamento condicionado a decisões explícitas, não especificação executável de regras ainda desconhecidas. Não esconder essa dependência com implementação somente visual.

## T7 — Consultas sem corte silencioso em 100 registros (P1; G07)

**Criar:** `src/lib/api/paginacao.ts`, `paginacao.test.ts`; `src/features/entregas/seletor-de-requisicao.tsx`.
**Modificar:** `src/features/entregas/pagina-de-entregas.tsx`, `formulario-de-entrega.tsx`, `src/features/rastreamento/use-rastreamento.ts`.

**Interfaces:** `listarPaginaDeRequisicoes(page:number,status?:StatusRequisicao):Promise<Pagina<Requisicao>>`, com size=20; `buscarRequisicoesPorIds(ids:number[]):Promise<Requisicao[]>`, deduplicando IDs e no máximo 4 consultas GET simultâneas. GET de detalhe elimina dependência do mapa de carregar todas as requisições.

- [ ] Testar 101+ requisições: opção na página seguinte selecionável; entrega de requisição fora da primeira página aparece no mapa; IDs repetidos consultados uma vez; 404 por item produz pendência identificada e não derruba outras entregas.
- [ ] Rodar `npm run test -- src/lib/api/paginacao.test.ts`; implementar seletor paginado com total, próximo/anterior, estado vazio/erro e seleção preservada.
- [ ] Mapa resolve só IDs das entregas retornadas; falha 401 propaga sessão, 404 gera aviso, sem substituir por simulação. Não baixar banco inteiro para alimentar select.
- [ ] Verificar foco/teclado do seletor, testes focais/lint/typecheck e commit futuro.

## T8 — Rastreamento coerente com API e modo explícito (P1; G08)

**Modificar:** `src/features/rastreamento/use-rastreamento.ts`, `modelo.ts`, `posicao.ts`, `pagina-de-rastreamento.tsx`, `paineis.tsx`; integrar parser de T6.
**Criar:** `src/features/rastreamento/use-rastreamento.test.tsx`, `posicao.test.ts`.

**Interfaces:** acrescentar a `EntregaBase` `posicaoRegistradaEm:string|null` e origem da posição `'cadastro'|'telemetria'|null`; manter `FonteDaPosicao` visual distinguindo telemetria/estimada/simulação. `Rastreamento` passa a expor `erro:string|null` e `atualizadoEm:string|null`. Coordenadas no mapa continuam `[longitude,latitude]`.

- [ ] Testar API vazia → estado vazio, 401 → login, 403 → erro de acesso, rede → erro/retry; nenhum desses casos gera caminhões simulados. Demo só após escolha explícita no modo autorizado.
- [ ] Testar mesmo ID com novo status, origem, destino, posição ou estimativa: modelo atualiza. Cache somente geometria por par de coordenadas; dados da entrega não ficam congelados pela chave de IDs.
- [ ] Usar paradas válidas do backend; fallback de destino pelo detalhe da requisição. OSRM permanece fonte separada da geometria viária, com fallback estimado rotulado.
- [ ] Consultar histórico por veículo para identificar leitura/timestamp (reaproveitar T9 se disponível); coordenada cadastral sozinha não recebe rótulo “telemetria”. Mostrar idade do dado sem inventar limite de frescor que API não publicou.
- [ ] Não rejeitar genericamente `(0,0)` como coordenada inválida; usar procedência/disponibilidade. Se sinal estiver fora do trajeto, mostrar posição reportada separada de estimativa, sem fingir GPS ao projetar origem fixa.
- [ ] Rodar `npm run test -- src/features/rastreamento`; implementar/repetir, lint/typecheck e commit futuro.

**Aceite:** botão Atualizar muda posição/status reais, ausência de dados é honesta, demonstração continua acessível separadamente.

## T9 — Histórico, alertas e diagnóstico de cadeia fria (P2)

**Modificar:** `src/features/cadeia-fria/pagina-da-cadeia-fria.tsx`, `grafico-de-temperatura.tsx`, `src/lib/api/tipos.ts`.
**Criar:** `src/features/cadeia-fria/filtro-de-periodo.tsx`, `telemetria-api.ts`, `painel-de-diagnostico.tsx`, `cadeia-fria.test.tsx`.

**Interfaces:** `buscarTelemetrias(veiculoId:number,periodo?:{de?:string;ate?:string}):Promise<LeituraDeTelemetria[]>`; datas em ISO 8601 com offset. Acrescentar aos tipos `lotesGravados`, `tamanhoMedioDoLote`, `tempoTotalDeGravacaoMs`, `capacidadeDaFila`, `quantidadeDeWorkers`. Não adicionar campo `entregaId` a LeituraDeTelemetria: o DTO de resposta atual não o expõe.

- [ ] Testar intervalo válido, de > ate impedido, conversão de horário local mantendo instante, vazio, erro e troca rápida entre veículos sem leitura antiga.
- [ ] Definir apresentação explícita das últimas 30 leituras do período; preservar acesso a tabela do período se necessário, sem dizer que gráfico mostra todas. Reusar histórico para procedência no mapa, deduplicando por veículo.
- [ ] Corrigir legenda “leituras recusadas” para capacidade da fila; mover diagnóstico avançado para seção recolhível/didática. 202 de ingestão não significa persistido; não criar formulário de envio manual para equipe operacional.
- [ ] Criar navegação contextual em alertas para entidade existente, tratando IDs nulos/404. Não adicionar botão resolver, pois não há endpoint.
- [ ] Rodar `npm run test -- src/features/cadeia-fria/cadeia-fria.test.tsx`, implementar/repetir, lint/typecheck e commit futuro.

## T10 — Complementos de dados e área didática (P2)

**Modificar:** `src/features/doacoes/formulario-de-doacao.tsx`, `pagina-de-doacoes.tsx`, `resultado-da-doacao.tsx`; `src/features/estoque/pagina-de-estoque.tsx`; `src/features/painel/pagina-do-painel.tsx`; `src/features/algoritmos/pagina-de-algoritmos.tsx`; navegação e README.
**Criar:** `src/features/doacoes/painel-de-doacao.tsx`, `doacoes.test.tsx`; `src/features/painel/indicadores-complementares.tsx`, `indicadores.test.tsx`; `src/features/algoritmos/algoritmos.test.tsx`.

- [ ] Após D04, adicionar `dataHora` opcional no registro, preservando offset; omitido mantém relógio do backend. Consultar doação histórica por ID e navegar às bolsas geradas, sem inventar edição/exclusão.
- [ ] Testar registro sem/com data, detalhe histórico, data de validade devolvida pelo servidor e 404. Data futura não deve receber regra inventada apenas no front; se proibida, contratar backend.
- [ ] Completar filtros de estado de bolsa com RECEBIDA/ARMAZENADA/DESPACHADA; incluir hospitais no seletor de unidade quando dados/escopo permitirem. Manter busca explicitamente limitada à página; busca global seria tarefa nova de backend.
- [ ] Exibir `porComponente`, `porHospital`, distribuição/estatísticas em detalhe recolhível; testar zero/uma amostra, unidade de tempo vinda da API e números finitos. Não inventar KPI derivado de amostra parcial.
- [ ] Mover AED para seção didática, consumir situação dinâmica e incluir filtro `unidadeId`; não dizer que FEFO/matriz/hash estão implementados. Seed só em build demo explicitamente autorizado e backend configurado, tratando 409 banco já populado e 422 recurso desabilitado.
- [ ] Rodar `npm run test -- src/features/doacoes src/features/painel src/features/algoritmos`, implementar/repetir, lint/typecheck e commit futuro.

## T11 — Validação integrada e entrega revisável

**Criar:** `playwright.config.ts`, `tests/e2e/acesso.spec.ts`, `administracao.spec.ts`, `fluxo-operacional.spec.ts`, `rastreamento.spec.ts`, `demonstracao.spec.ts`.
**Modificar:** scripts/configuração de testes se ainda necessário, README com matriz ambiente/auth/demo. Mocks em teste são permitidos; não são fonte de dados do aplicativo operacional.

- [ ] Rodar testes de componentes com respostas contratadas e e2e em ambiente descartável com backend autenticado. Criar contas/fixtures por setup técnico em banco de teste; não usar seed destrutivo ou banco compartilhado de trabalho.
- [ ] Fluxos: login dos quatro perfis; ADMIN cria/edita usuário; não ADMIN recebe 403 por API direta; doação → bolsa/estoque → requisição de dois itens → alocação (incluindo parcial) → entrega sem rota → calcular rota → despacho → transporte → conclusão.
- [ ] Verificar separadamente as limitações de B2: status da entrega não é prova de bolsa ENTREGUE. Se B2 estiver fora da entrega, registrar a limitação e não declarar rastreabilidade logística completa.
- [ ] Cobrir expiração durante edição, erro HTML do proxy, 409/422 concorrente, recurso removido 404, mais de 100 requisições, simulação só explícita e período sem leitura.
- [ ] Rodar `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`. Aceite: todos códigos zero; revisar teclado/foco de login, painéis, confirmações e navegação mobile.
- [ ] Verificar exportação estática `/login/` e `/usuarios/` abrindo diretamente. Para API na mesma origem, testar com proxy Nginx do ambiente ou configurar base explícita/CORS; `npm run start` sozinho só serve arquivos estáticos, não faz proxy.
- [ ] Backend: regressões existentes `AutenticacaoIT`, `AutenticacaoProducaoIT`, `AutenticacaoDesabilitadaIT`, `CadastroDeUsuarioIT`, `ConsultaDeUsuarioIT`, `AtualizacaoDeUsuarioIT`, `CadastrosIT`, `EntregaIT`, mais B0/B1/B2 implementadas. Ex.: `.\mvnw.cmd "-Dit.test=AutenticacaoIT,CadastroDeUsuarioIT,ConsultaDeUsuarioIT,AtualizacaoDeUsuarioIT,CadastrosIT,EntregaIT" test-compile failsafe:integration-test failsafe:verify`.
- [ ] JDK 25, Docker/PostgreSQL via Testcontainers são necessários para integração. `mvn verify` completo também inclui paridade C/Java via Python; seguir requisitos do README backend antes desse marco. Não executar testes do checkout de outra branch como evidência da dev.
- [ ] Revisar diff final, atualizar checklist e documentar pré-requisitos não entregues. Não publicar, fazer merge ou alterar ambiente nesta etapa de planejamento.

## Cobertura e limites de prontidão

| Achado/decisão | Tarefa responsável |
|---|---|
| G01 | T1/T2 |
| G02 | T3 |
| G03/G06 | T6 |
| G04/D06 | B1/T4 |
| G05 | T5 |
| G07 | T7 |
| G08 | T8 |
| G09/D01 | B0/T2 |
| G10/D03/D07 | B2/T5/T6 |
| D02/D05 | T2/T8/T10 |
| D04 | T10 |
| Consultas, indicadores e recursos técnicos | T9/T10, com exclusões justificadas na análise |

Pronto para detalhar/implementar após revisão: base HTTP, login conforme D02, usuários, veículos, requisição de vários itens/prioridade, planejamento/roteirização, paginação, mapa e consultas. Dependem de decisão/contrato adicional: autorização multiunidade, edição segura de unidades, cancelamentos avançados, invariantes de logística e política de data da coleta. Nenhuma dessas dependências deve ser apresentada como resolvida apenas por este plano.
