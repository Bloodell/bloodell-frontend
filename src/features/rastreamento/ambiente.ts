'use client'

import { useSyncExternalStore } from 'react'
import type { TemaDoMapa } from './estilo-do-mapa'

let webglDisponivel: boolean | null = null

/**
 * WebGL utilizavel? O mapa 3D precisa dele; sem, a tela mostra so as listas.
 * O teste cria um contexto de verdade, entao roda uma vez so e o resultado fica
 * guardado (e o contexto de teste e liberado na hora).
 */
export function suportaWebgl(): boolean {
  if (webglDisponivel !== null) return webglDisponivel
  try {
    const tela = document.createElement('canvas')
    const contexto = tela.getContext('webgl2') ?? tela.getContext('webgl')
    webglDisponivel = !!contexto
    contexto?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglDisponivel = false
  }
  return webglDisponivel
}

function assinarTema(aoMudar: () => void) {
  const observador = new MutationObserver(aoMudar)
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observador.disconnect()
}

/** Tema atual da interface (classe `dark` no <html>), reativo ao botao da barra superior. */
export function useTemaDoMapa(): TemaDoMapa {
  return useSyncExternalStore(
    assinarTema,
    () => (document.documentElement.classList.contains('dark') ? 'escuro' : 'claro'),
    () => 'claro',
  )
}

function assinarMovimento(aoMudar: () => void) {
  const consulta = matchMedia('(prefers-reduced-motion: reduce)')
  consulta.addEventListener('change', aoMudar)
  return () => consulta.removeEventListener('change', aoMudar)
}

/** Preferencia do sistema por menos movimento (prefers-reduced-motion). */
export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    assinarMovimento,
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}
