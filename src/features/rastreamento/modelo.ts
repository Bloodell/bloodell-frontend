import type { Prioridade, StatusEntrega } from '@/lib/api/tipos'
import type { Trajeto } from './trajeto'

/** [longitude, latitude] -- a ordem do GeoJSON e do MapLibre. */
export type Coordenada = [number, number]

export interface PontoDaRede {
  id: string
  nome: string
  tipo: 'HEMOCENTRO' | 'HOSPITAL'
  coordenada: Coordenada
}

/**
 * De onde vem a posicao do veiculo. Nunca se mistura:
 *   telemetria  posicao reportada pelo veiculo (dado real da API)
 *   estimada    calculada pelo horario de inicio e pelo tempo previsto (sem GPS)
 *   simulacao   movimento ficticio, so para demonstracao
 */
export type FonteDaPosicao = 'telemetria' | 'estimada' | 'simulacao'

export interface EntregaBase {
  id: string
  codigo: string
  placa: string
  status: StatusEntrega
  prioridade: Prioridade | null
  origem: PontoDaRede
  destino: PontoDaRede
  distanciaKm: number | null
  tempoEstimadoMin: number | null
  iniciadaEm: string | null
  /** Ultima posicao conhecida do veiculo (telemetria), quando a API a informa. */
  posicaoReportada: Coordenada | null
  simulada: boolean
  /** So na simulacao: quantos segundos o veiculo leva para cumprir a rota. */
  duracaoSimuladaS?: number
  /** So na simulacao: ponto do ciclo (0-1) em que o veiculo comeca. */
  faseInicial?: number
}

export interface EntregaNoMapa extends EntregaBase {
  trajeto: Trajeto
  /** estradas = rota por ruas (servico de roteamento); estimada = curva sem ruas. */
  fonteDaRota: 'estradas' | 'estimada'
}

export interface EstadoDoVeiculo {
  progresso: number
  coordenada: Coordenada
  rumo: number
  emMovimento: boolean
  fonte: FonteDaPosicao
}

export const STATUS_ATIVOS: StatusEntrega[] = ['PLANEJADA', 'DESPACHADA', 'EM_TRANSPORTE']

export function ehUrgente(prioridade: Prioridade | null): boolean {
  return prioridade === 'EMERGENCIA' || prioridade === 'URGENTE'
}
