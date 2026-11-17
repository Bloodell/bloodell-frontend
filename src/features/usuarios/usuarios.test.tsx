import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { UsuarioAtual } from '@/lib/api/tipos'
import { criarApiFalsa, pagina, renderizarComSessao } from '../../../tests/api-falsa'
import { PaginaDeUsuarios } from './pagina-de-usuarios'
import { diferencasDoUsuario, validarCadastro } from './usuarios-api'

const replace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/usuarios',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }))

const ADMIN: UsuarioAtual = { id: 1, nome: 'Ana Admin', email: 'ana@bloodell.dev', perfil: 'ADMIN' }
const OTTO: UsuarioAtual = { id: 2, nome: 'Otto Operador', email: 'otto@bloodell.dev', perfil: 'OPERADOR_HEMOCENTRO' }
const HEMOCENTRO = { id: 10, tipo: 'HEMOCENTRO', nome: 'Hemope', cidade: 'Recife', uf: 'PE', latitude: 0, longitude: 0 }
const HOSPITAL = { id: 20, tipo: 'HOSPITAL', nome: 'Hospital da Restauração', cidade: 'Recife', uf: 'PE', latitude: 0, longitude: 0 }

function apiBase() {
  return criarApiFalsa({
    'GET /usuarios?page=0&size=20': pagina([ADMIN, OTTO]),
    'GET /usuarios/2/unidades': { unidadeIds: [10] },
    'GET /hemocentros': [HEMOCENTRO],
    'GET /hospitais': [HOSPITAL],
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  replace.mockReset()
})

describe('regras de usuário', () => {
  it('senha_unicode_respeita_72_bytes', () => {
    const base = { nome: 'A', email: 'a@b.co', perfil: 'ADMIN' }
    expect(validarCadastro({ ...base, senha: 'curta' }).senha).toMatch(/12/)
    // 24 caracteres de 4 bytes = 96 bytes: passa no tamanho, falha nos bytes.
    expect(validarCadastro({ ...base, senha: '🩸'.repeat(24) }).senha).toMatch(/72 bytes/)
    expect(validarCadastro({ ...base, senha: 'senha-boa-123' }).senha).toBeUndefined()
  })

  it('patch_envia_so_campos_alterados', () => {
    expect(diferencasDoUsuario(OTTO, { nome: 'Otto Operador', email: ' OTTO@bloodell.dev ', perfil: 'OPERADOR_HEMOCENTRO' })).toEqual({})
    expect(diferencasDoUsuario(OTTO, { nome: 'Otto O.', email: OTTO.email, perfil: 'LOGISTICA' })).toEqual({
      nome: 'Otto O.',
      perfil: 'LOGISTICA',
    })
  })
})

describe('PaginaDeUsuarios', () => {
  it('nao_admin_nao_monta_pagina', async () => {
    const api = apiBase()
    await renderizarComSessao(<PaginaDeUsuarios />, OTTO, api)
    expect(screen.getByText('Área restrita a administradores')).toBeInTheDocument()
    expect(api.chamadas('GET /usuarios?page=0&size=20')).toHaveLength(0)
  })

  it('admin_lista_e_edita_enviando_so_o_que_mudou', async () => {
    const api = apiBase()
    api.definir('PATCH /usuarios/2', (corpo) => ({ corpo: { ...OTTO, ...(corpo as object) } }))
    await renderizarComSessao(<PaginaDeUsuarios />, ADMIN, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Gerenciar Otto Operador' }))
    const painel = await screen.findByRole('dialog')
    const nome = within(painel).getByLabelText('Nome')
    await usuario.clear(nome)
    await usuario.type(nome, 'Otto Silva')
    await usuario.click(within(painel).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(api.chamadas('PATCH /usuarios/2')).toEqual([{ nome: 'Otto Silva' }]))
  })

  it('email_duplicado_409_mostra_mensagem_e_preserva_valores', async () => {
    const api = apiBase()
    api.definir('POST /usuarios', () => ({
      status: 409,
      corpo: { status: 409, title: 'Conflito', detail: 'E-mail já cadastrado.' },
    }))
    await renderizarComSessao(<PaginaDeUsuarios />, ADMIN, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Novo usuário' }))
    const painel = await screen.findByRole('dialog')
    await usuario.type(within(painel).getByLabelText('Nome'), 'Bia')
    await usuario.type(within(painel).getByLabelText('E-mail'), 'otto@bloodell.dev')
    await usuario.click(within(painel).getByText('Logística'))
    await usuario.type(within(painel).getByLabelText('Senha inicial'), 'senha-inicial-123')
    await usuario.click(within(painel).getByRole('button', { name: 'Cadastrar usuário' }))

    expect(await within(painel).findByText('E-mail já cadastrado.')).toBeInTheDocument()
    expect(within(painel).getByLabelText('Nome')).toHaveValue('Bia')
  })

  it('vinculos_substituem_o_conjunto', async () => {
    const api = apiBase()
    api.definir('PUT /usuarios/2/unidades', (corpo) => ({ corpo }))
    await renderizarComSessao(<PaginaDeUsuarios />, ADMIN, api)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Gerenciar Otto Operador' }))
    const painel = await screen.findByRole('dialog')
    await usuario.click(await within(painel).findByLabelText(/Hospital da Restauração/))
    await usuario.click(within(painel).getByRole('button', { name: 'Salvar vínculos' }))

    await waitFor(() => expect(api.chamadas('PUT /usuarios/2/unidades')).toEqual([{ unidadeIds: [10, 20] }]))
  })

  it('autorrebaixamento_reconsulta_me_e_sai_da_area', async () => {
    const api = apiBase()
    const rebaixado = { ...ADMIN, perfil: 'LOGISTICA' as const }
    api.definir('PATCH /usuarios/1', { ...rebaixado })
    await renderizarComSessao(<PaginaDeUsuarios />, ADMIN, api)
    api.definir('GET /auth/me', rebaixado)
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Gerenciar Ana Admin' }))
    const painel = await screen.findByRole('dialog')
    await usuario.click(within(painel).getByText('Logística'))
    await usuario.click(within(painel).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'))
    expect(api.chamadas('GET /auth/me').length).toBeGreaterThan(0)
  })
})
