# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Operador de hemocentro** (primário): registra doações, consulta bolsas, estoque e validade, processa alocações e acompanha entregas e cadeia fria. Trabalha em balcão ou sala de operação, sob prazo (sangue vence, emergência não espera).
- **Atendente de hospital**: cria requisições de hemocomponentes e acompanha a fila e o atendimento.
- **Banca e professores** (público de primeira classe): avaliam o projeto integrador do 3º semestre de Análise e Desenvolvimento de Sistemas, CESAR School, 2026.2. A apresentação acontece em notebook e telão.

Fonte: story map da Release 1 do backend, README do frontend e confirmação do usuário. Papéis de logística (motorista, analista de cadeia fria) aparecem nas telas de entregas e cadeia fria; não foram confirmados como público separado.

## Product Purpose

BLOODELL é um sistema de gestão, distribuição e monitoramento de hemocomponentes numa rede de hemocentros e hospitais: doações geram bolsas, bolsas formam estoque, hospitais fazem requisições priorizadas (emergência, urgente, eletiva), o sistema aloca bolsas, e as entregas são acompanhadas junto da cadeia fria (telemetria de temperatura). Sucesso é o operador conseguir decidir e agir rápido, e a banca enxergar claramente o que o sistema faz e como.

## Positioning

Dois diferenciais, confirmados pelo usuário:

1. **Alocação explicável**: o backend devolve a decisão passo a passo, e a interface mostra por que cada bolsa foi escolhida para cada requisição.
2. **Estruturas de dados visíveis**: lista encadeada, fila de prioridade e pilha, implementadas à mão, aparecem na interface com o conteúdo real dos nós.

## Operating Context

- Frontend Next.js 16 (export estático, `output: 'export'`), React 19, Tailwind 4, componentes no padrão shadcn escritos à mão, Recharts, Sonner. Servido por Nginx na EC2; sem renderização no servidor.
- Consome o backend (`bloodell-backend`, repositório separado) em `http://127.0.0.1:8080`. Documentação da API em Swagger no mesmo host.
- Rotas: `/` (visão geral), `/estoque`, `/doacoes`, `/requisicoes`, `/entregas`, `/rastreamento`, `/cadeia-fria`, `/unidades`, `/algoritmos`.
- Prioridade de layout: notebook e telão. Mobile existe, mas não é o alvo principal.
- Demonstração: em desenvolvimento, `POST /api/v1/demonstracoes/cenarios` (semente 42) popula dados sintéticos reproduzíveis.

## Capabilities and Constraints

- **Dados sintéticos e regras didáticas**: nenhuma informação real de doador ou paciente; as regras de compatibilidade não constituem orientação clínica.
- **A interface consome a API real; nada é mockado.** Se a API falhou, a tela diz isso, com a mensagem real e "Tentar novamente". Os estados carregando, erro e vazio são sempre tratados. Exceção deliberada: a rota `/design` é uma página de referência de componentes com valores ilustrativos.
- **Ainda não existem no backend** (Unidade 2): FEFO, matriz de compatibilidade ABO/Rh e geometria de rotas por ruas (o backend só calcula distância em linha reta). A interface não deve desenhá-los com dado inventado.
- **Central logística** (`/rastreamento`): mapa 3D com coordenadas reais de unidades e veículos vindas da API. A geometria das ruas vem de um serviço de roteamento externo; sem GPS utilizável a posição é estimada, e a demonstração em movimento é sempre rotulada como SIMULAÇÃO.
- **Sem login nem sessão de usuário.** A interface se identifica como "demonstração sem autenticação".
- **Nenhum estado comunicado só por cor**: ícone e texto sempre acompanham.
- **Busca de estoque** filtra só a página carregada, pois o backend não tem busca textual entre páginas.
- **Em aberto**: o usuário ainda precisa de ideias para novas funcionalidades. Nada está decidido além do que o backend já expõe.

## Brand Commitments

- Nome do produto: Bloodell (README e metadados usam "BLOODELL"/"Bloodell").
- Idioma da interface: português do Brasil, em frases claras e sentence case.
- A identidade visual é decisão de design em andamento, não compromisso de marca: nenhuma concept art ou paleta obrigatória existe nos repositórios.

## Evidence on Hand

- README do frontend e do backend, ADRs e story map em `bloodell-backend/docs/`.
- Cenário sintético reproduzível (semente 42) via endpoint de demonstração.
- Não existem depoimentos, clientes reais, métricas reais nem concept art armazenada. Não inventar.

## Product Principles

1. **Decisão antes de contagem**: cada tela responde "o que preciso fazer agora?" antes de mostrar totais.
2. **Explicável por construção**: mostrar o porquê (decisão de alocação, nós das estruturas), não só o resultado.
3. **Honestidade de dados**: o que a API não entrega é dito como indisponível, nunca preenchido.
4. **Urgência legível**: validade, emergência e temperatura fora da faixa se distinguem à primeira vista e à distância (telão).
5. **Didático sem ser clínico**: reforçar que é projeto acadêmico sem repetir o aviso até virar ruído.

## Accessibility & Inclusion

- Nenhum estado só por cor; foco de teclado visível; link "Pular para o conteúdo"; `prefers-reduced-motion` respeitado.
- Meta de contraste WCAG AA nos temas claro e escuro, conferida por `npm run contraste`.
- Leitura à distância em telão é requisito de uso.
