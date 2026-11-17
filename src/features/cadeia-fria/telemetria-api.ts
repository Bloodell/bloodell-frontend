import type { LeituraDeTelemetria } from '@/lib/api/tipos'

export interface Periodo {
  /** Valores de <input type="datetime-local">, no fuso de quem usa. */
  de: string
  ate: string
}

export const PERIODO_VAZIO: Periodo = { de: '', ate: '' }

/**
 * "2026-11-17T14:30" (hora local, sem fuso) vira um instante ISO 8601 com
 * offset (UTC). O instante e o mesmo; so a notacao muda.
 */
export function paraInstanteIso(valorLocal: string): string | null {
  if (!valorLocal) return null
  const data = new Date(valorLocal)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

export function validarPeriodo(periodo: Periodo): string | null {
  const de = paraInstanteIso(periodo.de)
  const ate = paraInstanteIso(periodo.ate)
  if (periodo.de && !de) return 'Data inicial inválida.'
  if (periodo.ate && !ate) return 'Data final inválida.'
  if (de && ate && de > ate) return 'O início precisa ser antes do fim.'
  return null
}

export function caminhoDoHistorico(veiculoId: number | string, periodo: Periodo): string {
  const parametros = new URLSearchParams()
  const de = paraInstanteIso(periodo.de)
  const ate = paraInstanteIso(periodo.ate)
  if (de) parametros.set('de', de)
  if (ate) parametros.set('ate', ate)
  const query = parametros.toString()
  return `/veiculos/${veiculoId}/telemetrias${query ? `?${query}` : ''}`
}

/**
 * A API devolve da mais recente para a mais antiga. Para o grafico, queremos
 * as N mais recentes em ordem cronologica.
 */
export function ultimasEmOrdem(leituras: LeituraDeTelemetria[], quantidade: number): LeituraDeTelemetria[] {
  return [...leituras]
    .sort((a, b) => Date.parse(a.registradaEm) - Date.parse(b.registradaEm))
    .slice(-quantidade)
}

export const LEITURAS_NO_GRAFICO = 30
