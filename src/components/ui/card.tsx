import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Peso visual do painel, para a tela ter hierarquia e nao uma pilha de caixas iguais:
 *   padrao   painel comum
 *   destaque o que pede a atencao agora (borda forte e sombra)
 *   plano    apoio e contexto (sem sombra, fundo apagado)
 */
const pesos = {
  padrao: 'border bg-card shadow-xs',
  destaque: 'border-2 border-foreground/80 bg-card shadow-sm',
  plano: 'border border-dashed bg-muted/50',
} as const

export function Card({
  className,
  peso = 'padrao',
  ...props
}: ComponentProps<'section'> & { peso?: keyof typeof pesos }) {
  return (
    <section
      data-slot="card"
      data-peso={peso}
      className={cn('flex flex-col rounded-xl text-card-foreground', pesos[peso], className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-6 pt-5 pb-4', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-subtitulo font-semibold tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('mt-1.5 text-rotulo text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6 pb-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-3 border-t px-6 py-3.5 text-rotulo text-muted-foreground', className)}
      {...props}
    />
  )
}
