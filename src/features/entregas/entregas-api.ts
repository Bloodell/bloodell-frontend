import { api } from '@/lib/api/cliente'
import type { Entrega, StatusEntrega } from '@/lib/api/tipos'

export interface EntradaDeEntrega {
  requisicaoId: number
  veiculoId: number
  origemId: number
  /** Sempre null na criacao: a rota vem da roteirizacao do backend. */
  rota: null
  distanciaKm: number | null
  tempoEstimadoMin: number | null
}

export interface EntradaDePlanejamento {
  /** A rota existente e reenviada como veio, para o PUT nao apaga-la. */
  rota: string | null
  distanciaKm: number | null
  tempoEstimadoMin: number | null
}

export function criarEntrega(entrada: EntradaDeEntrega): Promise<Entrega> {
  return api.enviar<Entrega>('/entregas', entrada)
}

/** PUT so com a entrega PLANEJADA; nao troca requisicao, veiculo nem origem. */
export function atualizarPlanejamento(id: number, entrada: EntradaDePlanejamento): Promise<Entrega> {
  return api.substituir<Entrega>(`/entregas/${id}`, entrada)
}

/** Paradas origem -> hospital e distancia em linha reta (Haversine). Sem corpo. */
export function roteirizarEntrega(id: number): Promise<Entrega> {
  return api.enviar<Entrega>(`/entregas/${id}/roteirizacao`)
}

export const ETAPAS: StatusEntrega[] = ['PLANEJADA', 'DESPACHADA', 'EM_TRANSPORTE', 'ENTREGUE']

export const STATUS_ATIVOS_DA_ENTREGA: StatusEntrega[] = ['PLANEJADA', 'DESPACHADA', 'EM_TRANSPORTE']

/** Proxima etapa de cada situacao: endpoint, rotulo do botao e o que acontece. */
export const PROXIMA_ETAPA: Partial<Record<StatusEntrega, { caminho: string; rotulo: string; efeito: string }>> = {
  PLANEJADA: {
    caminho: 'despacho',
    rotulo: 'Despachar',
    efeito: 'A requisição e o veículo passam a constar como em rota.',
  },
  DESPACHADA: { caminho: 'inicio-transporte', rotulo: 'Iniciar transporte', efeito: 'Registra o horário de saída.' },
  EM_TRANSPORTE: {
    caminho: 'conclusao',
    rotulo: 'Concluir entrega',
    efeito: 'A requisição fica atendida e o veículo volta a ficar disponível.',
  },
}

export function avancarEntrega(entrega: Pick<Entrega, 'id' | 'status'>): Promise<Entrega> {
  const etapa = PROXIMA_ETAPA[entrega.status]
  if (!etapa) return Promise.reject(new Error('Entrega sem próxima etapa.'))
  return api.enviar<Entrega>(`/entregas/${entrega.id}/${etapa.caminho}`)
}

// --- Validacao do planejamento (PlanejamentoEntregaEntrada) ------------------

export interface ValoresDePlanejamento {
  distanciaKm: string
  tempoEstimadoMin: string
}

export function validarPlanejamento(valores: ValoresDePlanejamento): Partial<Record<keyof ValoresDePlanejamento, string>> {
  const erros: Partial<Record<keyof ValoresDePlanejamento, string>> = {}
  const distancia = valores.distanciaKm.trim()
  const tempo = valores.tempoEstimadoMin.trim()
  if (distancia !== '' && (!Number.isFinite(Number(distancia)) || Number(distancia) < 0))
    erros.distanciaKm = 'Distância em km, zero ou mais.'
  if (tempo !== '' && (!Number.isInteger(Number(tempo)) || Number(tempo) <= 0))
    erros.tempoEstimadoMin = 'Minutos inteiros, maior que zero.'
  return erros
}

/** Campo vazio vira null (opcional no backend). */
export function numeroOuNulo(valor: string): number | null {
  return valor.trim() === '' ? null : Number(valor)
}
