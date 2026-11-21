'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AcessoAutenticado } from '@/features/autenticacao/acesso-autenticado'
import { ProvedorDeSessao } from '@/features/autenticacao/provedor-de-sessao'
import { BarraSuperior } from './barra-superior'
import { Lateral } from './lateral'
import { normalizarCaminho } from './navegacao'

/** Paginas fora do chrome operacional (sem lateral nem exigencia de login). */
const PAGINAS_ABERTAS = new Set(['/login'])

export function EstruturaDaAplicacao({ children }: { children: ReactNode }) {
  const caminho = normalizarCaminho(usePathname())

  return (
    <ProvedorDeSessao>
      {PAGINAS_ABERTAS.has(caminho) ? (
        children
      ) : (
        <AcessoAutenticado>
          <Lateral />
          <div className="lg:pl-60">
            <BarraSuperior />
            <main id="conteudo" className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
              {children}
            </main>
          </div>
        </AcessoAutenticado>
      )}
    </ProvedorDeSessao>
  )
}
