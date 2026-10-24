import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Um no da estrutura: cartao pequeno com codigo e detalhes. */
export function No({ titulo, children, destaque }: { titulo: string; children?: ReactNode; destaque?: boolean }) {
  return (
    <div
      className={cn(
        'flex w-44 shrink-0 flex-col rounded-lg border bg-card p-3 shadow-xs',
        destaque && 'border-primary/40 ring-1 ring-primary/15',
      )}
    >
      <p className="truncate font-mono text-xs font-medium">{titulo}</p>
      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">{children}</div>
    </div>
  )
}

/** Nos encadeados da esquerda para a direita, terminando em null. */
export function Encadeamento({ children }: { children: ReactNode[] }) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-2">
      <ol className="flex w-max items-stretch gap-2">
        {children.map((filho, indice) => (
          <li key={indice} className="flex items-stretch gap-2">
            {filho}
            <span className="flex items-center" aria-hidden="true">
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/60" />
            </span>
          </li>
        ))}
        <li className="self-center rounded-md border border-dashed px-2.5 py-1 font-mono text-xs text-muted-foreground">
          null
        </li>
      </ol>
    </div>
  )
}

export function EsqueletoDeNos() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[0, 1, 2, 3, 4].map((indice) => (
        <Skeleton key={indice} className="h-[84px] w-44 shrink-0 rounded-lg" />
      ))}
    </div>
  )
}
