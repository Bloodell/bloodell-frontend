import { api } from '@/lib/api/cliente'
import type { Prioridade, Requisicao, ResultadoDaAlocacao, StatusRequisicao, TipoComponente } from '@/lib/api/tipos'

export interface ItemRequisicaoEntrada {
  componente: TipoComponente
  tipoSanguineo: string
  quantidade: number
}

export interface EntradaDeRequisicao {
  hospitalId: number
  prioridade: Prioridade
  itens: ItemRequisicaoEntrada[]
}

export function criarRequisicao(entrada: EntradaDeRequisicao): Promise<Requisicao> {
  return api.enviar<Requisicao>('/requisicoes', entrada)
}

/** PUT so altera a prioridade, e so enquanto NA_FILA (senao 422). */
export function alterarPrioridade(id: number, prioridade: Prioridade): Promise<Requisicao> {
  return api.substituir<Requisicao>(`/requisicoes/${id}`, { prioridade })
}

/** DELETE cancela (nao apaga). */
export function cancelarRequisicao(id: number): Promise<void> {
  return api.remover(`/requisicoes/${id}`)
}

export function processarAlocacao(id: number): Promise<ResultadoDaAlocacao> {
  return api.enviar<ResultadoDaAlocacao>(`/requisicoes/${id}/alocacoes`)
}

// --- O que cada situacao permite ---------------------------------------------

/** Prioridade so muda na fila (regra do dominio). */
export function podeAlterarPrioridade(status: StatusRequisicao): boolean {
  return status === 'NA_FILA'
}

/**
 * O backend aceita cancelar tambem ALOCADA e EM_ROTA, mas hoje isso NAO
 * devolve as bolsas ao estoque nem sincroniza entrega e veiculo. Ate essa
 * regra existir (B2), a interface so cancela o que ainda nao reservou bolsa.
 */
export function podeCancelar(status: StatusRequisicao): boolean {
  return status === 'CRIADA' || status === 'NA_FILA'
}

export function podeProcessar(status: StatusRequisicao): boolean {
  return status === 'NA_FILA'
}

/** Resumo de atendimento por item: quanto falta de cada um. */
export function pendencias(requisicao: Pick<Requisicao, 'itens'>): { total: number; alocado: number; faltam: number } {
  const total = requisicao.itens.reduce((soma, item) => soma + item.quantidade, 0)
  const alocado = requisicao.itens.reduce((soma, item) => soma + Math.min(item.quantidadeAlocada, item.quantidade), 0)
  return { total, alocado, faltam: total - alocado }
}

// --- Itens do formulario ----------------------------------------------------

export interface ItemDoFormulario {
  /** Chave estavel no navegador; nao vai para a API. */
  chave: number
  componente: TipoComponente
  tipoSanguineo: string
  quantidade: string
}

export type ErrosDoItem = Partial<Record<'componente' | 'tipoSanguineo' | 'quantidade', string>>

export function validarItem(item: ItemDoFormulario): ErrosDoItem {
  const erros: ErrosDoItem = {}
  const quantidade = Number(item.quantidade)
  if (item.quantidade.trim() === '' || !Number.isInteger(quantidade) || quantidade < 1)
    erros.quantidade = 'Quantidade inteira, pelo menos 1 bolsa.'
  if (!/^(A|B|AB|O)[+-]$/.test(item.tipoSanguineo)) erros.tipoSanguineo = 'Escolha o tipo sanguíneo.'
  return erros
}

/**
 * "itens[1].quantidade" -> erro do item cuja chave estava na posicao 1 no
 * momento do envio. Assim, remover outro item depois nao desloca o erro.
 */
export function errosDaApiPorItem(
  errosDaApi: Record<string, string>,
  chavesNoEnvio: number[],
): { porItem: Record<number, ErrosDoItem>; gerais: Record<string, string> } {
  const porItem: Record<number, ErrosDoItem> = {}
  const gerais: Record<string, string> = {}
  for (const [campo, mensagem] of Object.entries(errosDaApi)) {
    const casamento = /^itens\[(\d+)\]\.(componente|tipoSanguineo|quantidade)$/.exec(campo)
    const chave = casamento ? chavesNoEnvio[Number(casamento[1])] : undefined
    if (casamento && chave !== undefined) {
      porItem[chave] = { ...porItem[chave], [casamento[2]]: mensagem }
    } else {
      gerais[campo] = mensagem
    }
  }
  return { porItem, gerais }
}
