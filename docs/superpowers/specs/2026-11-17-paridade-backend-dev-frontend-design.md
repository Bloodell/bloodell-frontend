# Análise de paridade: backend dev e frontend Bloodell

Data: 2026-11-17. Estado: proposta para revisão; nenhuma implementação autorizada ou realizada.

## Objetivo e bases

Completar o frontend para equipes autenticadas, preservando a demonstração separada (preferência expressa pelo usuário). Reaproveitar telas e componentes atuais, distinguir capacidades existentes no backend de capacidades que ainda exigem backend e preservar os avisos e limites acadêmicos do produto.

| Base | Referência examinada |
|---|---|
| Backend | `C:/dev/PI/bloodell-backend`, branch **dev local**, commit `5d8b7f1de83197ddae718b2c67f2cc7ba5bf4974` |
| Referência remota local | `origin/dev` em `d4cd3c23e3c7ac06bfe4ffaf970e366449f52887`; não houve fetch, portanto não se afirma que este seja o estado atual do servidor Git |
| Frontend | `C:/dev/PI/frontend/bloodell-frontend`, `feat/redesign-visual-componentes`, commit `407bb236efed6c20da89b89d5c0bc4861b7877b4`; árvore limpa antes dos documentos |
| Exclusões | Alterações da branch corrente do backend `fix/s-08-handlers-erros-http`, inclusive arquivos modificados/não rastreados, não foram usadas como capacidades da dev |

O backend foi extraído com `git archive dev` para diretório temporário, sem checkout. As referências `B:` abaixo são relativas a `src/main/java/br/edu/cesar/bloodell/` **nesse commit**; `F:` são relativas ao frontend. Para reproduzir uma evidência: `git -C C:/dev/PI/bloodell-backend show 5d8b7f1:src/main/java/br/edu/cesar/bloodell/<arquivo>`.

Método: inspeção estática de controllers, DTOs, services, estados de domínio, configuração de segurança, testes existentes, chamadas HTTP, formulários e componentes. “Implementado” significa que há integração no código, não que foi validada em execução. Não foram iniciados serviços, instaladas dependências ou executadas suítes. Nenhum `AGENTS.md` foi encontrado pela busca no workspace.

## Abordagem proposta

1. **Recomendada: completar por fluxos no frontend atual.** Preserva Next/React, exportação estática e componentes existentes. Primeiro acesso/contratos; depois usuários, cadastros, requisições, entregas e monitoramento. Reduz alterações simultâneas e permite entregas testáveis.
2. **Criar portal autenticado separado.** Separa a demonstração estruturalmente, mas duplica navegação, contratos e manutenção. Não há evidência de necessidade de outro aplicativo.
3. **Refazer navegação e telas antes de integrar.** Custo maior, adia os bloqueios reais e não resolve contratos ou permissões. Não recomendado.

A recomendação é técnica, ainda não uma escolha de implementação aprovada. Propõe-se separar demonstração por configuração de build e entrada explícita, sem criar outro projeto. A implementação deve esperar a revisão deste desenho e das decisões abaixo.

## Conclusões prioritárias

