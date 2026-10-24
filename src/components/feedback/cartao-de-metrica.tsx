import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Numero-chave de uma tela: rotulo, valor grande e uma linha de contexto. */
export function CartaoDeMetrica({
  rotulo,
  valor,
  contexto,
  icone: Icone,
  carregando,
  destaque,
}: {
  rotulo: string
  valor: ReactNode
  contexto?: ReactNode
  icone: LucideIcon
  carregando?: boolean
  /** Pinta o icone de vermelho (sangue/alerta); sem destaque, fica verde. */
  destaque?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{rotulo}</p>
        <Icone className={cn('size-4', destaque ? 'text-brand' : 'text-primary/70')} aria-hidden="true" />
      </div>
      {carregando ? (
        <>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2.5 h-3.5 w-32" />
        </>
      ) : (
        <>
          <p className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums animate-entrar">{valor}</p>
          {contexto && <p className="mt-2.5 text-xs text-muted-foreground">{contexto}</p>}
        </>
      )}
    </div>
  )
}
