import { data } from '@/lib/formatos'
import { cn } from '@/lib/utils'

/** Data de validade com a contagem de dias, que e o que o tecnico precisa ver. */
export function Validade({ dataValidade, diasParaVencer }: { dataValidade: string; diasParaVencer: number }) {
  const vencida = diasParaVencer < 0
  const proxima = !vencida && diasParaVencer <= 7

  return (
    <div className="grid gap-0.5">
      <span className="tabular-nums">{data(dataValidade)}</span>
      <span
        className={cn(
          'text-xs text-muted-foreground',
          proxima && 'font-medium text-amber-700 dark:text-amber-400',
          vencida && 'font-medium text-destructive',
        )}
      >
        {vencida
          ? `vencida há ${Math.abs(diasParaVencer)} dia(s)`
          : diasParaVencer === 0
            ? 'vence hoje'
            : `vence em ${diasParaVencer} dia(s)`}
      </span>
    </div>
  )
}