| ID | Evidência | Impacto / decisão |
|---|---|---|
| G01 | `B:config/ConfiguracaoSeguranca.java:56-84`, `F:src/lib/api/cliente.ts:34-41`, `F:src/components/layout/barra-superior.tsx` | Backend usa Bearer; frontend só GET/POST sem token, sem login e com identidade fixa “Demonstração”. Bloqueia uso autenticado. |
| G02 | `B:autenticacao/apresentacao/UsuarioController.java`, `UsuarioDtos.java`, `F:src/components/layout/navegacao.ts` | Cadastro, listagem paginada, detalhe e PATCH de usuários existem; não há tela, tipos ou métodos correspondentes no front. |
| G03 | `B:entrega/dominio/Entrega.java`, método `normalizarRota`; `F:src/features/entregas/formulario-de-entrega.tsx:61-66` | Front envia texto livre para `rota`; backend exige string contendo documento JSON. Texto não vazio é recusado; omitir rota funciona. |
| G04 | `B:unidade/apresentacao/UnidadeDtos.java`, `UnidadeService.atualizar/criarEndereco/paraResposta` | PUT substitui endereço, mas GET não devolve logradouro, número, bairro e CEP. Edição com campos visíveis pode apagar endereço. Depende de contrato de backend antes de habilitar edição. |
| G05 | `B:requisicao/apresentacao/RequisicaoDtos.java`, `F:src/features/requisicoes/formulario-de-requisicao.tsx:85-92` | API aceita lista de itens; formulário envia exatamente um. Edição de prioridade e cancelamento também ausentes. |
| G06 | `B:entrega/apresentacao/EntregaController.java:54-89`, `F:src/features/entregas/pagina-de-entregas.tsx` | Sem edição de planejamento, roteirização ou cancelamento; criar/despachar/iniciar/concluir já integrados. |
| G07 | `F:src/features/entregas/pagina-de-entregas.tsx:40`, `F:src/features/rastreamento/use-rastreamento.ts:74` | Consultas limitam requisições à primeira página de 100; entrega pode desaparecer do mapa ou não ser selecionável. |
| G08 | `F:src/features/rastreamento/use-rastreamento.ts`, `modelo.ts`, `posicao.ts` | Fallback automático para simulação; posição cadastral é tratada como telemetria; chave da rota só inclui IDs/modo e pode manter status/coordenadas antigos após atualizar. |
| G09 | `B:config/ConfiguracaoSeguranca.java:65-74`, busca por autorização no código da dev | Apenas `/usuarios/**` é restrito por perfil. Demais operações exigem autenticação, sem isolamento por unidade nessa base. Ocultar botões não estabelece autorização. |
| G10 | `B:alocacao/aplicacao/AlocacaoService.java`, `B:entrega/aplicacao/EntregaService.java`, `B:requisicao/aplicacao/RequisicaoService.java` | Cancelamento não libera bolsas/estoque; cancelamento direto de requisição não sincroniza entrega/veículo. Origem da alocação é o primeiro hemocentro, enquanto entrega aceita outra origem. São dependências de domínio, não simples botões. |

## Inventário dos endpoints e cobertura

Prefixo comum: `/api/v1`. GET de detalhe sem tela própria não implica necessariamente lacuna: listagens frequentemente já retornam a mesma representação. “Parcial” indica limitação concreta de fluxo ou apresentação.

| Área | Contrato disponível na dev | Cobertura no frontend / classificação |
|---|---|---|
| Autenticação | POST `/auth/login`; GET `/auth/me` | **Ausente**, destinado ao usuário. Token `{accessToken, tokenType, expiresIn, usuario}`; usuário `{id,nome,email,perfil}`. |
| Usuários | POST/GET `/usuarios`; GET/PATCH `/usuarios/{id}` | **Ausente**, administração. `page/size`, tamanho 1–100, ordem fixa por ID. Sem DELETE/reset de senha. |
| Hemocentros | GET/POST `/hemocentros`; GET/PUT/DELETE `/hemocentros/{id}` | **Parcial**: listagem/cadastro em `features/unidades`; detalhe individual, editar/excluir ausentes. Endereço completo não exposto. |
| Hospitais | GET/POST `/hospitais`; GET/PUT/DELETE `/hospitais/{id}` | Mesmo estado de hemocentros. Exclusão física apenas sem vínculos; conflito 409. |
| Doações | POST/GET `/doacoes`; GET `/doacoes/{id}` | **Implementado no fluxo principal**: cadastro, listagem, bolsas da última doação. **Parcial**: coleta usa horário padrão da API; sem seleção de doação histórica para detalhamento. |
| Bolsas | GET `/bolsas` com `status,componente,unidadeId,page,size`; GET `/bolsas/{id}` e `/{id}/rastreabilidade` | **Implementado**: paginação, filtros, histórico por bolsa. Busca textual é explicitamente só na página; não existe busca textual global no backend. Filtro omite RECEBIDA/ARMAZENADA/DESPACHADA. |
| Estoque | GET `/estoques` com `unidadeId,componente` | **Implementado**: posição agregada. Seletor do front lista apenas hemocentros; API aceita unidade. Não existe mutação direta de estoque. |
| Requisições | POST/GET `/requisicoes`; GET `/requisicoes/fila`; GET/PUT/DELETE `/requisicoes/{id}`; POST `/{id}/alocacoes` | **Parcial**: criação de um item, filtros/paginação, fila e alocação com diário existem. Faltam vários itens, detalhe persistente, prioridade e cancelamento. PUT altera **somente prioridade**. |
| Entregas | POST/GET `/entregas` (`status` opcional); GET/PUT/DELETE `/entregas/{id}`; POST `/{id}/roteirizacao`, `/despacho`, `/inicio-transporte`, `/conclusao` | **Parcial**: ciclo de avanço integrado, mas falta planejamento completo/cancelamento/roteirização; contrato de rota incompatível quando preenchido. DELETE cancela, não apaga. |
| Veículos | POST/GET `/veiculos` (`status` opcional); GET/PUT/DELETE `/veiculos/{id}` | **Parcial** em cadeia fria: cadastro/listagem. Sem edição/exclusão/filtro por status. Planejamento oferece até veículos indisponíveis. |
| Histórico de telemetria | GET `/veiculos/{id}/telemetrias?de=&ate=` | **Parcial**: histórico e gráfico existem; filtros por período ausentes. Gráfico limita apresentação às últimas 30 leituras. |
| Ingestão | POST `/telemetrias` → 202 e correlação | **Integração máquina/simulador**, não exige formulário operacional. Aceite não garante persistência; fila/workers gravam depois. |
| Métricas | GET `/telemetrias/metricas` | **Parcial**, diagnóstico/didático. Front usa 4 de 9 campos. Contagem recusada representa fila cheia, mas legenda diz formato inválido. |
| Alertas | GET `/alertas` | **Implementado** em painel/cadeia fria. Vínculos com veículo/entrega/bolsa disponíveis mas sem navegação contextual. Nenhum endpoint de resolução. GET também detecta/cria falhas de comunicação. |
| Indicadores | GET `/indicadores/estoque`, `/demanda`, `/tempos` | **Parcial na apresentação**: todos consumidos. Faltam estoque por componente, demanda por hospital e parte das estatísticas; não é falha do fluxo básico. |
| AED | GET `/algoritmos/estoque?unidadeId=`, `/fila`, `/historico`, `/situacao` | **Implementado como recurso didático**. Falta filtro de unidade na visualização de estoque; não precisa ir à navegação operacional principal. |
| Demonstração | POST `/demonstracoes/cenarios` | Botão somente em desenvolvimento, sem alinhamento explícito com modo de demo. Serviço exige configuração habilitada e banco sem unidades. Recurso didático, não provisionamento operacional. |
| Infraestrutura | health, OpenAPI/Swagger, migrations, workers, métricas internas, JWT/bootstrap admin | Recursos de operação técnica. Sem obrigação de criar telas para cada classe/endpoint. |

