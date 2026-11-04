import { cva, type VariantProps } from 'class-variance-authority'
import { Circle, CircleArrowRight, CircleCheck, Clock, OctagonAlert, Snowflake, type LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { Tom } from '@/lib/formatos'
import { cn } from '@/lib/utils'

/**
 * Cada tom e um PAPEL operacional (ver globals.css), nao uma cor solta:
 *   sucesso  estavel      disponivel, dentro da faixa, atendida
 *   atencao  ambar        vence em breve, fila urgente
 *   erro     grena        emergencia, vencida, fora da faixa
 *   frio     azul-gelo    transporte refrigerado, telemetria
 *   info     tinta        em andamento (reservada, alocada)
 *   neutro   cinza        sem estado especial
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-apoio font-medium whitespace-nowrap',
  {
    variants: {
      tom: {
        neutro: 'border-border bg-muted text-muted-foreground',
        sucesso: 'border-estavel/25 bg-estavel-suave text-estavel',
        atencao: 'border-atencao/30 bg-atencao-suave text-atencao',
        erro: 'border-critico/30 bg-critico-suave text-critico',
        frio: 'border-frio/25 bg-frio-suave text-frio',
        info: 'border-secondary-foreground/20 bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: { tom: 'neutro' },
  },
)

/** O icone e o segundo canal (alem do texto): o estado nao depende da cor. */
const iconeDoTom: Record<Tom, LucideIcon> = {
  neutro: Circle,
  sucesso: CircleCheck,
  atencao: Clock,
  erro: OctagonAlert,
  frio: Snowflake,
  info: CircleArrowRight,
}

/** Etiqueta de status: icone do papel + texto. `ponto={false}` tira o icone. */
export function Badge({
  className,
  tom,
  ponto = true,
  children,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { ponto?: boolean }) {
  const Icone = iconeDoTom[tom ?? 'neutro']
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tom }), className)} {...props}>
      {ponto && <Icone className={cn('size-3 shrink-0', (tom ?? 'neutro') === 'neutro' && 'size-2 fill-current')} aria-hidden="true" />}
      {children}
    </span>
  )
}
