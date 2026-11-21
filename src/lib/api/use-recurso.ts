'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro, statusDaFalha } from './cliente'
import { useEscopo } from './escopo'

export interface EstadoDoRecurso<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  /** Status HTTP da ultima falha (401, 403, 404...), ou null. */
  statusHttp: number | null
  recarregar: () => void
}

interface Resposta<T> {
  chave: string
  /** Caminho + escopo: os dados so valem para a mesma entidade e sessao. */
  origem: string
  dados: T | null
  erro: string | null
  statusHttp: number | null
}

/**
 * Todo consumo da API passa por aqui. Entrega os tres estados que uma tela
 * precisa tratar: carregando, erro e dados (vazio e decidido por quem usa).
 * Caminho null = nao buscar ainda (ex.: nenhuma bolsa selecionada).
 *
 * "Atualizar" a mesma consulta mantem os dados na tela (a tabela nao pisca).
 * Trocar de caminho, de sessao ou passar null descarta o que havia, para
 * nunca exibir dado de outra entidade ou de outra pessoa.
 */
export function useRecurso<T>(caminho: string | null): EstadoDoRecurso<T> {
  const escopo = useEscopo()
  const [gatilho, setGatilho] = useState(0)
  const [resposta, setResposta] = useState<Resposta<T> | null>(null)

  const recarregar = useCallback(() => setGatilho((valor) => valor + 1), [])

  const origem = caminho === null ? null : `${escopo}|${caminho}`
  const chave = origem === null ? null : `${gatilho}|${origem}`

  useEffect(() => {
    if (chave === null || origem === null || caminho === null) return

    const controle = new AbortController()
    api
      .buscar<T>(caminho, controle.signal)
      .then((dados) => {
        if (!controle.signal.aborted) setResposta({ chave, origem, dados, erro: null, statusHttp: null })
      })
      .catch((falha: unknown) => {
        if (controle.signal.aborted) return
        const erro = mensagemDeErro(falha, 'Erro inesperado ao consultar a API.')
        setResposta((anterior) => ({
          chave,
          origem,
          dados: anterior?.origem === origem ? anterior.dados : null,
          erro,
          statusHttp: statusDaFalha(falha),
        }))
      })

    return () => controle.abort()
  }, [chave, origem, caminho])

  const mesmaOrigem = resposta !== null && resposta.origem === origem
  const atual = mesmaOrigem && resposta.chave === chave
  return {
    dados: mesmaOrigem ? resposta.dados : null,
    carregando: chave !== null && !atual,
    erro: atual ? resposta.erro : null,
    statusHttp: atual ? resposta.statusHttp : null,
    recarregar,
  }
}
