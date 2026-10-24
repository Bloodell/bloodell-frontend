import type { ContagemPorCategoria } from '@/lib/api/tipos'
import { PRIORIDADES, numero } from '@/lib/formatos'
import { cn } from '@/lib/utils'

const COR: Record<string, string> = {
  EMERGENCIA: 'bg-red-500',
  URGENTE: 'bg-amber-500',
  ELETIVA: 'bg-success',
}

/** Barras horizontais: mais facil de comparar que uma pizza. */
export function DemandaPorPrioridade({ dados }: { dados: ContagemPorCategoria[] }) {
  const total = dados.reduce((soma, item) => soma + item.quantidade, 0)
  const porPrioridade = new Map(dados.map((item) => [item.categoria, item.quantidade]))

  return (
    <ul className="space-y-5">
      {PRIORIDADES.map((prioridade) => {
        const quantidade = porPrioridade.get(prioridade.valor) ?? 0
        const parte = total ? (quantidade / total) * 100 : 0
        return (
          <li key={prioridade.valor}>
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={cn('size-2 rounded-full', COR[prioridade.valor])} aria-hidden="true" />
                {prioridade.rotulo}
              </span>
              <span className="tabular-nums">
                <span className="font-medium">{numero(quantidade)}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{parte.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full transition-[width] duration-700 ease-out', COR[prioridade.valor])}
                style={{ width: `${parte}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
