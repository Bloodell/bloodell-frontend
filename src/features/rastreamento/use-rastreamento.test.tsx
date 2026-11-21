import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Entrega, Requisicao } from '@/lib/api/tipos'
import { criarApiFalsa } from '../../../tests/api-falsa'
import type { EntregaBase, EntregaNoMapa } from './modelo'
import { estadoDoVeiculo } from './posicao'
import { Trajeto } from './trajeto'
import { assinaturaDasBases, coordenadaValida, entregasDaApi, useRastreamento } from './use-rastreamento'

vi.mock('./rotas', () => ({
  obterRota: vi.fn(async (a: [number, number], b: [number, number]) => ({ coordenadas: [a, b], fonte: 'estimada' })),
}))

const HEMOPE = { id: 10, tipo: 'HEMOCENTRO' as const, nome: 'Hemope', cidade: 'Recife', uf: 'PE', latitude: -8.05, longitude: -34.9 }
const HR = { id: 20, tipo: 'HOSPITAL' as const, nome: 'HR', cidade: 'Recife', uf: 'PE', latitude: -8.06, longitude: -34.88 }

function entrega(parcial: Partial<Entrega> = {}): Entrega {
  return {
    id: 1,
    requisicaoId: 300,
    requisicaoCodigo: 'REQ-0300',
    veiculoId: 7,
    veiculoPlaca: 'VEI7',
    origemId: 10,
    origemNome: 'Hemope',
    status: 'EM_TRANSPORTE',
    rota: null,
    distanciaKm: null,
    tempoEstimadoMin: 30,
    iniciadaEm: '2026-11-17T10:00:00Z',
    concluidaEm: null,
    ...parcial,
  }
}

const REQ: Requisicao = {
  id: 300,
  codigo: 'REQ-0300',
  hospitalId: 20,
  hospitalNome: 'HR',
  prioridade: 'EMERGENCIA',
  status: 'EM_ROTA',
  criadaEm: '2026-11-17T09:00:00Z',
  atendidaEm: null,
  itens: [],
}

afterEach(() => vi.unstubAllGlobals())

describe('montagem das entregas', () => {
  it('requisicao_fora_da_primeira_pagina_entra_no_mapa_por_id', () => {
    const { bases } = entregasDaApi([entrega()], [HEMOPE], [HR], new Map([[300, REQ]]), new Map())
    expect(bases).toHaveLength(1)
    expect(bases[0].destino.nome).toBe('HR')
    expect(bases[0].prioridade).toBe('EMERGENCIA')
  })

  it('destino_vem_das_paradas_quando_a_requisicao_falta', () => {
    const rota = JSON.stringify({
      paradas: [
        { ordem: 0, tipo: 'HEMOCENTRO', unidadeId: 10, nome: 'Hemope', latitude: -8.05, longitude: -34.9 },
        { ordem: 1, tipo: 'HOSPITAL', unidadeId: 20, nome: 'HR (rota)', latitude: -8.06, longitude: -34.88 },
      ],
    })
    const { bases, semLocal } = entregasDaApi([entrega({ rota })], [HEMOPE], [], new Map(), new Map())
    expect(bases[0].destino.nome).toBe('HR (rota)')
    expect(semLocal).toEqual([])
  })

  it('sem_destino_localizavel_vira_pendencia_identificada', () => {
    const { bases, semLocal } = entregasDaApi([entrega()], [HEMOPE], [HR], new Map(), new Map())
    expect(bases).toHaveLength(0)
    expect(semLocal).toEqual(['REQ-0300'])
  })

  it('so_telemetria_vira_posicao_reportada', () => {
    const sem = entregasDaApi([entrega()], [HEMOPE], [HR], new Map([[300, REQ]]), new Map()).bases[0]
    expect(sem.posicaoReportada).toBeNull()
    const com = entregasDaApi(
      [entrega()],
      [HEMOPE],
      [HR],
      new Map([[300, REQ]]),
      new Map([[7, { coordenada: [-34.89, -8.055], registradaEm: '2026-11-17T10:10:00Z' }]]),
    ).bases[0]
    expect(com.posicaoReportada).toEqual([-34.89, -8.055])
    expect(com.posicaoRegistradaEm).toBe('2026-11-17T10:10:00Z')
  })

  it('coordenada_zero_nao_e_rejeitada', () => {
    expect(coordenadaValida([0, 0])).toBe(true)
    expect(coordenadaValida([200, 0])).toBe(false)
  })

  it('mesmo_id_com_novo_status_muda_a_assinatura', () => {
    const antes = entregasDaApi([entrega({ status: 'DESPACHADA' })], [HEMOPE], [HR], new Map([[300, REQ]]), new Map()).bases
    const depois = entregasDaApi([entrega({ status: 'EM_TRANSPORTE' })], [HEMOPE], [HR], new Map([[300, REQ]]), new Map()).bases
    expect(assinaturaDasBases(antes)).not.toBe(assinaturaDasBases(depois))
  })
})

