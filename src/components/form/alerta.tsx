import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const estilos = {
  sucesso: {
    caixa: 'border-emerald-600/20 bg-emerald-500/6 text-emerald-900 dark:text-emerald-200',
    icone: CheckCircle2,
    corDoIcone: 'text-emerald-600 dark:text-emerald-400',
  },
  erro: {
    caixa: 'border-destructive/25 bg-destructive/5 text-foreground',
    icone: AlertCircle,
    corDoIcone: 'text-destructive',
  },
  info: {
    caixa: 'border-border bg-muted/40 text-foreground',
    icone: Info,
    corDoIcone: 'text-muted-foreground',
  },
} as const

/** Faixa de resultado de formulario: sucesso, erro da API ou informacao. */
export function Alerta({
  tipo,
  titulo,
  children,
  aoFechar,
  className,
}: {
  tipo: keyof typeof estilos
  titulo: string
  children?: ReactNode
  aoFechar?: () => void
  className?: string
}) {
  const { caixa, icone: Icone, corDoIcone } = estilos[tipo]

  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm animate-entrar', caixa, className)}
    >
      <Icone className={cn('mt-0.5 size-4 shrink-0', corDoIcone)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{titulo}</p>
        {children && <div className="mt-0.5 text-[13px] text-muted-foreground">{children}</div>}
      </div>
      {aoFechar && (
        <button
          type="button"
          onClick={aoFechar}
          className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Fechar aviso"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
