import { afterEach, describe, expect, it, vi } from 'vitest'
import { configurarCredencial } from './cliente'
import { buscarRequisicoesPorIds } from './paginacao'

afterEach(() => {
  vi.unstubAllGlobals()
  configurarCredencial(() => null)
})

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('buscarRequisicoesPorIds', () => {
  it('deduplica_e_limita_a_4_simultaneas', async () => {
    let emVoo = 0
    let maximo = 0
    const fetch = vi.fn(async (url: string) => {
      emVoo++
      maximo = Math.max(maximo, emVoo)
      await new Promise((resolver) => setTimeout(resolver, 5))
      emVoo--
      return json({ id: Number(url.split('/').pop()) })
    })
    vi.stubGlobal('fetch', fetch)

    const ids = Array.from({ length: 12 }, (_, indice) => indice + 101)
    const { encontrados } = await buscarRequisicoesPorIds([...ids, 101, 102, 103])

    expect(fetch).toHaveBeenCalledTimes(12)
    expect(maximo).toBeLessThanOrEqual(4)
    expect(encontrados.get(112)).toEqual({ id: 112 })
  })

  it('404_por_item_nao_derruba_as_outras', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/2') ? json({ status: 404, title: 'x', detail: 'não encontrada' }, 404) : json({ id: Number(url.split('/').pop()) }),
      ),
    )
    const { encontrados, falhas } = await buscarRequisicoesPorIds([1, 2, 3])
    expect([...encontrados.keys()].sort()).toEqual([1, 3])
    expect(falhas.get(2)).toBe(404)
  })

  it('401_interrompe_e_propaga', async () => {
    configurarCredencial(() => 'tk')
    vi.stubGlobal('fetch', vi.fn(async () => json({ status: 401, title: 'x', detail: 'expirou' }, 401)))
    await expect(buscarRequisicoesPorIds([1, 2])).rejects.toMatchObject({ status: 401 })
  })
})
