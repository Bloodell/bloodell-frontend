import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Requisicao, UsuarioAtual } from '@/lib/api/tipos'
import { criarApiFalsa, pagina, renderizarComSessao } from '../../../tests/api-falsa'
import { PaginaDeRequisicoes } from './pagina-de-requisicoes'
import { errosDaApiPorItem, pendencias, podeCancelar } from './requisicoes-api'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/requisicoes',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }))

const HOSPITAL_USER: UsuarioAtual = { id: 5, nome: 'Hugo', email: 'hugo@b.dev', perfil: 'USUARIO_HOSPITAL' }
const HOSPITAL = { id: 20, tipo: 'HOSPITAL', nome: 'Hospital da Restauração', cidade: 'Recife', uf: 'PE', latitude: 0, longitude: 0 }

function requisicao(parcial: Partial<Requisicao> = {}): Requisicao {
  return {
    id: 7,
    codigo: 'REQ-0007',
    hospitalId: 20,
    hospitalNome: HOSPITAL.nome,
    prioridade: 'URGENTE',
    status: 'NA_FILA',
    criadaEm: '2026-11-17T10:00:00Z',
    atendidaEm: null,
    itens: [{ id: 1, componente: 'PLASMA', tipoSanguineo: 'A+', quantidade: 3, quantidadeAlocada: 0 }],
    ...parcial,
  }
}

