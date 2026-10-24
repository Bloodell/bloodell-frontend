'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from './cliente'

export interface EstadoDoRecurso<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

interface Resposta<T> {
  chave: string
  dados: T | null
  erro: string | null
}

/**
 * Todo consumo da API passa por aqui. Entrega os tres estados que uma tela
 * precisa tratar: carregando, erro e dados (vazio e decidido por quem usa).
 * Caminho null = nao buscar ainda (ex.: nenhuma bolsa selecionada).
 *
 * Enquanto uma nova busca roda (filtro trocado, "Atualizar"), os dados
 * anteriores continuam na tela, para a tabela nao piscar vazia.
 */
export function useRecurso<T>(caminho: string | null): EstadoDoRecurso<T> {
  const [gatilho, setGatilho] = useState(0)
  const [resposta, setResposta] = useState<Resposta<T> | null>(null)

  const recarregar = useCallback(() => setGatilho((valor) => valor + 1), [])

  // Cada busca tem uma chave; "carregando" e simplesmente "a ultima resposta
  // ainda nao e desta chave".
  const chave = caminho === null ? null : `${gatilho}:${caminho}`

  useEffect(() => {
    if (chave === null || caminho === null) return

    let cancelado = false
    api
      .buscar<T>(caminho)
      .then((dados) => {
        if (!cancelado) setResposta({ chave, dados, erro: null })
      })
      .catch((falha: unknown) => {
        if (!cancelado) {
          const erro = mensagemDeErro(falha, 'Erro inesperado ao consultar a API.')
          setResposta((anterior) => ({ chave, dados: anterior?.dados ?? null, erro }))
        }
      })

    return () => {
      cancelado = true
    }
  }, [chave, caminho])

  const atual = resposta?.chave === chave
  return {
    dados: resposta?.dados ?? null,
    carregando: chave !== null && !atual,
    erro: atual ? (resposta?.erro ?? null) : null,
    recarregar,
  }
}
