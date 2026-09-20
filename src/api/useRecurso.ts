import { useCallback, useEffect, useState } from 'react'
import { ErroDaApi, api } from './cliente'

interface EstadoDoRecurso<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

export function useRecurso<T>(caminho: string | null): EstadoDoRecurso<T> {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(caminho !== null)
  const [erro, setErro] = useState<string | null>(null)
  const [gatilho, setGatilho] = useState(0)

  const recarregar = useCallback(() => setGatilho((valor) => valor + 1), [])

  useEffect(() => {
    if (caminho === null) {
      setCarregando(false)
      return
    }

    let cancelado = false
    setCarregando(true)
    setErro(null)

    api
      .buscar<T>(caminho)
      .then((resposta) => {
        if (!cancelado) {
          setDados(resposta)
        }
      })
      .catch((falha: unknown) => {
        if (cancelado) {
          return
        }
        setErro(falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Erro inesperado ao consultar a API.')
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [caminho, gatilho])

  return { dados, carregando, erro, recarregar }
}