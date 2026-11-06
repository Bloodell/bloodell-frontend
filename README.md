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

Se o banco estiver vazio, clique em **Criar cenário sintético** na Visão geral
(só aparece em desenvolvimento): isso chama `POST /api/v1/demonstracoes/cenarios`
com a semente 42 e popula o sistema com dados sintéticos reproduzíveis.

### Demais comandos

```bash
npm run lint        # ESLint (regras do Next + React)
npm run typecheck   # TypeScript sem emitir arquivos
npm run build       # exportação estática em out/
npm run start       # serve o out/ localmente em http://127.0.0.1:4173
```

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
| `/requisicoes` | cria requisição, mostra a fila e processa a alocação com os passos reais (US06) |
| `/entregas` | planeja entregas para requisições alocadas e avança as etapas |
| `/cadeia-fria` | métricas de telemetria, temperatura por veículo, alertas e frota |
| `/unidades` | consulta e cadastro de hemocentros e hospitais sintéticos |
| `/algoritmos` | visualizador da lista, da fila e da pilha, com o conteúdo real dos nós |

O backend não disponibiliza login. Por isso a interface identifica o acesso como
**demonstração sem autenticação** em vez de mostrar um formulário de login que
daria uma falsa sensação de segurança.

## O que esta interface ainda não mostra — e por quê

Mapa, rota geográfica, ordenação por validade (FEFO) e matriz ABO/Rh **não
existem aqui**, porque os algoritmos correspondentes são da Unidade 2 e ainda não
foram implementados no backend. Desenhar essas telas agora com dado inventado
contrariaria tanto a restrição acadêmica quanto a regra de não mockar.

## Equipe

| Nome | E-mail institucional |
|---|---|
| Alisson Santana | ass6@cesar.school |
| Arthur Abelardo | aacc@cesar.school |
| Carlos Henrique | chcf@cesar.school |
| Danilo Diniz | dgds@cesar.school |
| Gabriel Andrade | gga3@cesar.school |
| Roberto Henrique | rhcf@cesar.school |
