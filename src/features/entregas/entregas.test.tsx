import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Entrega, Requisicao, UsuarioAtual, Veiculo } from '@/lib/api/tipos'
import { criarApiFalsa, pagina, renderizarComSessao } from '../../../tests/api-falsa'
import { validarPlanejamento } from './entregas-api'
import { PaginaDeEntregas } from './pagina-de-entregas'

let parametros = new URLSearchParams()
const replace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/entregas',
  useSearchParams: () => parametros,
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }))

const LOGISTICA: UsuarioAtual = { id: 3, nome: 'Lia', email: 'lia@b.dev', perfil: 'LOGISTICA' }
const HEMOPE = { id: 10, tipo: 'HEMOCENTRO', nome: 'Hemope', cidade: 'Recife', uf: 'PE', latitude: -8.05, longitude: -34.9 }

function veiculo(id: number, status: Veiculo['status']): Veiculo {
  return { id, placa: `VEI${id}`, hemocentroBaseId: 10, hemocentroBaseNome: 'Hemope', capacidadeBolsas: 20, status, latitude: 0, longitude: 0 }
}

function requisicao(id: number): Requisicao {
  return {
    id,
    codigo: `REQ-${String(id).padStart(4, '0')}`,
    hospitalId: 20,
    hospitalNome: 'HR',
    prioridade: 'URGENTE',
    status: 'ALOCADA',
    criadaEm: '2026-11-17T10:00:00Z',
    atendidaEm: null,
    itens: [{ id: 1, componente: 'PLASMA', tipoSanguineo: 'A+', quantidade: 1, quantidadeAlocada: 1 }],
  }
}

function entrega(parcial: Partial<Entrega> = {}): Entrega {
  return {
    id: 50,
    requisicaoId: 1,
    requisicaoCodigo: 'REQ-0001',
    veiculoId: 1,
    veiculoPlaca: 'VEI1',
    origemId: 10,
    origemNome: 'Hemope',
    status: 'PLANEJADA',
    rota: null,
    distanciaKm: null,
    tempoEstimadoMin: null,
    iniciadaEm: null,
    concluidaEm: null,
    ...parcial,
  }
}

