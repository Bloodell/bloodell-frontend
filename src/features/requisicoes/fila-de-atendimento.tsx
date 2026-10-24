import { ListOrdered } from 'lucide-react'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { ItemDaFila } from '@/lib/api/tipos'
import { rotulo, tomDaPrioridade } from '@/lib/formatos'
import { cn } from '@/lib/utils'

/**
 * A fila na ordem que a estrutura da AED produziu no backend: prioridade e,
 * dentro dela, ordem de chegada. A tela nao reordena nada.
 */
export function FilaDeAtendimento({ fila }: { fila: EstadoDoRecurso<ItemDaFila[]> }) {
  if (fila.erro) return <EstadoDeErro mensagem={fila.erro} aoTentarNovamente={fila.recarregar} />

  if (fila.carregando && !fila.dados) {
    return (
      <ol className="divide-y">
        {[0, 1, 2, 3].map((indice) => (
          <li key={indice} className="flex items-center gap-3 px-6 py-3.5">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </li>
        ))}
      </ol>
    )
  }

  const itens = fila.dados ?? []
  if (itens.length === 0) {
    return (
      <EstadoVazio
        icone={ListOrdered}
        titulo="Fila vazia"
        descricao="Nenhuma requisição aguardando. As novas entram aqui na posição da sua prioridade."
      />
    )
  }

  return (
    <ol className={cn('divide-y transition-opacity', fila.carregando && 'opacity-60')}>
      {itens.map((item, indice) => (
        <li key={item.codigo} className={cn('flex items-center gap-3 px-6 py-3 animate-entrar', indice === 0 && 'bg-muted/40')}>
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
              indice === 0 && 'border-primary bg-primary text-primary-foreground',
            )}
          >
            {item.posicao}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm">
              <span className="truncate font-mono text-[13px]">{item.codigo}</span>
              {indice === 0 && <span className="text-[11px] font-medium text-muted-foreground">próxima</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {item.hospital} · chegada #{item.sequenciaChegada}
            </p>
          </div>
          <Badge tom={tomDaPrioridade(item.prioridade)}>{rotulo(item.prioridade)}</Badge>
        </li>
      ))}
    </ol>
  )
}
