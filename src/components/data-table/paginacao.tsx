'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { numero } from '@/lib/formatos'
import { cn } from '@/lib/utils'

/** Monta [0, 1, 'gap', 5, 6, 7, 'gap', 12] em torno da pagina atual. */
function paginasVisiveis(atual: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, indice) => indice)
  const meio = new Set([0, total - 1, atual - 1, atual, atual + 1].filter((p) => p >= 0 && p < total))
  const ordenadas = [...meio].sort((a, b) => a - b)
  return ordenadas.flatMap((pagina, indice) =>
    indice > 0 && pagina - ordenadas[indice - 1] > 1 ? (['gap', pagina] as const) : [pagina],
  )
}

/**
 * Paginacao visual. Paginas contam a partir de 0, como no Spring Data, e o
 * texto mostra a partir de 1, como as pessoas contam.
 */
export function Paginacao({
  pagina,
  totalPaginas,
  totalItens,
  tamanho,
  aoMudar,
  className,
}: {
  pagina: number
  totalPaginas: number
  totalItens: number
  tamanho: number
  aoMudar: (pagina: number) => void
  className?: string
}) {
  const inicio = totalItens === 0 ? 0 : pagina * tamanho + 1
  const fim = Math.min((pagina + 1) * tamanho, totalItens)
  const total = Math.max(totalPaginas, 1)

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        'flex flex-col-reverse items-center justify-between gap-3 border-t px-6 py-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-[13px] text-muted-foreground">
        Mostrando <span className="font-medium text-foreground tabular-nums">{numero(inicio)}–{numero(fim)}</span> de{' '}
        <span className="font-medium text-foreground tabular-nums">{numero(totalItens)}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={pagina === 0}
          onClick={() => aoMudar(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {paginasVisiveis(pagina, total).map((item, indice) =>
          item === 'gap' ? (
            <span key={`gap-${indice}`} className="w-8 text-center text-muted-foreground" aria-hidden="true">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === pagina ? 'outline' : 'ghost'}
              size="icon-sm"
              aria-current={item === pagina ? 'page' : undefined}
              aria-label={`Página ${item + 1}`}
              onClick={() => aoMudar(item)}
              className={cn('tabular-nums', item === pagina && 'text-foreground')}
            >
              {item + 1}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={pagina + 1 >= total}
          onClick={() => aoMudar(pagina + 1)}
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
