/**
 * Modo da aplicacao, fixado no build.
 *
 *   operacao       equipes autenticadas; toda tela exige login (padrao)
 *   demonstracao   apresentacao academica contra um backend com autenticacao
 *                  desligada e dados sinteticos; sem login nem gestao de contas
 *
 * Erro, 401 ou API fora do ar NUNCA trocam o modo: so o build decide.
 */
export type ModoDaAplicacao = 'operacao' | 'demonstracao'

export const MODO: ModoDaAplicacao =
  process.env.NEXT_PUBLIC_MODO_APLICACAO === 'demonstracao' ? 'demonstracao' : 'operacao'

export const EM_DEMONSTRACAO = MODO === 'demonstracao'