function apiBase() {
  return criarApiFalsa({
    'GET /entregas': [],
    'GET /veiculos': [veiculo(1, 'DISPONIVEL'), veiculo(2, 'EM_ROTA')],
    'GET /hemocentros': [HEMOPE],
    'GET /requisicoes?status=ALOCADA&page=0&size=20': pagina([requisicao(1)], 0, 20, 21),
    'GET /requisicoes?status=ALOCADA&page=1&size=20': pagina([requisicao(121)], 1, 20, 21),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  parametros = new URLSearchParams()
  replace.mockReset()
})

describe('planejamento — regras', () => {
  it('distancia_zero_ok_tempo_zero_ou_decimal_nao', () => {
    expect(validarPlanejamento({ distanciaKm: '0', tempoEstimadoMin: '' })).toEqual({})
    expect(validarPlanejamento({ distanciaKm: '-1', tempoEstimadoMin: '0' })).toEqual({
      distanciaKm: expect.any(String),
      tempoEstimadoMin: expect.any(String),
    })
    expect(validarPlanejamento({ distanciaKm: '', tempoEstimadoMin: '12.5' }).tempoEstimadoMin).toBeDefined()
  })
})

describe('PaginaDeEntregas', () => {
  it('cria_sem_rota_e_so_com_veiculo_disponivel_alcancando_a_pagina_2', async () => {
    const api = apiBase()
    api.definir('POST /entregas', (corpo) => ({ status: 201, corpo: entrega({ id: 60, ...(corpo as object) }) }))
    api.definir('GET /entregas/60', entrega({ id: 60 }))
    await renderizarComSessao(<PaginaDeEntregas />, LOGISTICA, api)
    const usuario = userEvent.setup()

    await usuario.click(screen.getAllByRole('button', { name: 'Planejar entrega' })[0])
    const painel = await screen.findByRole('dialog')
    await usuario.click(await within(painel).findByRole('button', { name: 'Próximas requisições' }))
    await usuario.click(await within(painel).findByText('REQ-0121'))

    const seletorDeVeiculo = within(painel).getByLabelText('Veículo')
    expect(within(seletorDeVeiculo).queryByText(/VEI2/)).not.toBeInTheDocument()
    await usuario.selectOptions(seletorDeVeiculo, '1')
    await usuario.click(within(painel).getByRole('button', { name: 'Planejar entrega' }))

    await waitFor(() =>
      expect(api.chamadas('POST /entregas')).toEqual([
        { requisicaoId: 121, veiculoId: 1, origemId: 10, rota: null, distanciaKm: null, tempoEstimadoMin: null },
      ]),
    )
  })

  it('requisicao_com_entrega_ativa_fica_desabilitada', async () => {
    const api = apiBase()
    api.definir('GET /entregas', [entrega({ requisicaoId: 1 })])
    await renderizarComSessao(<PaginaDeEntregas />, LOGISTICA, api)
    const usuario = userEvent.setup()

    await usuario.click(screen.getAllByRole('button', { name: 'Planejar entrega' })[0])
    const painel = await screen.findByRole('dialog')
    const opcao = await within(painel).findByRole('radio', { name: /REQ-0001/ })
    expect(opcao).toBeDisabled()
  })

  it('calcular_rota_mostra_paradas_e_distancia_em_linha_reta', async () => {
    const api = apiBase()
    api.definir('GET /entregas', [entrega()])
    let atual = entrega()
    api.definir('GET /entregas/50', () => ({ corpo: atual }))
    api.definir('POST /entregas/50/roteirizacao', () => {
      atual = entrega({
        distanciaKm: 2.345,
        rota: JSON.stringify({
          paradas: [
            { ordem: 0, tipo: 'HEMOCENTRO', unidadeId: 10, nome: 'Hemope', latitude: -8.05, longitude: -34.9 },
            { ordem: 1, tipo: 'HOSPITAL', unidadeId: 20, nome: 'HR', latitude: -8.06, longitude: -34.88 },
          ],
        }),
      })
      return { corpo: atual }
    })
    parametros = new URLSearchParams('entrega=50')
    await renderizarComSessao(<PaginaDeEntregas />, LOGISTICA, api)
    const usuario = userEvent.setup()

    const painel = await screen.findByRole('dialog')
    await usuario.click(await within(painel).findByRole('button', { name: 'Calcular rota' }))

    expect(await within(painel).findByText('Destino', { exact: false })).toBeInTheDocument()
    expect(within(painel).getByText('2,3 km')).toBeInTheDocument()
    expect(within(painel).getByText('em linha reta')).toBeInTheDocument()
    expect(api.chamadas('POST /entregas/50/roteirizacao')).toEqual([undefined])
  })

  it('ajustar_tempo_preserva_rota_existente', async () => {
    const rota = JSON.stringify({ paradas: [] })
    const api = apiBase()
    api.definir('GET /entregas', [entrega({ rota, distanciaKm: 3 })])
    api.definir('GET /entregas/50', entrega({ rota, distanciaKm: 3 }))
    api.definir('PUT /entregas/50', (corpo) => ({ corpo: entrega(corpo as Partial<Entrega>) }))
    parametros = new URLSearchParams('entrega=50')
    await renderizarComSessao(<PaginaDeEntregas />, LOGISTICA, api)
    const usuario = userEvent.setup()

    const painel = await screen.findByRole('dialog')
    expect(await within(painel).findByText('Rota indisponível')).toBeInTheDocument()
    await usuario.type(within(painel).getByLabelText(/Tempo \(min\)/), '25')
    await usuario.click(within(painel).getByRole('button', { name: 'Salvar planejamento' }))

    await waitFor(() => expect(api.chamadas('PUT /entregas/50')).toEqual([{ rota, distanciaKm: 3, tempoEstimadoMin: 25 }]))
  })

  it('erro_ao_avancar_nao_repete_e_reconcilia', async () => {
    const api = apiBase()
    api.definir('GET /entregas', [entrega()])
    api.definir('POST /entregas/50/despacho', () => ({ status: 422, corpo: { status: 422, title: 'Regra', detail: 'O veiculo VEI1 nao esta disponivel.' } }))
    await renderizarComSessao(<PaginaDeEntregas />, LOGISTICA, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Despachar' }))
    await waitFor(() => expect(api.chamadas('GET /entregas').length).toBeGreaterThan(1))
    expect(api.chamadas('POST /entregas/50/despacho')).toHaveLength(1)
  })
})
