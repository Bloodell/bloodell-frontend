'use client'

import { Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Linha de filtros acima da tabela: busca a esquerda, selects a direita. */
export function BarraDeFiltros({
  children,
  ativos = 0,
  aoLimpar,
  className,
}: {
  children: ReactNode
  ativos?: number
  aoLimpar?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2 border-b px-6 py-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
      {ativos > 0 && aoLimpar && (
        <Button variant="ghost" size="sm" onClick={aoLimpar} className="sm:ml-auto">
          <X />
          Limpar filtros
          <span className="rounded bg-muted px-1.5 text-[11px] font-medium tabular-nums">{ativos}</span>
        </Button>
      )}
    </div>
  )
}

export function CampoDeBusca({
  valor,
  aoMudar,
  placeholder,
  rotulo,
}: {
  valor: string
  aoMudar: (valor: string) => void
  placeholder: string
  rotulo: string
}) {
  return (
    <div className="relative w-full sm:w-64">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        placeholder={placeholder}
        aria-label={rotulo}
        className="h-8 pl-9 text-[13px]"
      />
    </div>
  )
}
