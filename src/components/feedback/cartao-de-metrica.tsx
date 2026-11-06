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
  /** Marca o indicador como critico (grena); sem destaque, o icone fica neutro. */
  destaque?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-rotulo font-medium text-muted-foreground">{rotulo}</p>
        <Icone className={cn('size-4', destaque ? 'text-critico' : 'text-muted-foreground')} aria-hidden="true" />
      </div>
      {carregando ? (
        <>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2.5 h-3.5 w-32" />
        </>
      ) : (
        <>
          <p className="mt-2 text-metrica leading-none font-semibold tracking-tight tabular-nums animate-entrar">{valor}</p>
          {contexto && <p className="mt-2.5 text-apoio text-muted-foreground">{contexto}</p>}
        </>
      )}
    </div>
  )
}
