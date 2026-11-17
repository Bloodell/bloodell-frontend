'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, assinarSessaoExpirada, configurarCredencial } from '@/lib/api/cliente'
import { ContextoDeEscopo } from '@/lib/api/escopo'
import type { RespostaLogin, UsuarioAtual } from '@/lib/api/tipos'
import { EM_DEMONSTRACAO } from '@/lib/ambiente'
import { prazoDaSessao } from './sessao'

export type EstadoDaSessao = 'anonima' | 'autenticando' | 'autenticada' | 'demonstracao'
export type MotivoDaSaida = 'manual' | 'expirada'

export interface Sessao {
  estado: EstadoDaSessao
  usuario: UsuarioAtual | null
  /** Muda a cada login/saida: consultas de outra geracao sao descartadas. */
  geracao: number
  /** Por que a ultima sessao terminou (para a tela de login explicar). */
  motivo: MotivoDaSaida | null
  demonstracao: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: (motivo?: MotivoDaSaida) => void
  atualizarUsuario: () => Promise<void>
}

const ContextoDaSessao = createContext<Sessao | null>(null)

/** Reconsulta /auth/me ao voltar para a aba, no maximo uma vez por intervalo. */
const INTERVALO_DE_RECONSULTA_MS = 30_000

/**
 * Sessao so em memoria (decisao do produto): o token nunca vai para
 * localStorage nem cookie. Recarregar a pagina pede login de novo; nao ha
 * refresh token no backend. A expiracao segue o expiresIn devolvido no login.
 */
export function ProvedorDeSessao({ children, demonstracao = EM_DEMONSTRACAO }: { children: ReactNode; demonstracao?: boolean }) {
  const [estado, setEstado] = useState<EstadoDaSessao>(demonstracao ? 'demonstracao' : 'anonima')
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null)
  const [geracao, setGeracao] = useState(0)
  const [motivo, setMotivo] = useState<MotivoDaSaida | null>(null)

  const token = useRef<string | null>(null)
  const tentativa = useRef(0)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimaReconsulta = useRef(0)

  useEffect(() => {
    configurarCredencial(() => token.current)
    return () => configurarCredencial(() => null)
  }, [])

  const limparTemporizador = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null
  }, [])

  const sair = useCallback(
    (motivoDaSaida: MotivoDaSaida = 'manual') => {
      if (demonstracao) return
      // Invalida qualquer login ainda em voo: a resposta dele sera ignorada.
      tentativa.current += 1
      limparTemporizador()
      const tinhaSessao = token.current !== null
      token.current = null
      setUsuario(null)
      setEstado('anonima')
      setMotivo(motivoDaSaida)
      if (tinhaSessao || motivoDaSaida === 'manual') setGeracao((valor) => valor + 1)
    },
    [demonstracao, limparTemporizador],
  )

  const entrar = useCallback(
    async (email: string, senha: string) => {
      if (demonstracao) return
      const minha = ++tentativa.current
      setEstado('autenticando')
      let resposta: RespostaLogin
      try {
        resposta = await api.enviarAnonimo<RespostaLogin>('/auth/login', { email: email.trim(), senha })
      } catch (falha) {
        if (minha === tentativa.current) setEstado('anonima')
        throw falha
      }
      // Saiu (ou tentou outro login) enquanto este respondia: descarta.
      if (minha !== tentativa.current) return

      token.current = resposta.accessToken
      ultimaReconsulta.current = Date.now()
      setUsuario(resposta.usuario)
      setMotivo(null)
      setGeracao((valor) => valor + 1)
      setEstado('autenticada')

      limparTemporizador()
      temporizador.current = setTimeout(() => sair('expirada'), prazoDaSessao(resposta.expiresIn))
    },
    [demonstracao, limparTemporizador, sair],
  )

  const atualizarUsuario = useCallback(async () => {
    if (demonstracao || !token.current) return
    const minha = tentativa.current
    ultimaReconsulta.current = Date.now()
    try {
      const atual = await api.buscar<UsuarioAtual>('/auth/me')
      if (minha === tentativa.current && token.current) setUsuario(atual)
    } catch {
      // 401 ja encerra a sessao pelo ouvinte; outras falhas mantem o que havia.
    }
  }, [demonstracao])

  // 401 em qualquer requisicao autenticada = token nao vale mais.
  useEffect(() => {
    if (demonstracao) return
    return assinarSessaoExpirada(() => {
      if (token.current) sair('expirada')
    })
  }, [demonstracao, sair])

  // Perfil pode mudar em outra sessao (ex.: admin rebaixou esta conta).
  useEffect(() => {
    if (demonstracao || estado !== 'autenticada') return
    function aoVoltar() {
      if (document.visibilityState === 'hidden') return
      if (Date.now() - ultimaReconsulta.current < INTERVALO_DE_RECONSULTA_MS) return
      void atualizarUsuario()
    }
    window.addEventListener('focus', aoVoltar)
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      window.removeEventListener('focus', aoVoltar)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [demonstracao, estado, atualizarUsuario])

  useEffect(() => limparTemporizador, [limparTemporizador])

  const valor = useMemo<Sessao>(
    () => ({ estado, usuario, geracao, motivo, demonstracao, entrar, sair, atualizarUsuario }),
    [estado, usuario, geracao, motivo, demonstracao, entrar, sair, atualizarUsuario],
  )

  return (
    <ContextoDaSessao.Provider value={valor}>
      <ContextoDeEscopo.Provider value={geracao}>{children}</ContextoDeEscopo.Provider>
    </ContextoDaSessao.Provider>
  )
}

export function useSessao(): Sessao {
  const sessao = useContext(ContextoDaSessao)
  if (!sessao) throw new Error('useSessao precisa estar dentro de <ProvedorDeSessao>.')
  return sessao
}
