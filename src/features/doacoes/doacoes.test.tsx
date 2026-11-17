import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Doacao, UsuarioAtual } from '@/lib/api/tipos'
import { criarApiFalsa, renderizarComSessao } from '../../../tests/api-falsa'
import { PaginaDeAlgoritmos } from '../algoritmos/pagina-de-algoritmos'
import { PaginaDeDoacoes } from './pagina-de-doacoes'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/doacoes',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }))

const OPERADOR: UsuarioAtual = { id: 2, nome: 'Otto', email: 'otto@b.dev', perfil: 'OPERADOR_HEMOCENTRO' }
const HEMOPE = { id: 10, tipo: 'HEMOCENTRO', nome: 'Hemope', cidade: 'Recife', uf: 'PE', latitude: 0, longitude: 0 }

const DOACAO: Doacao = {
  id: 4,
  codigo: 'DOA-0004',
  hemocentroId: 10,
  tipoSanguineo: 'O-',
  volumeMl: 450,
  dataHora: '2026-11-10T09:00:00Z',
  bolsasGeradas: [{ id: 91, codigo: 'BOL-0091', componente: 'PLASMA', dataValidade: '2027-11-10', status: 'DISPONIVEL' }],
}

afterEach(() => vi.unstubAllGlobals())

describe('PaginaDeDoacoes', () => {
  it('abre_doacao_historica_com_atalho_para_a_bolsa', async () => {
    const api = criarApiFalsa({ 'GET /hemocentros': [HEMOPE], 'GET /doacoes': [DOACAO], 'GET /doacoes/4': DOACAO })
    await renderizarComSessao(<PaginaDeDoacoes />, OPERADOR, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Abrir doação DOA-0004' }))
    const painel = await screen.findByRole('dialog')
    expect(await within(painel).findByText('450 ml')).toBeInTheDocument()
    expect(within(painel).getByRole('link', { name: /BOL-0091/ })).toHaveAttribute('href', '/estoque?bolsa=91')
  })

  it('doacao_inexistente_404_explica', async () => {
    const api = criarApiFalsa({ 'GET /hemocentros': [HEMOPE], 'GET /doacoes': [DOACAO] })
    await renderizarComSessao(<PaginaDeDoacoes />, OPERADOR, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Abrir doação DOA-0004' }))
    expect(await screen.findByText('Esta doação não existe ou está fora do alcance da sua conta.')).toBeInTheDocument()
  })
})

describe('PaginaDeAlgoritmos', () => {
  it('filtra_a_lista_encadeada_por_unidade', async () => {
    const snapshot = { estrutura: 'lista', ordem: 'chegada', tamanho: 0, capturadoEm: '2026-11-17T10:00:00Z', observacao: '', nos: [] }
    const api = criarApiFalsa({
      'GET /hemocentros': [HEMOPE],
      'GET /algoritmos/estoque': snapshot,
      'GET /algoritmos/estoque?unidadeId=10': snapshot,
      'GET /algoritmos/fila': { ...snapshot, politica: 'prioridade' },
      'GET /algoritmos/historico': snapshot,
      'GET /algoritmos/situacao': { etapaVigente: '1', implementados: [], pendentesDaUnidadeDois: ['FEFO'], observacao: '' },
    })
    await renderizarComSessao(<PaginaDeAlgoritmos />, OPERADOR, api)
    const usuario = userEvent.setup()

    await usuario.selectOptions(await screen.findByLabelText('Montar a lista de qual hemocentro'), '10')
    expect(await screen.findByText('A lista desta unidade está vazia.')).toBeInTheDocument()
    expect(api.chamadas('GET /algoritmos/estoque?unidadeId=10')).toHaveLength(1)
  })
})
