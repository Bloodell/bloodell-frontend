import type { EntregaBase, PontoDaRede } from './modelo'

/**
 * SIMULACAO. Rede ficticia no Recife usada quando a API nao tem entregas em
 * andamento (ou quando o usuario pede a demonstracao). Os nomes sao genericos
 * de proposito: nao representam unidades reais. Tudo que sai daqui e marcado
 * como simulado na interface.
 */
export const REDE_SIMULADA: Record<string, PontoDaRede> = {
  hemocentroCentro: { id: 'sim-h1', nome: 'Hemocentro Centro', tipo: 'HEMOCENTRO', coordenada: [-34.8878, -8.0627] },
  hemocentroNorte: { id: 'sim-h2', nome: 'Hemocentro Norte', tipo: 'HEMOCENTRO', coordenada: [-34.9015, -8.0289] },
  hospitalSul: { id: 'sim-p1', nome: 'Hospital Zona Sul', tipo: 'HOSPITAL', coordenada: [-34.8993, -8.1142] },
  hospitalOeste: { id: 'sim-p2', nome: 'Hospital Zona Oeste', tipo: 'HOSPITAL', coordenada: [-34.9492, -8.0561] },
  hospitalLeste: { id: 'sim-p3', nome: 'Hospital Zona Leste', tipo: 'HOSPITAL', coordenada: [-34.8721, -8.0448] },
}

const R = REDE_SIMULADA

export function entregasSimuladas(): EntregaBase[] {
  const base = {
    simulada: true,
    posicaoReportada: null,
    distanciaKm: null,
    tempoEstimadoMin: null,
    iniciadaEm: null,
  } as const

  return [
    {
      ...base,
      id: 'sim-1',
      codigo: 'REQ-SIM-0001',
      placa: 'SIM-1A01',
      status: 'EM_TRANSPORTE',
      prioridade: 'EMERGENCIA',
      origem: R.hemocentroCentro,
      destino: R.hospitalSul,
      duracaoSimuladaS: 80,
      faseInicial: 0.18,
    },
    {
      ...base,
      id: 'sim-2',
      codigo: 'REQ-SIM-0002',
      placa: 'SIM-2B02',
      status: 'EM_TRANSPORTE',
      prioridade: 'URGENTE',
      origem: R.hemocentroNorte,
      destino: R.hospitalLeste,
      duracaoSimuladaS: 95,
      faseInicial: 0.55,
    },
    {
      ...base,
      id: 'sim-3',
      codigo: 'REQ-SIM-0003',
      placa: 'SIM-3C03',
      status: 'EM_TRANSPORTE',
      prioridade: 'ELETIVA',
      origem: R.hemocentroCentro,
      destino: R.hospitalOeste,
      duracaoSimuladaS: 110,
      faseInicial: 0.82,
    },
    {
      ...base,
      id: 'sim-4',
      codigo: 'REQ-SIM-0004',
      placa: 'SIM-4D04',
      status: 'DESPACHADA',
      prioridade: 'URGENTE',
      origem: R.hemocentroNorte,
      destino: R.hospitalOeste,
    },
  ]
}
