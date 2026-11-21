'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, statusDaFalha } from './cliente'
import { useEscopo } from './escopo'
import type { Requisicao } from './tipos'

export interface ResultadoPorIds<T> {
  encontrados: Map<number, T>
  /** id -> status HTTP da falha (404, 403...) ou 0 para rede. */
  falhas: Map<number, number>
}

/**
 * Busca varios recursos por ID, deduplicando e com no maximo `paralelos`
 * requisicoes simultaneas. Uma falha nao derruba as outras; um 401 interrompe
 * (a sessao acabou e nao adianta continuar).
 */
export async function buscarPorIds<T>(
  ids: number[],
  caminho: (id: number) => string,
  paralelos = 4,
): Promise<ResultadoPorIds<T>> {
  const unicos = [...new Set(ids)]
  const encontrados = new Map<number, T>()
  const falhas = new Map<number, number>()
  let proximo = 0
  let interromper: unknown = null

  async function trabalhador() {
    while (proximo < unicos.length && interromper === null) {
      const id = unicos[proximo++]
      try {
        encontrados.set(id, await api.buscar<T>(caminho(id)))
      } catch (falha) {
        const status = statusDaFalha(falha)
        if (status === 401) interromper = falha
        else falhas.set(id, status ?? 0)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(paralelos, unicos.length) }, trabalhador))
  if (interromper !== null) throw interromper
  return { encontrados, falhas }
}

export function buscarRequisicoesPorIds(ids: number[]): Promise<ResultadoPorIds<Requisicao>> {
  return buscarPorIds<Requisicao>(ids, (id) => `/requisicoes/${id}`)
}

/**
 * Versao em hook: so as requisicoes que a tela realmente precisa (ex.: as das
 * entregas ativas), sem baixar a primeira pagina de 100 e torcer para estar la.
 */
export function useRequisicoesPorIds(ids: number[]) {
  const escopo = useEscopo()
  const chave = [...new Set(ids)].sort((a, b) => a - b).join(',')
  const [gatilho, setGatilho] = useState(0)
  const [estado, setEstado] = useState<{
    base: string
    origem: string
    resultado: ResultadoPorIds<Requisicao> | null
    erro: boolean
  } | null>(null)
  // base = mesma sessao e mesmos IDs; origem = base + recarga.
  const base = `${escopo}|${chave}`
  const origem = `${base}|${gatilho}`

  useEffect(() => {
    let cancelado = false
    const lista = chave ? chave.split(',').map(Number) : []
    buscarRequisicoesPorIds(lista)
      .then((resultado) => !cancelado && setEstado({ base, origem, resultado, erro: false }))
      .catch(() => !cancelado && setEstado((anterior) => ({ base, origem, resultado: anterior?.base === base ? anterior.resultado : null, erro: true })))
    return () => {
      cancelado = true
    }
  }, [base, origem, chave])

  const recarregar = useCallback(() => setGatilho((valor) => valor + 1), [])
  const mesmaBase = estado?.base === base
  return {
    // Ao recarregar os mesmos IDs, mantem o que havia ate a resposta nova chegar.
    resultado: mesmaBase ? estado.resultado : null,
    erro: estado?.origem === origem ? estado.erro : false,
    carregando: estado?.origem !== origem,
    recarregar,
  }
}