describe('posição do veículo', () => {
  function noMapa(base: Partial<EntregaBase>): EntregaNoMapa {
    const entregaBase = entregasDaApi([entrega()], [HEMOPE], [HR], new Map([[300, REQ]]), new Map()).bases[0]
    const completa = { ...entregaBase, ...base }
    return { ...completa, trajeto: new Trajeto([completa.origem.coordenada, completa.destino.coordenada]), fonteDaRota: 'estimada' }
  }

  it('antes_de_sair_e_estimada_mesmo_com_leitura', () => {
    const estado = estadoDoVeiculo(noMapa({ status: 'DESPACHADA', posicaoReportada: [-34.89, -8.055] }), Date.now())
    expect(estado.fonte).toBe('estimada')
  })

  it('leitura_longe_da_rota_vira_estimativa_e_informa_o_desvio', () => {
    const estado = estadoDoVeiculo(noMapa({ posicaoReportada: [-35.5, -8.5], posicaoRegistradaEm: '2026-11-17T10:10:00Z' }), Date.parse('2026-11-17T10:15:00Z'))
    expect(estado.fonte).toBe('estimada')
    expect(estado.leituraForaDaRotaKm).toBeGreaterThan(1)
  })
})

describe('useRastreamento', () => {
  it('api_vazia_mostra_vazio_e_nao_simula', async () => {
    criarApiFalsa({ 'GET /entregas': [], 'GET /hemocentros': [HEMOPE], 'GET /hospitais': [HR] })
    const { result } = renderHook(() => useRastreamento(false))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.modo).toBe('api')
    expect(result.current.entregas).toEqual([])
    expect(result.current.erro).toBeNull()
  })

  it('erro_da_api_nao_vira_simulacao', async () => {
    criarApiFalsa({
      'GET /entregas': () => ({ status: 503, corpo: { status: 503, title: 'x', detail: 'Banco indisponível.' } }),
      'GET /hemocentros': [HEMOPE],
      'GET /hospitais': [HR],
    })
    const { result } = renderHook(() => useRastreamento(false))
    await waitFor(() => expect(result.current.erro).toBe('Banco indisponível.'))
    expect(result.current.modo).toBe('api')
    expect(result.current.entregas).toEqual([])
  })

  it('entrega_ativa_com_requisicao_buscada_por_id_e_ultima_leitura', async () => {
    const api = criarApiFalsa({
      'GET /entregas': [entrega()],
      'GET /hemocentros': [HEMOPE],
      'GET /hospitais': [HR],
      'GET /requisicoes/300': REQ,
      [`GET /veiculos/7/telemetrias?de=${encodeURIComponent('2026-11-17T10:00:00Z')}`]: [
        { id: 2, veiculoId: 7, lat: -8.056, lon: -34.891, temperaturaC: 4, statusVeiculo: 'EM_ROTA', registradaEm: '2026-11-17T10:20:00Z', recebidaEm: '2026-11-17T10:20:01Z', dentroDaFaixaDidatica: true },
        { id: 1, veiculoId: 7, lat: -8.051, lon: -34.899, temperaturaC: 4, statusVeiculo: 'EM_ROTA', registradaEm: '2026-11-17T10:05:00Z', recebidaEm: '2026-11-17T10:05:01Z', dentroDaFaixaDidatica: true },
      ],
    })
    const { result } = renderHook(() => useRastreamento(false))
    await waitFor(() => expect(result.current.entregas).toHaveLength(1))
    expect(result.current.entregas[0].posicaoReportada).toEqual([-34.891, -8.056])
    expect(api.chamadas('GET /requisicoes?size=100')).toHaveLength(0)
  })
})