## Modelos, regras e permissões

### Acesso

- Perfis reais: `OPERADOR_HEMOCENTRO`, `USUARIO_HOSPITAL`, `LOGISTICA`, `ADMIN` (`B:autenticacao/dominio/Perfil.java`). Não há vínculo usuário–unidade na dev examinada.
- Com autenticação habilitada: login público, usuários ADMIN, health/docs GET públicos, restante autenticado. Sem auth: `/auth/**` e `/usuarios/**` negados; demais rotas abertas. `application-local.yml` permite compatibilidade sem auth; `application-prod.yml` força auth.
- JWT tem validade padrão de 15 minutos, configurável. `IdentidadeJwt` reconsulta usuário/perfil no banco. Não há refresh, logout remoto, inscrição pública, troca de senha ou exclusão de usuário.
- Cadastro: nome até 120, email até 160 normalizado, senha inicial mínimo 12 caracteres e máximo 72 bytes UTF-8. PATCH aceita só nome/email/perfil, rejeita null, campos extras e corpo sem alteração. Conflito de email/último admin retorna 409.
- Proposta inicial: sessão em memória, login novamente após reload/expiração; saída limpa estado local. Persistência de sessão é decisão de produto e arquitetura, não presumida. Um 403 não deve encerrar sessão automaticamente; reconsultar `/me` para atualizar perfil quando necessário.
- Para equipes com escopo real por unidade, a ausência de autorização granular é bloqueio de liberação: incorporar/validar trabalho de isolamento em backend separadamente. A existência desses arquivos em outra branch não significa disponibilidade na dev.

### Operação

