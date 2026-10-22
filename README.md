# BLOODELL — frontend

Interface web do BLOODELL, projeto integrador do 3º semestre de Análise e
Desenvolvimento de Sistemas — CESAR School — 2026.2.

> **Aviso acadêmico.** Todos os dados são sintéticos. As regras de compatibilidade
> sanguínea são didáticas e **não constituem orientação clínica**.

Backend em repositório separado: `bloodell-backend`.

## Tecnologias

React 19 · Vite 7 · TypeScript · React Router · Recharts.

Estilo em CSS próprio com tokens (`src/estilos/tokens.css`) — sem framework de UI.
Para o tamanho deste projeto, um arquivo de tokens dá consistência sem trazer uma
dependência a mais para manter.

## Regra que não se quebra: a interface consome a API real

Nenhuma tela usa dado mockado. Se a API não respondeu, a tela diz isso — nunca
mostra número inventado no lugar. Todo consumo passa por `useRecurso`, que
entrega os três estados que uma tela precisa tratar: **carregando**, **erro** e
**vazio**.

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

Se o banco estiver vazio, clique em **Criar cenário de demonstração** no painel:
isso chama `POST /api/v1/demonstracoes/cenarios` com a semente 42 e popula o
sistema com dados sintéticos reproduzíveis.

### Demais comandos

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript sem emitir arquivos
npm run build       # build de produção em dist/
npm run preview     # serve o dist/ localmente
```

## Como a interface fala com a API

Em desenvolvimento, o Vite faz proxy de `/api` para `http://127.0.0.1:8080`
(`vite.config.ts`). Navegador e API ficam na mesma origem, então o dia a dia não
depende de CORS. O backend mantém o CORS configurado para o caso de as origens
serem diferentes no deploy.

`VITE_API_BASE_URL` é a única variável, e vale `/api/v1` por padrão. **Tudo que
começa com `VITE_` vai para o pacote público do navegador** — nunca coloque senha
ou chave privada aí.

Erros: a API responde sempre no mesmo envelope (RFC 7807). O `ErroDaApi` em
`src/api/cliente.ts` transforma isso em uma mensagem pronta para a tela,
incluindo os erros de campo quando existem.

## Telas

### Interface baseada na concept art

A interface usa os tokens de `src/estilos/tokens.css` e os ajustes de
`src/estilos/refino.css`, com sidebar responsiva, ícones SVG próprios, cards,
gráficos e tabelas. Os indicadores, as entregas, os alertas e a rastreabilidade
consultam a API real. A busca do estoque filtra **a página carregada**; o backend
ainda não oferece busca textual entre todas as páginas.

O backend não disponibiliza login nem uma sessão de usuário. Por isso a interface
identifica o acesso como **demonstração sem autenticação** em vez de mostrar um
formulário de login que daria uma falsa sensação de segurança. Também não existe
uma API de geometria ou localização em tempo real para desenhar o mapa da concept
art: a tela de entregas mostra rota planejada em texto e o estado real da entrega.

| Rota | O que mostra |
|---|---|
| `/` | painel descritivo: estoque por tipo, demanda por hospital, tempos de atendimento |
| `/estoque` | posição de estoque e bolsas na ordem de chegada |
| `/entregas` | planeja entregas para requisições alocadas e acompanha suas etapas |
| `/cadeia-fria` | alertas, histórico de temperatura e cadastro da frota |
| `/doacoes` | registra doação e mostra as bolsas geradas |
| `/requisicoes` | cria requisição, mostra a fila e processa a alocação com os passos reais |
| `/algoritmos` | visualizador da lista, da fila e da pilha, com o conteúdo real dos nós |
| `/unidades` | consulta e cadastro de hemocentros e hospitais sintéticos |

## Identidade visual

| Token | Valor | Uso |
|---|---|---|
| `--verde-principal` | `#0F5132` | navegação, títulos, ações primárias |
| `--verde-secundario` | `#22C55E` | disponibilidade, foco, séries positivas |
| `--vermelho-destaque` | `#DC2626` | sangue, urgência, alerta |
| `--fundo` | `#F8FAF9` | fundo da aplicação |
| `--texto` | `#1F2937` | texto principal |

Tipografia Inter. **Nenhuma informação é comunicada apenas por cor**: todo estado
tem rótulo em texto ao lado do indicador colorido. O foco do teclado é sempre
visível.

Prioridade de layout: notebook e telão (é assim que a apresentação acontece).
Abaixo de 860px o layout se adapta, mas mobile não é o alvo desta etapa.

## O que esta interface ainda não mostra — e por quê

Mapa, rota de entrega, ordenação por validade (FEFO) e matriz ABO/Rh **não
existem aqui**, porque os algoritmos correspondentes são da Unidade 2 e ainda não
foram implementados no backend. Desenhar essas telas agora com dado inventado
contrariaria tanto a restrição acadêmica quanto a regra de não mockar.

A tela de estruturas mostra, em `/algoritmos`, exatamente o que já existe e o que
continua pendente — a informação vem da própria API.

## Equipe

| Nome | E-mail institucional |
|---|---|
| _preencher_ | _@cesar.school_ |
