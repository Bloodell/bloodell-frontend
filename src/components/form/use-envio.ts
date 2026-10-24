'use client'

import { useState } from 'react'
import { ErroDaApi } from '@/lib/api/cliente'

/**
 * Estado de um envio de formulario: enviando, erro geral e erros de campo
 * vindos da validacao do backend (RFC 7807, propriedade "campos").
 */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [errosDaApi, setErrosDaApi] = useState<Record<string, string>>({})

  async function executar<T>(acao: () => Promise<T>, mensagemPadrao: string): Promise<T | undefined> {
    setEnviando(true)
    setErro(null)
    setErrosDaApi({})
    try {
      return await acao()
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        // Os erros de campo aparecem embaixo de cada campo; aqui fica so o resumo.
        setErro(falha.problema.detail || falha.problema.title)
        setErrosDaApi(falha.errosDeCampo)
      } else {
        setErro(mensagemPadrao)
      }
      return undefined
    } finally {
      setEnviando(false)
    }
  }

  function limpar() {
    setErro(null)
    setErrosDaApi({})
  }

  return { enviando, erro, errosDaApi, executar, limpar }
}
