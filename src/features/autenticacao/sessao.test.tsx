import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api/cliente'
import type { UsuarioAtual } from '@/lib/api/tipos'
import { ProvedorDeSessao, useSessao } from './provedor-de-sessao'
import { caminhoDeRetornoSeguro, iniciais, podeAdministrarRede, podeGerenciarUsuarios, prazoDaSessao } from './sessao'

const ADMIN: UsuarioAtual = { id: 1, nome: 'Ana Admin', email: 'ana@bloodell.dev', perfil: 'ADMIN' }
const OPERADOR: UsuarioAtual = { ...ADMIN, id: 2, nome: 'Otto', perfil: 'OPERADOR_HEMOCENTRO' }

const replace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

function respostaLogin(usuario = ADMIN, expiresIn = 900) {
  return json({ accessToken: 'tk', tokenType: 'Bearer', expiresIn, usuario })
}

const envoltorio = ({ children }: { children: ReactNode }) => (
  <ProvedorDeSessao demonstracao={false}>{children}</ProvedorDeSessao>
)

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  replace.mockReset()
})

describe('regras puras da sessão', () => {
  it('retorno_apenas_a_caminho_interno_valido', () => {
    expect(caminhoDeRetornoSeguro('/estoque?status=VENCIDA')).toBe('/estoque?status=VENCIDA')
    expect(caminhoDeRetornoSeguro('https://malicioso.com')).toBe('/')
    expect(caminhoDeRetornoSeguro('//malicioso.com')).toBe('/')
    expect(caminhoDeRetornoSeguro('/\\malicioso.com')).toBe('/')
    expect(caminhoDeRetornoSeguro('/login?voltar=/x')).toBe('/')
    expect(caminhoDeRetornoSeguro(null)).toBe('/')
  })

  it('prazo_respeita_expires_in_com_margem', () => {
    expect(prazoDaSessao(900)).toBe(890_000)
    expect(prazoDaSessao(0)).toBe(0)
    expect(prazoDaSessao(Number.NaN)).toBe(0)
  })

  it('permissoes_espelham_o_backend', () => {
    expect(podeGerenciarUsuarios(ADMIN, false)).toBe(true)
    expect(podeGerenciarUsuarios(OPERADOR, false)).toBe(false)
    expect(podeGerenciarUsuarios(ADMIN, true)).toBe(false)
    expect(podeAdministrarRede(OPERADOR, false)).toBe(false)
    expect(podeAdministrarRede(null, true)).toBe(true)
  })

  it('iniciais', () => {
    expect(iniciais('Maria da Silva Souza')).toBe('MS')
    expect(iniciais('Otto')).toBe('O')
  })
})

describe('ProvedorDeSessao', () => {
  it('login_valido_autentica_e_envia_token_depois', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(respostaLogin()).mockResolvedValueOnce(json([]))
    vi.stubGlobal('fetch', fetch)
    const { result } = renderHook(() => useSessao(), { wrapper: envoltorio })

    await act(() => result.current.entrar('ana@bloodell.dev', 'senha-muito-longa'))
    expect(result.current.estado).toBe('autenticada')
    expect(result.current.usuario?.perfil).toBe('ADMIN')

    await api.buscar('/bolsas')
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer tk')
  })

  it('login_invalido_volta_a_anonima_e_propaga_erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ status: 401, title: 'x', detail: 'Credenciais inválidas' }, 401)))
    const { result } = renderHook(() => useSessao(), { wrapper: envoltorio })
    await act(async () => {
      await expect(result.current.entrar('a@b.c', 'x')).rejects.toMatchObject({ status: 401 })
    })
    expect(result.current.estado).toBe('anonima')
  })

  it('expira_pelo_expires_in', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaLogin(ADMIN, 60)))
    const { result } = renderHook(() => useSessao(), { wrapper: envoltorio })
    await act(() => result.current.entrar('ana@bloodell.dev', 'senha'))

    act(() => vi.advanceTimersByTime(51_000))
    expect(result.current.estado).toBe('anonima')
    expect(result.current.motivo).toBe('expirada')
  })

  it('saida_limpa_e_ignora_login_atrasado', async () => {
    let responder: (resposta: Response) => void = () => undefined
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise<Response>((r) => (responder = r))))
    const { result } = renderHook(() => useSessao(), { wrapper: envoltorio })

    let pendente: Promise<void> = Promise.resolve()
    act(() => {
      pendente = result.current.entrar('ana@bloodell.dev', 'senha')
    })
    act(() => result.current.sair('manual'))
    await act(async () => {
      responder(respostaLogin())
      await pendente
    })

    expect(result.current.estado).toBe('anonima')
    expect(result.current.usuario).toBeNull()
  })

  it('401_autenticado_encerra_sessao_e_403_nao', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respostaLogin())
      .mockResolvedValueOnce(json({ status: 403, title: 'x', detail: 'negado' }, 403))
      .mockResolvedValueOnce(json({ status: 401, title: 'x', detail: 'expirado' }, 401))
    vi.stubGlobal('fetch', fetch)
    const { result } = renderHook(() => useSessao(), { wrapper: envoltorio })
    await act(() => result.current.entrar('ana@bloodell.dev', 'senha'))

    await act(() => api.buscar('/usuarios').catch(() => undefined))
    expect(result.current.estado).toBe('autenticada')

    await act(() => api.buscar('/bolsas').catch(() => undefined))
    expect(result.current.estado).toBe('anonima')
    expect(result.current.motivo).toBe('expirada')
  })

  it('reconsulta_me_atualiza_perfil', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(respostaLogin()).mockResolvedValueOnce(json({ ...ADMIN, perfil: 'LOGISTICA' }))
    vi.stubGlobal('fetch', fetch)
    const { result } = renderHook(() => useSessao(), { wrapper: envoltorio })
    await act(() => result.current.entrar('ana@bloodell.dev', 'senha'))
    await act(() => result.current.atualizarUsuario())
    expect(result.current.usuario?.perfil).toBe('LOGISTICA')
    expect(String(fetch.mock.calls[1][0])).toMatch(/\/auth\/me$/)
  })
})

describe('PaginaDeLogin', () => {
  it('valida_campos_e_mostra_falha_de_credencial', async () => {
    const { PaginaDeLogin } = await import('./pagina-de-login')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ status: 401, title: 'x', detail: 'x' }, 401)))
    render(<PaginaDeLogin />, { wrapper: envoltorio })
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Informe o e-mail da sua conta.')).toBeInTheDocument()

    await usuario.type(screen.getByLabelText('E-mail'), 'ana@bloodell.dev')
    await usuario.type(screen.getByLabelText('Senha'), 'errada-mas-longa')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeInTheDocument())
  })

  it('redireciona_ao_caminho_pedido_apos_login', async () => {
    window.history.replaceState(null, '', '/login?voltar=%2Fentregas')
    const { PaginaDeLogin } = await import('./pagina-de-login')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaLogin()))
    render(<PaginaDeLogin />, { wrapper: envoltorio })
    const usuario = userEvent.setup()

    await usuario.type(screen.getByLabelText('E-mail'), 'ana@bloodell.dev')
    await usuario.type(screen.getByLabelText('Senha'), 'senha-muito-longa')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/entregas'))
  })
})
