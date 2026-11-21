# BLOODELL — frontend

Interface web do BLOODELL, projeto integrador do 3º semestre de Análise e
Desenvolvimento de Sistemas — CESAR School — 2026.2.

> **Aviso acadêmico.** Todos os dados são sintéticos. As regras de compatibilidade
> sanguínea são didáticas e **não constituem orientação clínica**.

Backend em repositório separado: `bloodell-backend`.

## Tecnologias

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · componentes no padrão
shadcn/ui · ícones Lucide · Recharts · Sonner (toasts).

Os componentes de `src/components/ui/` seguem a estética e a API do shadcn/ui
(cantos suaves, bordas de 1px, muito espaço em branco), mas foram **escritos à
mão**, sem o gerador da CLI: o projeto não usa geradores de boilerplate.

## Regra que não se quebra: a interface consome a API real

Nenhuma tela usa dado mockado. Se a API não respondeu, a tela diz isso — nunca
mostra número inventado no lugar. Todo consumo passa por `useRecurso`, que
entrega os estados que uma tela precisa tratar: **carregando** (skeleton com a
forma do conteúdo), **erro** (mensagem real da API, com "Tentar novamente") e
**vazio** (o que fazer a seguir).

## De zero à interface rodando (≈ 5 minutos)

Pré-requisito: **Node 22 ou superior**. O backend precisa estar rodando em
`http://127.0.0.1:8080` (veja o README do `bloodell-backend`).

```bash
git clone <url-do-repo> bloodell-frontend
cd bloodell-frontend

cp .env.example .env.local     # opcional: os valores padrão já funcionam
npm ci
npm run dev
```

Abra `http://127.0.0.1:5173`.

### Dois modos: operação e demonstração

O modo é fixado no build por `NEXT_PUBLIC_MODO_APLICACAO`. Erro, 401 ou API fora
do ar **nunca** trocam o modo.

| | `operacao` (padrão) | `demonstracao` |
|---|---|---|
| Backend | autenticação ligada (`BLOODELL_AUTH_HABILITADA=true`, sempre em `prod`) | autenticação desligada, dados sintéticos |
| Login | obrigatório em toda tela (`/login`) | não existe |
| Usuários e vínculos | `/usuarios`, só ADMIN | não existe (o backend nega) |
| Simulação no mapa | não existe | só quando a pessoa clica em "Ver simulação" |
| Cenário sintético (semente 42) | não existe | botão na Visão geral, com o banco vazio |

Para rodar contra o backend local com autenticação, suba-o com
`BLOODELL_AUTH_HABILITADA=true`, um segredo JWT e o admin inicial
(`BLOODELL_ADMIN_INICIAL_*`, veja o README do backend). Para a apresentação sem
login, use `NEXT_PUBLIC_MODO_APLICACAO=demonstracao` no `.env.local`.

### Sessão

- O token fica **só em memória**: recarregar a página ou fechar a aba pede login
  de novo. Não há refresh token no backend.
- A sessão expira pelo `expiresIn` devolvido no login (15 min por padrão). Um 401
  em qualquer chamada autenticada encerra a sessão e leva ao login com aviso; o
  caminho atual é guardado para voltar depois.
- 403 **não** encerra a sessão: a tela diz que falta permissão.
- Ao voltar para a aba, `/auth/me` é reconsultado: se um admin mudou o perfil da
  conta, menus e acessos acompanham.
- Sair (ou trocar de conta) descarta toda resposta pendente da sessão anterior.

### Demais comandos

```bash
npm run lint        # ESLint (regras do Next + React)
npm run typecheck   # TypeScript sem emitir arquivos
npm run test        # Vitest + Testing Library (unidade e telas, API falsa)
npm run test:e2e    # Playwright no navegador, contra o next dev e API simulada
npm run build       # exportação estática em out/
npm run start       # serve o out/ localmente em http://127.0.0.1:4173
```

Na primeira vez, `npx playwright install chromium` baixa o navegador dos testes
e2e. Mocks existem **só nos testes** (`tests/api-falsa.tsx` e
`tests/e2e/api-simulada.ts`); o aplicativo continua consumindo apenas a API real.

`npm run start` só serve arquivos estáticos: não faz proxy de `/api`. Para testar
o `out/` com a API, use o Nginx do ambiente (mesma origem) ou configure
`NEXT_PUBLIC_API_BASE_URL` absoluto e CORS no backend.

## Deploy

`next.config.ts` usa `output: 'export'`: o build gera **arquivos estáticos** em
`out/`, um `index.html` por rota (`/estoque/index.html` etc.). O Nginx da EC2
serve essa pasta exatamente como servia o `dist/` do Vite — o modelo de deploy
não mudou. Não há servidor Node em produção.

## Como a interface fala com a API

Em desenvolvimento, o Next faz rewrite de `/api` (e do Swagger) para
`BACKEND_URL`, que vale `http://127.0.0.1:8080`. Navegador e API ficam na mesma
origem, então o dia a dia não depende de CORS.