- Doação: volume 100–1000 ml, pelo menos um componente, tipo no formato ABO/Rh. `dataHora` opcional; validade deriva da data de coleta. Sem atualizar/apagar doação por HTTP.
- Bolsa/estoque: efeitos de doação e alocação, não CRUD livre. Enum de estados não é autorização para criar ações sem endpoint. Histórico é leitura de eventos persistidos.
- Alocação: igualdade exata de tipo e componente, ordem de chegada, validade verificada; FEFO/matriz/hash continuam stubs (`ConfiguracaoAed`). Permite processar fora da ordem e registra isso. Pode marcar ALOCADA com atendimento parcial; interface deve mostrar solicitado/alocado por item, sem prometer reposição posterior automática.
- Requisição: prioridade muda apenas em NA_FILA. Cancelamento permitido pelo enum em CRIADA, NA_FILA, ALOCADA e EM_ROTA; estados finais não reabrem. **Proposta conservadora de primeira entrega:** expor cancelamento somente em CRIADA/NA_FILA; expandir após resolver G10.
- Entrega: exige requisição ALOCADA, nenhuma entrega ativa para ela, veículo DISPONIVEL e origem HEMOCENTRO. PUT altera apenas rota/distância/tempo, só PLANEJADA; não troca requisição, veículo ou origem. Distância >= 0; tempo inteiro > 0, ambos opcionais.
- Roteirização: persiste string JSON `{paradas:[{ordem,tipo,unidadeId,nome,latitude,longitude}]}` e distância Haversine origem–hospital; preserva tempo estimado. Não oferece geometria viária, trânsito ou otimização de múltiplas entregas.
- Transições: PLANEJADA → DESPACHADA → EM_TRANSPORTE → ENTREGUE. Cada um dos três estados ativos admite CANCELADA; não é exclusão física. Despacho muda requisição para EM_ROTA/veículo para EM_ROTA; conclusão atende requisição/libera veículo. Não há atualização correspondente de bolsas nesses métodos da dev.
- Veículo: editar/remover bloqueado em rota; placa normalizada e única; remoção com histórico retorna 409. Capacidade é campo cadastral, não foi localizada validação de capacidade no planejamento de entrega.
- Telemetria: faixa 2–6 °C é didática, não regra clínica por componente. Posição de veículo existe desde o cadastro; não prova leitura recente. Histórico fornece timestamps. Mapa operacional deve diferenciar posição recebida, estimativa e simulação explícita.

### Dependências que exigem backend ou decisão de produto

| ID | Decisão pendente | Proposta / efeito |
|---|---|---|
| D01 | Matriz de ações por perfil e quais unidades cada equipe acessa | Planejar backend antes de liberação multiunidade; front inicialmente espelha apenas restrições realmente existentes. |
| D02 | Sessão deve sobreviver a reload/fechar aba? | Memória por padrão na proposta. Se persistência for exigida, revisar armazenamento/arquitetura antes da tarefa de sessão. |
| D03 | Cancelar após alocação devolve bolsas? Como sincronizar entrega/requisição/veículo? | Não expor cancelamentos avançados até regra transacional e testes. Cancelamento da requisição na fila pode sair antes. |
| D04 | Coleta retroativa é permitida? | Campo opcional pode espelhar API; decisão sobre datas futuras/antigas requer validação de backend, atualmente não demonstrada. Não inventar limite. |
| D05 | Demo acessível a quem e em qual ambiente? | Build de demo separado, dados sintéticos, seleção explícita; nunca transformar 401/403/erro/vazio operacional em simulação. |
| D06 | Endereço completo em edição | Acrescentar campos ao DTO de resposta e testes de preservação; até lá bloquear edição, mantendo cadastro/listagem/exclusão já possíveis. |
| D07 | Origem, capacidade, bolsas na entrega e alocação parcial | Definir invariantes no backend antes de afirmar operação logística completa. Não deduzir origem segura só pelo primeiro hemocentro. |

Após revisão independente, ficam explícitas duas propostas para avaliação: (1) criação/despacho/conclusão permanecem disponíveis para desenvolvimento e homologação com dados sintéticos, mas a liberação logística para equipes operacionais aguarda B0 e B2; (2) o build de demonstração consome um backend dedicado com dados sintéticos, e a simulação local do mapa é uma opção separada, nunca substituição silenciosa da API. Não se propõe mockar todas as telas. Essas propostas não foram confirmadas pelo usuário e devem ser revistas antes da implementação/liberação correspondente.

## Critérios globais e limites

- Preservar exportação estática do Next; sem pressupor middleware, BFF, Server Actions ou servidor Node de produção.
- Novas telas seguem `src/app` + `src/features`, componentes atuais e tipos escritos manualmente; sem gerador de boilerplate.
- Autorização final permanece no backend. Ocultar menu administrativo melhora UX, não substitui 403 no servidor.
- Não usar resposta de outra sessão/entidade como dado atual. Limpar recursos no logout/troca de identidade e ignorar requisições antigas.
- Tratar 400 por campo, 401, 403, 404, 409, 422, 503 e erro de rede; não repetir mutações automaticamente.
- Separar dado sintético, estimado e recebido; preservar avisos acadêmicos e não declarar uso clínico pronto.
- Não implementar agora; alterações de backend descritas são pré-requisitos propostos, não realizadas.

O plano associado cobre cada Gxx e Dxx em tarefas e testes: `../plans/2026-11-17-paridade-backend-dev-frontend.md`.
