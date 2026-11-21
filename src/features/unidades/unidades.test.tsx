import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { UsuarioAtual } from '@/lib/api/tipos'
import { criarApiFalsa, renderizarComSessao } from '../../../tests/api-falsa'
import { PaginaDeUnidades } from './pagina-de-unidades'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/unidades',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }))

const ADMIN: UsuarioAtual = { id: 1, nome: 'Ana', email: 'ana@b.dev', perfil: 'ADMIN' }
const OPERADOR: UsuarioAtual = { id: 2, nome: 'Otto', email: 'otto@b.dev', perfil: 'OPERADOR_HEMOCENTRO' }
const HEMOPE = { id: 10, tipo: 'HEMOCENTRO', nome: 'Hemope', cidade: 'Recife', uf: 'PE', latitude: -8.05, longitude: -34.9 }

function apiBase() {
  return criarApiFalsa({ 'GET /hemocentros': [HEMOPE], 'GET /hospitais': [] })
}

afterEach(() => vi.unstubAllGlobals())

describe('PaginaDeUnidades', () => {
  it('nao_admin_nao_ve_cadastro_nem_remocao', async () => {
    await renderizarComSessao(<PaginaDeUnidades />, OPERADOR, apiBase())
    expect(await screen.findByText('Hemope')).toBeInTheDocument()
    expect(screen.queryByText('Cadastrar unidade')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover Hemope' })).not.toBeInTheDocument()
  })

  it('cadastro_envia_endereco_opcional_como_null', async () => {
    const api = apiBase()
    api.definir('POST /hospitais', (corpo) => ({ status: 201, corpo: { id: 30, tipo: 'HOSPITAL', ...(corpo as object) } }))
    await renderizarComSessao(<PaginaDeUnidades />, ADMIN, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByText('Hospital'))
    await usuario.type(screen.getByLabelText('Nome'), 'Hospital Fictício')
    await usuario.type(screen.getByLabelText('Cidade'), 'Olinda')
    await usuario.type(screen.getByLabelText('UF'), 'pe')
    await usuario.type(screen.getByLabelText('Latitude'), '-8.01')
    await usuario.type(screen.getByLabelText('Longitude'), '-34.85')
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar unidade' }))

    await waitFor(() =>
      expect(api.chamadas('POST /hospitais')).toEqual([
        {
          nome: 'Hospital Fictício',
          logradouro: null,
          numero: null,
          bairro: null,
          cidade: 'Olinda',
          uf: 'PE',
          cep: null,
          latitude: -8.01,
          longitude: -34.85,
        },
      ]),
    )
  })

  it('remocao_com_vinculos_409_preserva_linha', async () => {
    const api = apiBase()
    api.definir('DELETE /hemocentros/10', () => ({
      status: 409,
      corpo: { status: 409, title: 'Conflito', detail: 'Hemocentro Hemope possui registros vinculados e nao pode ser removido(a).' },
    }))
    await renderizarComSessao(<PaginaDeUnidades />, ADMIN, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Remover Hemope' }))
    const dialogo = await screen.findByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Remover unidade' }))

    expect(await within(dialogo).findByText(/possui registros vinculados/)).toBeInTheDocument()
    expect(screen.getAllByText('Hemope').length).toBeGreaterThan(0)
  })

  it('remocao_204_recarrega_a_lista', async () => {
    const api = apiBase()
    api.definir('DELETE /hemocentros/10', () => ({ status: 204 }))
    await renderizarComSessao(<PaginaDeUnidades />, ADMIN, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Remover Hemope' }))
    api.definir('GET /hemocentros', [])
    await usuario.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remover unidade' }))

    await waitFor(() => expect(screen.getByText('Nenhum hemocentro cadastrado')).toBeInTheDocument())
  })
})
