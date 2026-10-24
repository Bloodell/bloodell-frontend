import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import type { Tom } from '@/lib/formatos'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tom: {
        neutro: 'border-border bg-muted/60 text-muted-foreground',
        sucesso: 'border-emerald-600/15 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400',
        atencao: 'border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        erro: 'border-red-600/15 bg-red-500/8 text-red-700 dark:text-red-400',
        info: 'border-sky-600/15 bg-sky-500/8 text-sky-700 dark:text-sky-400',
      },
    },
    defaultVariants: { tom: 'neutro' },
  },
)

const corDoPonto: Record<Tom, string> = {
  neutro: 'bg-muted-foreground/60',
  sucesso: 'bg-emerald-500',
  atencao: 'bg-amber-500',
  erro: 'bg-red-500',
  info: 'bg-sky-500',
}

/**
 * Etiqueta de status. O ponto colorido nunca vem sozinho: o texto ao lado diz
 * o estado, entao a informacao nao depende so de cor.
 */
export function Badge({
  className,
  tom,
  ponto = true,
  children,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { ponto?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tom }), className)} {...props}>
      {ponto && <span className={cn('size-1.5 rounded-full', corDoPonto[tom ?? 'neutro'])} aria-hidden="true" />}
      {children}
    </span>
  )
}
