'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Marca } from './marca'
import { GRUPOS_DE_NAVEGACAO, normalizarCaminho } from './navegacao'

/** Conteudo da barra lateral; usado fixo no desktop e na gaveta do mobile. */
export function ConteudoDaLateral({ aoNavegar }: { aoNavegar?: () => void }) {
  const atual = normalizarCaminho(usePathname())

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-5">
        <Link href="/" onClick={aoNavegar} className="rounded-md text-white outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-indicator/50">
          <Marca />
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {GRUPOS_DE_NAVEGACAO.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="mb-1.5 px-2.5 text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">
              {grupo.titulo}
            </p>
            <ul className="space-y-0.5">
              {grupo.itens.map(({ caminho, rotulo, icone: Icone }) => {
                const ativo = atual === caminho
                return (
                  <li key={caminho}>
                    <Link
                      href={caminho}
                      onClick={aoNavegar}
                      aria-current={ativo ? 'page' : undefined}
                      className={cn(
                        'group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-white focus-visible:ring-[3px] focus-visible:ring-sidebar-indicator/50',
                        ativo && 'bg-sidebar-active text-white shadow-[inset_3px_0_var(--sidebar-indicator)]',
                      )}
                    >
                      <Icone
                        className={cn('size-4 shrink-0 transition-colors', ativo ? 'text-white' : 'text-sidebar-foreground/80')}
                        aria-hidden="true"
                      />
                      {rotulo}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-indicator opacity-40" />
            <span className="relative inline-flex size-2 rounded-full bg-sidebar-indicator" />
          </span>
          <p className="text-xs font-medium text-white">Ambiente acadêmico</p>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-sidebar-muted">
          Dados sintéticos · CESAR School 2026.2
        </p>
      </div>
    </div>
  )
}

export function Lateral() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block">
      <ConteudoDaLateral />
    </aside>
  )
}