`NEXT_PUBLIC_API_BASE_URL` vale `/api/v1` por padrão. **Tudo que começa com
`NEXT_PUBLIC_` vai para o pacote público do navegador** — nunca coloque senha ou
chave privada aí.

Erros: a API responde sempre no mesmo envelope (RFC 7807). O `ErroDaApi` em
`src/lib/api/cliente.ts` transforma isso em mensagem para a tela, e os erros de
validação por campo (`campos`) aparecem embaixo do campo correspondente no
formulário.

## Organização do código

```
src/
  app/                 rotas (uma pasta por página) e layout raiz
  features/<pagina>/   a tela e os componentes só dela (formulário, tabela, painel)
  components/
    ui/                primitivos no padrão shadcn: Button, Card, Badge, Input, Select, Table, Sheet…
    data-table/        TabelaDeDados, Paginacao, BarraDeFiltros, usePaginacaoLocal
    form/              Campo, Alerta, opções marcáveis, seletor de tipo sanguíneo, useEnvio
    feedback/          estados vazio/erro, AvisoAcademico, CartaoDeMetrica
    layout/            barra lateral, barra superior, cabeçalho de página, tema
  lib/
    api/               cliente HTTP, useRecurso e os tipos do contrato da API
    formatos.ts        rótulos legíveis dos enums, tons de status, datas e números
```

## Sistema visual

A identidade é definida por **papéis**, não por cores soltas (tokens em
`src/app/globals.css`). Nenhum papel divide matiz com outro:

| Papel | Cor | Uso |
|---|---|---|
| Marca | violeta | identidade e ação primária; nunca indica estado |
| Crítico | grená | emergência, bolsa vencida, temperatura fora da faixa, erro |
| Atenção | âmbar | vence em breve, fila urgente |
| Estável | verde | disponível, dentro da faixa, atendida |
| Cadeia fria | azul-gelo | temperatura, transporte refrigerado |

- **Nada depende só de cor**: todo estado tem ícone + texto (`Badge`, `Validade`).
  O Rh do tipo sanguíneo é bloco cheio (+) ou vazado (−); no gráfico, hachura.
- **Tipografia**: Instrument Sans na interface e JetBrains Mono nos dados (códigos,
  lotes, °C). A escala é nomeada (`text-apoio`, `text-rotulo`, `text-subtitulo`,
  `text-titulo`, `text-metrica`, `text-display`) e em `rem`; não use `text-[13px]`.
  O modo telão (`html[data-telao="true"]`) amplia a base para 125%.
- **Contraste**: `npm run contraste` confere os pares texto/fundo dos dois temas
  contra a WCAG AA e falha se algum ficar abaixo.
- **Referência viva**: a rota `/design` mostra cores, escala, estados, tipo
  sanguíneo e a Etiqueta de Bolsa (valores ilustrativos, sem API).

## Central logística (`/rastreamento`)

Mapa 3D isométrico das entregas em andamento: MapLibre GL JS para a base e as rotas,
Three.js para os caminhões (modelo procedural de ~60 triângulos, sem arquivo GLB),
Turf.js para comprimento, rumo e projeção sobre a rota. O código está em
`src/features/rastreamento/`.

**De onde vem cada dado** (nada é apresentado como mais real do que é):

| Dado | Origem |
|---|---|
| Hemocentros, hospitais, requisições, entregas, veículos, status | API (`/hemocentros`, `/hospitais`, `/requisicoes`, `/entregas`, `/veiculos`) |
| Geometria das rotas por ruas | Serviço de roteamento OSRM no navegador. O backend só calcula distância em linha reta (Haversine) e não guarda trajetos. Se o serviço não responde, a rota vira uma curva aproximada e a tela avisa |
| Posição do veículo | `telemetria` (última posição reportada, aceita se estiver a menos de 350 m da rota), `estimada` (pelo horário de início e tempo previsto, sem GPS) ou `simulacao` |
| Base do mapa (ruas, prédios 3D) | OpenFreeMap (tiles OpenMapTiles), reestilizada em `estilo-do-mapa.ts` |

- **Simulação**: sem entregas em andamento na API (ou com a API fora do ar), a tela
  exibe uma rede fictícia no Recife, marcada em todo lugar como **SIMULAÇÃO**
  (selo, faixa e texto no painel de detalhes). O botão "Ver simulação" força esse modo.
- **Servidor de rotas**: o OSRM público serve para demonstração e não tem garantia
  de disponibilidade. Em produção, use uma instância própria
  (`NEXT_PUBLIC_ROUTING_URL`, veja `.env.example`).
- **Nginx/CSP**: se a EC2 definir `Content-Security-Policy`, o mapa precisa de
  `worker-src blob:`, `img-src data: blob:` e `connect-src` para
  `tiles.openfreemap.org` e para o servidor de rotas.
