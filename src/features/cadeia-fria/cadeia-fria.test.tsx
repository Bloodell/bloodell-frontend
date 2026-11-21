import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LeituraDeTelemetria, UsuarioAtual, Veiculo } from '@/lib/api/tipos'
import { criarApiFalsa, renderizarComSessao } from '../../../tests/api-falsa'
import { PaginaDaCadeiaFria } from './pagina-da-cadeia-fria'
import { caminhoDoHistorico, paraInstanteIso, ultimasEmOrdem, validarPeriodo } from './telemetria-api'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/cadeia-fria',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }))
// Recharts precisa de layout real; nos testes basta saber que o grafico montou.
vi.mock('./grafico-de-temperatura', () => ({
  GraficoDeTemperatura: ({ leituras }: { leituras: unknown[] }) => <p>gráfico com {leituras.length} leituras</p>,
}))

const ADMIN: UsuarioAtual = { id: 1, nome: 'Ana', email: 'ana@b.dev', perfil: 'ADMIN' }
const LOGISTICA: UsuarioAtual = { id: 3, nome: 'Lia', email: 'lia@b.dev', perfil: 'LOGISTICA' }
const HEMOPE = { id: 10, tipo: 'HEMOCENTRO', nome: 'Hemope', cidade: 'Recife', uf: 'PE', latitude: -8.05, longitude: -34.9 }

function veiculo(id: number, status: Veiculo['status'], placa = `ABC${id}D23`): Veiculo {
  return { id, placa, hemocentroBaseId: 10, hemocentroBaseNome: 'Hemope', capacidadeBolsas: 20, status, latitude: -8.05, longitude: -34.9 }
}

function leitura(id: number, registradaEm: string, temperaturaC = 4): LeituraDeTelemetria {
  return { id, veiculoId: 1, lat: 0, lon: 0, temperaturaC, statusVeiculo: 'EM_ROTA', registradaEm, recebidaEm: registradaEm, dentroDaFaixaDidatica: temperaturaC >= 2 && temperaturaC <= 6 }
}

