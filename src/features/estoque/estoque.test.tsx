import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Bolsa, UsuarioAtual } from '@/lib/api/tipos'
import { criarApiFalsa, pagina, renderizarComSessao } from '../../../tests/api-falsa'
import { PaginaDeEstoque } from './pagina-de-estoque'

let parametros = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/estoque',
  useSearchParams: () => parametros,
}))

const OPERADOR: UsuarioAtual = { id: 2, nome: 'Otto', email: 'otto@b.dev', perfil: 'OPERADOR_HEMOCENTRO' }
const BOLSA: Bolsa = {
  id: 91,
  codigo: 'BOL-0091',
  tipoSanguineo: 'O-',
  componente: 'PLASMA',
  dataColeta: '2026-11-10',
  dataValidade: '2027-11-10',
  status: 'DESPACHADA',
  unidadeAtualId: 10,
  unidadeAtualNome: 'Hemope',
  sequenciaEntrada: 3,
  dentroDaValidade: true,
  diasParaVencer: 358,
}

function apiBase() {
  return criarApiFalsa({
    'GET /hemocentros': [{ id: 10, tipo: 'HEMOCENTRO', nome: 'Hemope', cidade: 'Recife', uf: 'PE', latitude: 0, longitude: 0 }],
    'GET /hospitais': [{ id: 20, tipo: 'HOSPITAL', nome: 'HR', cidade: 'Recife', uf: 'PE', latitude: 0, longitude: 0 }],
    'GET /estoques?': [],
    'GET /bolsas?page=0&size=10&status=DISPONIVEL': pagina<Bolsa>([], 0, 10),
    'GET /bolsas/91': BOLSA,
    'GET /bolsas/91/rastreabilidade': [],
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  parametros = new URLSearchParams()
})

describe('PaginaDeEstoque', () => {
  it('link_com_bolsa_abre_a_rastreabilidade', async () => {
    parametros = new URLSearchParams('bolsa=91')
    await renderizarComSessao(<PaginaDeEstoque />, OPERADOR, apiBase())
    const painel = await screen.findByRole('dialog')
    expect(within(painel).getByText('BOL-0091')).toBeInTheDocument()
  })

  it('filtros_incluem_estados_e_hospitais_que_faltavam', async () => {
    await renderizarComSessao(<PaginaDeEstoque />, OPERADOR, apiBase())
    const situacao = await screen.findByLabelText('Filtrar por situação')
    for (const rotulo of ['Recebida', 'Armazenada', 'Despachada']) {
      expect(within(situacao).getByRole('option', { name: rotulo })).toBeInTheDocument()
    }
    expect(await within(screen.getByLabelText('Filtrar por unidade')).findByRole('option', { name: 'HR' })).toBeInTheDocument()
  })
})
