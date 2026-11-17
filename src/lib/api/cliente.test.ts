import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, assinarSessaoExpirada, configurarCredencial, ErroDaApi } from './cliente'

function responder(status: number, corpo?: string, tipo = 'application/json') {
  return vi.fn().mockImplementation(
    () => Promise.resolve(new Response(corpo ?? null, { status, headers: { 'Content-Type': tipo } })),
  )
}

describe('cliente HTTP', () => {
  beforeEach(() => configurarCredencial(() => 'token-abc'))
  afterEach(() => {
    configurarCredencial(() => null)
    vi.unstubAllGlobals()
  })

  it('envia_metodos_e_bearer', async () => {
    const fetch = responder(200, '{"ok":true}')
    vi.stubGlobal('fetch', fetch)

    await api.substituir('/x/1', { a: 1 })
    await api.alterar('/x/1', { b: 2 })

    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'PUT', body: '{"a":1}' })
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer token-abc')
    expect(fetch.mock.calls[1][1].method).toBe('PATCH')
  })

  it('delete_204_nao_le_json', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(api.remover('/x/1')).resolves.toBeUndefined()
  })

  it('preserva_campos_e_correlacao', async () => {
    const problema = {
      type: 't',
      title: 'Dados inválidos',
      status: 400,
      detail: 'Corrija os campos.',
      correlacao: 'c-123',
      campos: [{ campo: 'itens[1].quantidade', mensagem: 'deve ser pelo menos 1' }],
    }
    vi.stubGlobal('fetch', responder(400, JSON.stringify(problema), 'application/problem+json'))

    const falha = await api.enviar('/requisicoes', {}).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(ErroDaApi)
    const erro = falha as ErroDaApi
    expect(erro.problema.correlacao).toBe('c-123')
    expect(erro.errosDeCampo['itens[1].quantidade']).toBe('deve ser pelo menos 1')
  })

  it('erro_html_preserva_status_401_e_avisa_expiracao', async () => {
    vi.stubGlobal('fetch', responder(401, '<html>proxy</html>', 'text/html'))
    const ouvinte = vi.fn()
    const cancelar = assinarSessaoExpirada(ouvinte)

    const falha = (await api.buscar('/bolsas').catch((erro: unknown) => erro)) as ErroDaApi
    cancelar()

    expect(falha.status).toBe(401)
    expect(ouvinte).toHaveBeenCalledTimes(1)
  })

  it('login_401_nao_dispara_expiracao', async () => {
    vi.stubGlobal('fetch', responder(401, '{"status":401,"title":"x","detail":"Credenciais inválidas"}'))
    const ouvinte = vi.fn()
    const cancelar = assinarSessaoExpirada(ouvinte)

    await api.enviarAnonimo('/auth/login', {}).catch(() => undefined)
    cancelar()

    expect(ouvinte).not.toHaveBeenCalled()
  })

  it('403_nao_dispara_expiracao', async () => {
    vi.stubGlobal('fetch', responder(403, '{"status":403,"title":"Acesso negado","detail":"Sem permissão"}'))
    const ouvinte = vi.fn()
    const cancelar = assinarSessaoExpirada(ouvinte)
    const falha = (await api.buscar('/usuarios').catch((erro: unknown) => erro)) as ErroDaApi
    cancelar()
    expect(falha.status).toBe(403)
    expect(ouvinte).not.toHaveBeenCalled()
  })

  it('json_invalido_nao_vaza_syntaxerror', async () => {
    vi.stubGlobal('fetch', responder(200, '{quebrado'))
    const falha = await api.buscar('/x').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(ErroDaApi)
    expect((falha as ErroDaApi).problema.type).toMatch(/resposta-invalida/)
  })

  it('nao_repete_post_apos_falha_de_rede', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetch)
    const falha = (await api.enviar('/doacoes', {}).catch((erro: unknown) => erro)) as ErroDaApi
    expect(falha.status).toBe(0)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('requisicao_anonima_nao_envia_token', async () => {
    const fetch = responder(200, '{}')
    vi.stubGlobal('fetch', fetch)
    await api.enviarAnonimo('/auth/login', { email: 'a' })
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
})