function apiBase() {
  return criarApiFalsa({
    'GET /veiculos': [veiculo(1, 'DISPONIVEL'), veiculo(2, 'EM_ROTA')],
    'GET /alertas': [],
    'GET /hemocentros': [HEMOPE],
    'GET /telemetrias/metricas': {
      leiturasRecebidas: 10,
      leiturasPersistidas: 8,
      leiturasRecusadas: 2,
      lotesGravados: 3,
      tamanhoMedioDoLote: 3,
      tempoTotalDeGravacaoMs: 40,
      tamanhoAtualDaFila: 1,
      capacidadeDaFila: 100,
      quantidadeDeWorkers: 2,
    },
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('telemetria — regras', () => {
  it('converte_hora_local_mantendo_o_instante', () => {
    const iso = paraInstanteIso('2026-11-17T14:30')
    expect(iso).toBe(new Date('2026-11-17T14:30').toISOString())
    expect(caminhoDoHistorico(1, { de: '2026-11-17T14:30', ate: '' })).toBe(`/veiculos/1/telemetrias?de=${encodeURIComponent(iso as string)}`)
    expect(caminhoDoHistorico(1, { de: '', ate: '' })).toBe('/veiculos/1/telemetrias')
  })

  it('de_maior_que_ate_e_impedido', () => {
    expect(validarPeriodo({ de: '2026-11-18T00:00', ate: '2026-11-17T00:00' })).toMatch(/antes do fim/)
    expect(validarPeriodo({ de: '2026-11-16T00:00', ate: '2026-11-17T00:00' })).toBeNull()
  })

  it('grafico_usa_as_mais_recentes_em_ordem_cronologica', () => {
    // A API devolve da mais recente para a mais antiga.
    const daApi = [leitura(3, '2026-11-17T12:00:00Z'), leitura(2, '2026-11-17T11:00:00Z'), leitura(1, '2026-11-17T10:00:00Z')]
    expect(ultimasEmOrdem(daApi, 2).map((item) => item.id)).toEqual([2, 3])
  })
})

describe('PaginaDaCadeiaFria', () => {
  it('nao_admin_nao_pede_metricas_e_nao_ve_diagnostico', async () => {
    const api = apiBase()
    await renderizarComSessao(<PaginaDaCadeiaFria />, LOGISTICA, api)
    await screen.findByRole('button', { name: 'Editar ABC1D23' })
    expect(api.chamadas('GET /telemetrias/metricas')).toHaveLength(0)
    expect(screen.queryByText('Diagnóstico da ingestão')).not.toBeInTheDocument()
  })

  it('admin_ve_diagnostico_com_legenda_correta', async () => {
    const api = apiBase()
    await renderizarComSessao(<PaginaDaCadeiaFria />, ADMIN, api)
    expect(await screen.findByText('Diagnóstico da ingestão')).toBeInTheDocument()
    expect(screen.getByText('Recusadas por fila cheia')).toBeInTheDocument()
  })

  it('veiculo_em_rota_nao_pode_ser_editado_nem_removido', async () => {
    await renderizarComSessao(<PaginaDaCadeiaFria />, LOGISTICA, apiBase())
    expect(await screen.findByRole('button', { name: 'ABC2D23: edição indisponível em rota' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'ABC2D23: remoção indisponível em rota' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Editar ABC1D23' })).toBeEnabled()
  })

  it('editar_envia_put_com_cadastro_completo', async () => {
    const api = apiBase()
    api.definir('PUT /veiculos/1', (corpo) => ({ corpo: { ...veiculo(1, 'DISPONIVEL'), ...(corpo as object) } }))
    await renderizarComSessao(<PaginaDaCadeiaFria />, LOGISTICA, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Editar ABC1D23' }))
    const painel = await screen.findByRole('dialog')
    const capacidade = within(painel).getByLabelText('Capacidade')
    await usuario.clear(capacidade)
    await usuario.type(capacidade, '30')
    await usuario.click(within(painel).getByRole('button', { name: 'Salvar veículo' }))

    await waitFor(() =>
      expect(api.chamadas('PUT /veiculos/1')).toEqual([
        { placa: 'ABC1D23', hemocentroBaseId: 10, capacidadeBolsas: 30, latitude: -8.05, longitude: -34.9 },
      ]),
    )
  })

  it('remocao_409_mantem_linha_e_explica', async () => {
    const api = apiBase()
    api.definir('DELETE /veiculos/1', () => ({
      status: 409,
      corpo: { status: 409, title: 'Conflito', detail: 'Veiculo ABC1D23 possui entregas ou telemetria registradas e nao pode ser removido.' },
    }))
    await renderizarComSessao(<PaginaDaCadeiaFria />, LOGISTICA, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Remover ABC1D23' }))
    const dialogo = await screen.findByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Remover veículo' }))

    expect(await within(dialogo).findByText(/possui entregas ou telemetria/)).toBeInTheDocument()
    expect(screen.getAllByText('ABC1D23').length).toBeGreaterThan(0)
  })

  it('troca_rapida_de_veiculo_nao_mostra_leitura_antiga', async () => {
    const api = apiBase()
    let liberarPrimeiro: () => void = () => undefined
    api.definir('GET /veiculos/1/telemetrias', () => ({ corpo: [leitura(1, '2026-11-17T10:00:00Z')] }))
    api.definir('GET /veiculos/2/telemetrias', () => ({ corpo: [leitura(9, '2026-11-17T10:00:00Z'), leitura(8, '2026-11-17T09:00:00Z')] }))
    const original = api.fetch.getMockImplementation() as (url: string, opcoes?: RequestInit) => Promise<Response>
    api.fetch.mockImplementation(async (url: string, opcoes?: RequestInit) => {
      if (url.endsWith('/veiculos/1/telemetrias')) await new Promise<void>((resolver) => (liberarPrimeiro = resolver))
      return original(url, opcoes)
    })
    await renderizarComSessao(<PaginaDaCadeiaFria />, LOGISTICA, api)
    const usuario = userEvent.setup()

    const seletor = await screen.findByLabelText('Selecionar veículo')
    await usuario.selectOptions(seletor, '1')
    await usuario.selectOptions(seletor, '2')
    expect(await screen.findByText('gráfico com 2 leituras')).toBeInTheDocument()

    liberarPrimeiro()
    await new Promise((resolver) => setTimeout(resolver, 20))
    expect(screen.queryByText('gráfico com 1 leituras')).not.toBeInTheDocument()
  })
})
