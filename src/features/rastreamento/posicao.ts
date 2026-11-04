import type { EntregaNoMapa, EstadoDoVeiculo } from './modelo'

/** Velocidade media urbana usada quando a API nao informa o tempo previsto. */
const VELOCIDADE_MEDIA_KMH = 32
/** Telemetria a mais que isso da rota nao e confiavel para posicionar o veiculo nela. */
const DESVIO_MAXIMO_KM = 0.35

/** Tempo total previsto da entrega, em minutos. */
export function tempoPrevistoMin(entrega: EntregaNoMapa): number {
  if (entrega.tempoEstimadoMin && entrega.tempoEstimadoMin > 0) return entrega.tempoEstimadoMin
  return Math.max(1, Math.round((entrega.trajeto.comprimentoKm / VELOCIDADE_MEDIA_KMH) * 60))
}

/** Onde o veiculo esta agora e de onde vem essa informacao. */
export function estadoDoVeiculo(entrega: EntregaNoMapa, agora: number): EstadoDoVeiculo {
  const { trajeto } = entrega
  const noPonto = (progresso: number, emMovimento: boolean, fonte: EstadoDoVeiculo['fonte']): EstadoDoVeiculo => {
    const { coordenada, rumo } = trajeto.pontoEm(progresso)
    return { progresso, coordenada, rumo, emMovimento, fonte }
  }

  if (entrega.simulada) {
    if (entrega.status !== 'EM_TRANSPORTE') return noPonto(0, false, 'simulacao')
    const ciclo = ((entrega.faseInicial ?? 0) + agora / 1000 / (entrega.duracaoSimuladaS ?? 90)) % 1
    return noPonto(ciclo, true, 'simulacao')
  }

  if (entrega.status !== 'EM_TRANSPORTE') {
    return noPonto(0, false, entrega.posicaoReportada ? 'telemetria' : 'estimada')
  }

  if (entrega.posicaoReportada) {
    const { fracao, desvioKm } = trajeto.projetar(entrega.posicaoReportada)
    if (desvioKm <= DESVIO_MAXIMO_KM) return noPonto(fracao, true, 'telemetria')
  }

  // Sem GPS utilizavel: estima pelo horario de inicio e pelo tempo previsto.
  const inicio = entrega.iniciadaEm ? Date.parse(entrega.iniciadaEm) : NaN
  const previsto = tempoPrevistoMin(entrega) * 60_000
  const progresso = Number.isFinite(inicio) ? Math.min(0.98, Math.max(0, (agora - inicio) / previsto)) : 0
  return noPonto(progresso, true, 'estimada')
}

/** Minutos ate a chegada, ou null quando nao ha como calcular. */
export function etaEmMin(entrega: EntregaNoMapa, estado: EstadoDoVeiculo): number | null {
  if (entrega.status === 'PLANEJADA' || entrega.status === 'DESPACHADA') return null
  return Math.max(0, Math.round(tempoPrevistoMin(entrega) * (1 - estado.progresso)))
}

export function distanciaRestanteKm(entrega: EntregaNoMapa, estado: EstadoDoVeiculo): number {
  return entrega.trajeto.comprimentoKm * (1 - estado.progresso)
}
