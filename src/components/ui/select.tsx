import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { estiloDeCampo } from './input'

/**
 * Select nativo com a pele do shadcn. Nativo de proposito: teclado, leitor de
 * tela e mobile funcionam sem nenhuma biblioteca extra.
 */
export function Select({
  className,
  compacto,
  children,
  ...props
}: ComponentProps<'select'> & { compacto?: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <select
        data-slot="select"
        className={cn(
          estiloDeCampo,
          'cursor-pointer appearance-none pr-9 [&>option]:bg-popover',
          compacto && 'h-8 text-[13px]',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}
