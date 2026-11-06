import { COMPONENTES } from './formatos'
import type { Tom } from './formatos'

export type SituacaoDaValidade = 'vencida' | 'atencao' | 'normal'

const DIA = 86_400_000

/**
 * Prazo total de uso da bolsa, em dias: coleta ate validade quando a API manda
 * as duas datas; senao, o prazo padrao do componente.
 */
export function prazoTotalEmDias(componente: string, dataColeta?: string, dataValidade?: string): number {
  if (dataColeta && dataValidade) {
    const dias = Math.round((Date.parse(dataValidade.slice(0, 10)) - Date.parse(dataColeta.slice(0, 10))) / DIA)
    if (dias > 0) return dias
  }
  return COMPONENTES.find((item) => item.valor === componente)?.validadeDias ?? 42
}

/**
 * "Perto de vencer" e relativo ao prazo do componente: sete dias e muito para
 * plaquetas (5 dias de vida), que ficariam sempre em alerta.
 */
export function situacaoDaValidade(diasParaVencer: number, prazoTotal: number): SituacaoDaValidade {
  if (diasParaVencer < 0) return 'vencida'
  const limite = Math.max(1, Math.min(7, Math.ceil(prazoTotal * 0.2)))
  return diasParaVencer <= limite ? 'atencao' : 'normal'
}

export function tomDaValidade(situacao: SituacaoDaValidade): Tom {
  return situacao === 'vencida' ? 'erro' : situacao === 'atencao' ? 'atencao' : 'sucesso'
}

export function textoDaValidade(diasParaVencer: number): string {
  if (diasParaVencer < 0) return `vencida há ${Math.abs(diasParaVencer)} d`
  if (diasParaVencer === 0) return 'vence hoje'
  return `vence em ${diasParaVencer} d`
}