function apiBase(req = requisicao()) {
  const vazio = pagina<Requisicao>([], 0, 1, 0)
  return criarApiFalsa({
    'GET /hospitais': [HOSPITAL],
    'GET /requisicoes/fila': [],
    'GET /requisicoes?page=0&size=10': pagina([req], 0, 10),
    'GET /requisicoes?status=NA_FILA&size=1': vazio,
    'GET /requisicoes?status=ALOCADA&size=1': vazio,
    'GET /requisicoes?status=EM_ROTA&size=1': vazio,
    'GET /requisicoes?status=ATENDIDA&size=1': vazio,
    [`GET /requisicoes/${req.id}`]: req,
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('requisições — regras', () => {
  it('erro_do_item_segue_o_item_mesmo_apos_remover_outro', () => {
    // Enviou itens com chaves [4, 9]; a API acusou o segundo (indice 1).
    const { porItem, gerais } = errosDaApiPorItem({ 'itens[1].quantidade': 'deve ser pelo menos 1', hospitalId: 'x' }, [4, 9])
    expect(porItem).toEqual({ 9: { quantidade: 'deve ser pelo menos 1' } })
    expect(gerais).toEqual({ hospitalId: 'x' })
  })

  it('pendencias_e_cancelamento_conservador', () => {
    const parcial = requisicao({
      itens: [
        { id: 1, componente: 'PLASMA', tipoSanguineo: 'A+', quantidade: 3, quantidadeAlocada: 1 },
        { id: 2, componente: 'PLAQUETAS', tipoSanguineo: 'O-', quantidade: 2, quantidadeAlocada: 2 },
      ],
    })
    expect(pendencias(parcial)).toEqual({ total: 5, alocado: 3, faltam: 2 })
    expect(podeCancelar('NA_FILA')).toBe(true)
    expect(podeCancelar('ALOCADA')).toBe(false)
    expect(podeCancelar('EM_ROTA')).toBe(false)
  })
})

describe('PaginaDeRequisicoes', () => {
  it('cria_requisicao_com_dois_itens_e_hospital_unico_ja_escolhido', async () => {
    const api = apiBase()
    api.definir('POST /requisicoes', (corpo) => ({ status: 201, corpo: requisicao({ id: 8, codigo: 'REQ-0008', ...(corpo as object) }) }))
    api.definir('GET /requisicoes/8', requisicao({ id: 8, codigo: 'REQ-0008' }))
    await renderizarComSessao(<PaginaDeRequisicoes />, HOSPITAL_USER, api)
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Nova requisição' }))
    const painel = await screen.findByRole('dialog')
    await usuario.click(within(painel).getByRole('button', { name: 'Adicionar outro hemocomponente' }))
    const segundo = within(painel).getByRole('listitem', { name: 'Item 2' })
    await usuario.selectOptions(within(segundo).getByLabelText('Hemocomponente'), 'PLAQUETAS')
    await usuario.click(within(segundo).getByText('AB-'))
    await usuario.click(within(segundo).getByRole('button', { name: 'Aumentar quantidade do item 2' }))
    await usuario.click(within(painel).getByRole('button', { name: 'Criar requisição' }))

    await waitFor(() =>
      expect(api.chamadas('POST /requisicoes')).toEqual([
        {
          hospitalId: 20,
          prioridade: 'URGENTE',
          itens: [
            { componente: 'CONCENTRADO_HEMACIAS', tipoSanguineo: 'O+', quantidade: 1 },
            { componente: 'PLAQUETAS', tipoSanguineo: 'AB-', quantidade: 2 },
          ],
        },
      ]),
    )
  })

  it('erro_da_api_aparece_so_no_item_certo', async () => {
    const api = apiBase()
    api.definir('POST /requisicoes', () => ({
      status: 400,
      corpo: { status: 400, title: 'Dados inválidos', detail: 'Corrija os itens.', campos: [{ campo: 'itens[1].quantidade', mensagem: 'quantidade recusada pela API' }] },
    }))
    await renderizarComSessao(<PaginaDeRequisicoes />, HOSPITAL_USER, api)
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Nova requisição' }))
    const painel = await screen.findByRole('dialog')
    await usuario.click(within(painel).getByRole('button', { name: 'Adicionar outro hemocomponente' }))
    await usuario.click(within(painel).getByRole('button', { name: 'Criar requisição' }))

    const segundo = await within(painel).findByRole('listitem', { name: 'Item 2' })
    expect(within(segundo).getByText('quantidade recusada pela API')).toBeInTheDocument()
    expect(within(within(painel).getByRole('listitem', { name: 'Item 1' })).queryByText('quantidade recusada pela API')).not.toBeInTheDocument()
  })

  it('quantidade_zero_ou_decimal_e_impedida', async () => {
    const api = apiBase()
    await renderizarComSessao(<PaginaDeRequisicoes />, HOSPITAL_USER, api)
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Nova requisição' }))
    const painel = await screen.findByRole('dialog')
    const quantidade = within(painel).getByLabelText('Quantidade')
    await usuario.clear(quantidade)
    await usuario.type(quantidade, '1.5')
    await usuario.click(within(painel).getByRole('button', { name: 'Criar requisição' }))

    expect(within(painel).getByText('Quantidade inteira, pelo menos 1 bolsa.')).toBeInTheDocument()
    expect(api.chamadas('POST /requisicoes')).toHaveLength(0)
  })

  it('altera_prioridade_na_fila_via_put', async () => {
    const api = apiBase()
    api.definir('PUT /requisicoes/7', (corpo) => ({ corpo: requisicao(corpo as Partial<Requisicao>) }))
    await renderizarComSessao(<PaginaDeRequisicoes />, HOSPITAL_USER, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Abrir REQ-0007' }))
    const painel = await screen.findByRole('dialog')
    await usuario.click(await within(painel).findByText('Emergência'))
    await usuario.click(within(painel).getByRole('button', { name: 'Salvar prioridade' }))

    await waitFor(() => expect(api.chamadas('PUT /requisicoes/7')).toEqual([{ prioridade: 'EMERGENCIA' }]))
  })

  it('cancela_na_fila_com_confirmacao', async () => {
    const api = apiBase()
    api.definir('DELETE /requisicoes/7', () => ({ status: 204 }))
    await renderizarComSessao(<PaginaDeRequisicoes />, HOSPITAL_USER, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Abrir REQ-0007' }))
    const painel = await screen.findByRole('dialog')
    await usuario.click(await within(painel).findByRole('button', { name: 'Cancelar requisição' }))
    const dialogo = await screen.findByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar requisição' }))

    await waitFor(() => expect(api.chamadas('DELETE /requisicoes/7')).toHaveLength(1))
  })

  it('alocada_nao_oferece_cancelamento_e_explica', async () => {
    const api = apiBase(requisicao({ status: 'ALOCADA' }))
    await renderizarComSessao(<PaginaDeRequisicoes />, HOSPITAL_USER, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Abrir REQ-0007' }))
    const painel = await screen.findByRole('dialog')
    expect(await within(painel).findByText(/Cancelar depois da alocação ainda não está disponível/)).toBeInTheDocument()
    expect(within(painel).queryByRole('button', { name: 'Cancelar requisição' })).not.toBeInTheDocument()
    expect(within(painel).getByRole('link', { name: /Planejar a entrega/ })).toHaveAttribute('href', '/entregas?requisicao=7')
  })

  it('alocacao_parcial_nao_e_rotulada_como_completa', async () => {
    const api = apiBase()
    api.definir('POST /requisicoes/7/alocacoes', () => ({
      status: 201,
      corpo: {
        requisicaoId: 7,
        requisicaoCodigo: 'REQ-0007',
        statusRequisicao: 'ALOCADA',
        politicaAplicada: 'Ordem de chegada',
        avisoAcademico: 'Regra didática.',
        quantidadeSolicitada: 3,
        quantidadeAlocada: 1,
        bolsas: [],
        passos: [],
      },
    }))
    await renderizarComSessao(<PaginaDeRequisicoes />, HOSPITAL_USER, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Processar' }))
    const painel = await screen.findByRole('dialog')
    expect(within(painel).getByText('Atendimento parcial.')).toBeInTheDocument()
  })
})