- **Robustez**: o mapa só carrega no cliente (`next/dynamic`, `ssr: false`), em um
  chunk próprio; sem WebGL a tela mostra só a lista e os indicadores; se o contexto
  WebGL é perdido, o mapa é recriado quando ele volta; `prefers-reduced-motion`
  desliga o fluxo animado nas rotas, o pulso do anel e a interpolação (a posição
  passa a atualizar uma vez por segundo).
- **Não há** árvores e mobiliário urbano individuais: a vegetação aparece como áreas
  (parques e matas) da base cartográfica.

## Padrões de interface

- **Tabelas**: `TabelaDeDados` recebe colunas declarativas e mostra skeleton com o
  desenho das colunas enquanto carrega. A paginação é numerada ("Mostrando 1–10
  de 55"). Bolsas e requisições são paginadas pela API; listas pequenas
  (unidades, frota, entregas) são paginadas no navegador.
- **Filtros**: ficam na barra acima da tabela, com contador e "Limpar filtros".
  Trocar um filtro volta para a primeira página.
- **Formulários**: validam no navegador com as mesmas regras dos DTOs do backend.
  O erro aparece depois da primeira tentativa de envio, embaixo do campo, e some
  quando o campo é corrigido. Sucesso gera um toast e, quando faz sentido, um
  cartão com o resultado (ex.: as bolsas geradas pela doação).
- **Detalhes sem trocar de página**: painel lateral (Sheet) para a rastreabilidade
  da bolsa e para os passos da alocação.
- **Tema**: claro e escuro (segue o sistema; o botão na barra superior alterna).
- **Acessibilidade**: nenhum estado é comunicado só por cor (todo ponto colorido
  tem texto ao lado), foco de teclado visível, link "Pular para o conteúdo" e
  `prefers-reduced-motion` respeitado.

## Telas

| Rota | O que mostra |
|---|---|
| `/` | visão geral: métricas, estoque por tipo, demanda por prioridade, entregas em rota, tempo de atendimento |
| `/estoque` | posição de estoque e bolsas na ordem de chegada, com filtros e rastreabilidade (US05) |
| `/doacoes` | registra doação, mostra as bolsas geradas e o histórico de doações |
| `/requisicoes` | requisição com vários itens, fila, alocação com os passos reais (US06), prioridade e cancelamento na fila |
| `/entregas` | planeja entregas, calcula a rota no backend, ajusta o planejamento e avança as etapas |
| `/cadeia-fria` | alertas, temperatura por veículo e período, frota editável e diagnóstico da ingestão (ADMIN) |
| `/unidades` | consulta de hemocentros e hospitais; cadastro e remoção para ADMIN |
| `/algoritmos` | visualizador da lista, da fila e da pilha, com o conteúdo real dos nós |
| `/login` | entrada da versão de operação (fora do chrome, sem dados) |
| `/usuarios` | contas da equipe, perfil e unidades vinculadas (só ADMIN) |

**Quem vê o quê.** O backend é quem autoriza: ADMIN tem acesso global; as demais
contas só enxergam as unidades vinculadas a elas (e o que depende delas:
estoque, requisições, entregas, veículos, alertas). A interface só esconde o que
o backend de fato restringe a ADMIN — usuários, cadastro de unidades,
diagnóstico da telemetria e cenário sintético. Esconder um botão nunca substitui
o 403 do servidor.

## O que esta interface ainda não faz — e por quê

Cada item depende de regra ou contrato que o backend ainda não tem. A tela
explica a limitação onde ela aparece, em vez de oferecer um botão que não
cumpriria o que promete.

| Ausente | Por quê | Depende de |
|---|---|---|
| Editar unidade | o `GET` não devolve logradouro, número, bairro e CEP; o `PUT` apagaria esses campos | B1 (backend) |
| Cancelar requisição alocada/em rota e cancelar entrega | o backend não devolve as bolsas ao estoque nem libera entrega/veículo ao cancelar | B2 (backend) |
| Data da coleta retroativa na doação | política de datas não decidida | D04 |
| Validar capacidade do veículo e origem das bolsas na entrega | regra inexistente no backend | B2 |
| Resolver alerta, resetar senha, excluir usuário, busca global de bolsas | não há endpoint | — |
| FEFO, matriz ABO/Rh, rota por ruas no backend | Unidade 2 da disciplina | — |

A distância da entrega é calculada pelo backend **em linha reta** (Haversine); o
traçado por ruas aparece só na Central logística, vindo de um serviço externo e
rotulado como tal.

## Equipe

| Nome | E-mail institucional |
|---|---|
| Alisson Santana | ass6@cesar.school |
| Arthur Abelardo | aacc@cesar.school |
| Carlos Henrique | chcf@cesar.school |
| Danilo Diniz | dgds@cesar.school |
| Gabriel Andrade | gga3@cesar.school |
| Roberto Henrique | rhcf@cesar.school |
