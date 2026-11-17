'use client'

import { createContext, useContext } from 'react'

/**
 * Geracao da identidade atual. Muda a cada login, saida ou troca de usuario;
 * quem consulta a API usa esse numero para nunca mostrar dado de outra sessao.
 */
export const ContextoDeEscopo = createContext(0)

export function useEscopo(): number {
  return useContext(ContextoDeEscopo)
}
