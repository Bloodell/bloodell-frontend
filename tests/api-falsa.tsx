import { render, screen, waitFor, type RenderResult } from '@testing-library/react'
import { useEffect, type ReactElement, type ReactNode } from 'react'
import { expect, vi } from 'vitest'
import { ProvedorDeSessao, useSessao } from '@/features/autenticacao/provedor-de-sessao'
import type { UsuarioAtual } from '@/lib/api/tipos'

/**
 * API falsa para testes de tela: cada rota e "METODO /caminho" (com a query,
 * sem o prefixo /api/v1). O valor e o corpo da resposta, ou uma funcao que
 * recebe o corpo enviado e devolve { status, corpo }.
 */
export type Resposta = { status?: number; corpo?: unknown }
export type Rota = unknown | ((corpo: unknown, url: string) => Resposta)

export interface ApiFalsa {
  fetch: ReturnType<typeof vi.fn>
  chamadas: (metodoECaminho: string) => unknown[]
  definir: (metodoECaminho: string, rota: Rota) => void
}

export function criarApiFalsa(rotas: Record<string, Rota>): ApiFalsa {
  const tabela = new Map(Object.entries(rotas))
  const registro: { chave: string; corpo: unknown }[] = []

  const fetch = vi.fn(async (url: string, opcoes: RequestInit = {}) => {
    const caminho = url.replace(/^.*\/api\/v1/, '')
    const metodo = (opcoes.method ?? 'GET').toUpperCase()
    const chave = `${metodo} ${caminho}`
    const corpo = typeof opcoes.body === 'string' ? JSON.parse(opcoes.body) : undefined
    registro.push({ chave, corpo })

    const rota = tabela.get(chave)
    if (rota === undefined) {
      return new Response(JSON.stringify({ status: 404, title: 'Não encontrado', detail: `Rota falsa ausente: ${chave}` }), {
        status: 404,
      })
    }
    const resposta: Resposta = typeof rota === 'function' ? (rota as (c: unknown, u: string) => Resposta)(corpo, caminho) : { corpo: rota }
    const status = resposta.status ?? 200
    if (status === 204) return new Response(null, { status })
    return new Response(JSON.stringify(resposta.corpo ?? null), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fetch)
  return {
    fetch,
    chamadas: (alvo) => registro.filter((item) => item.chave === alvo).map((item) => item.corpo),
    definir: (alvo, rota) => tabela.set(alvo, rota),
  }
}

function EntrarAutomaticamente({ children }: { children: ReactNode }) {
  const sessao = useSessao()
  useEffect(() => {
    if (sessao.estado === 'anonima' && sessao.motivo === null) void sessao.entrar('teste@bloodell.dev', 'senha-de-teste-longa')
  }, [sessao])
  return sessao.estado === 'autenticada' ? <>{children}</> : <p>entrando…</p>
}

/** Renderiza a tela ja autenticada como `usuario` (o login passa pela API falsa). */
export async function renderizarComSessao(ui: ReactElement, usuario: UsuarioAtual, api: ApiFalsa): Promise<RenderResult> {
  api.definir('POST /auth/login', { accessToken: 'tk', tokenType: 'Bearer', expiresIn: 900, usuario })
  api.definir('GET /auth/me', usuario)
  const resultado = render(
    <ProvedorDeSessao demonstracao={false}>
      <EntrarAutomaticamente>{ui}</EntrarAutomaticamente>
    </ProvedorDeSessao>,
  )
  await waitFor(() => expect(screen.queryByText('entrando…')).not.toBeInTheDocument())
  return resultado
}

export function pagina<T>(conteudo: T[], numero = 0, tamanho = 20, total = conteudo.length) {
  return { content: conteudo, number: numero, size: tamanho, totalElements: total, totalPages: Math.max(1, Math.ceil(total / tamanho)) }
}
