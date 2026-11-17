import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContextoDeEscopo } from './escopo'
import { useRecurso } from './use-recurso'

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => vi.unstubAllGlobals())

describe('useRecurso', () => {
  it('troca_de_escopo_descarta_resposta_antiga', async () => {
    let resolverAntiga: (resposta: Response) => void = () => undefined
    const fetch = vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((resolver) => (resolverAntiga = resolver)))
      .mockImplementationOnce(() => Promise.resolve(json({ dono: 'nova' })))
    vi.stubGlobal('fetch', fetch)

    let escopo = 1
    const envoltorio = ({ children }: { children: ReactNode }) => (
      <ContextoDeEscopo.Provider value={escopo}>{children}</ContextoDeEscopo.Provider>
    )
    const { result, rerender } = renderHook(() => useRecurso<{ dono: string }>('/me'), { wrapper: envoltorio })

    escopo = 2
    rerender()
    await waitFor(() => expect(result.current.dados).toEqual({ dono: 'nova' }))

    await act(async () => resolverAntiga(json({ dono: 'antiga' })))
    expect(result.current.dados).toEqual({ dono: 'nova' })
  })

  it('caminho_null_limpa_dados', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(json([1, 2]))))
    const { result, rerender } = renderHook(({ caminho }) => useRecurso<number[]>(caminho), {
      initialProps: { caminho: '/lista' as string | null },
    })
    await waitFor(() => expect(result.current.dados).toEqual([1, 2]))

    rerender({ caminho: null })
    expect(result.current.dados).toBeNull()
    expect(result.current.carregando).toBe(false)
  })

  it('mudanca_de_caminho_nao_mostra_entidade_anterior', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) =>
        url.endsWith('/1') ? Promise.resolve(json({ id: 1 })) : new Promise<Response>(() => undefined),
      ),
    )
    const { result, rerender } = renderHook(({ caminho }) => useRecurso<{ id: number }>(caminho), {
      initialProps: { caminho: '/bolsas/1' },
    })
    await waitFor(() => expect(result.current.dados).toEqual({ id: 1 }))

    rerender({ caminho: '/bolsas/2' })
    expect(result.current.dados).toBeNull()
    expect(result.current.carregando).toBe(true)
  })

  it('recarregar_mantem_dados_e_expoe_status_da_falha', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ v: 1 }))
      .mockResolvedValueOnce(json({ status: 403, title: 'x', detail: 'Sem permissão' }, 403))
    vi.stubGlobal('fetch', fetch)
    const { result } = renderHook(() => useRecurso<{ v: number }>('/x'))
    await waitFor(() => expect(result.current.dados).toEqual({ v: 1 }))

    act(() => result.current.recarregar())
    await waitFor(() => expect(result.current.statusHttp).toBe(403))
    expect(result.current.dados).toEqual({ v: 1 })
    expect(result.current.erro).toBe('Sem permissão')
  })
})
