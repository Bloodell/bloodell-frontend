import { CircleCheck, Clock, OctagonAlert } from 'lucide-react'
import { data } from '@/lib/formatos'
import { prazoTotalEmDias, situacaoDaValidade, textoDaValidade, type SituacaoDaValidade } from '@/lib/validade'
import { cn } from '@/lib/utils'

const ESTILO: Record<SituacaoDaValidade, { icone: typeof Clock; texto: string; barra: string }> = {
  vencida: { icone: OctagonAlert, texto: 'text-critico', barra: 'bg-critico' },
  atencao: { icone: Clock, texto: 'text-atencao', barra: 'bg-atencao' },
  normal: { icone: CircleCheck, texto: 'text-muted-foreground', barra: 'bg-estavel' },
}

/**
 * Prazo de uso da bolsa: a data, a contagem de dias (o que o tecnico precisa
 * ver) e, quando se sabe o componente, uma barra com a vida que resta.
 * Estado = icone + texto + cor; a barra e so reforco.
 */
export function Validade({
  dataValidade,
  diasParaVencer,
  componente,
  dataColeta,
  barra = false,
  className,
}: {
  dataValidade: string
  diasParaVencer: number
  componente?: string
  dataColeta?: string
  /** Desenha a barra de vida restante (exige `componente`). */
  barra?: boolean
  className?: string
}) {
  const prazo = prazoTotalEmDias(componente ?? '', dataColeta, dataValidade)
  const situacao = situacaoDaValidade(diasParaVencer, prazo)
  const { icone: Icone, texto, barra: corDaBarra } = ESTILO[situacao]
  const restante = Math.min(1, Math.max(0, diasParaVencer / prazo))
  const largura = situacao === 'vencida' ? 0 : Math.max(restante * 100, 4)

  return (
    <div className={cn('grid gap-1', className)}>
      <span className="tabular-nums">{data(dataValidade)}</span>
      <span className={cn('flex items-center gap-1 text-apoio', texto, situacao !== 'normal' && 'font-medium')}>
        <Icone className="size-3 shrink-0" aria-hidden="true" />
        {textoDaValidade(diasParaVencer)}
      </span>
      {barra && componente && (
        <span
          role="meter"
          aria-label="Vida útil restante"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(restante * 100)}
          aria-valuetext={`${Math.max(diasParaVencer, 0)} de ${prazo} dias`}
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <span className={cn('block h-full rounded-full', corDaBarra)} style={{ width: `${largura}%` }} />
        </span>
      )}
    </div>
  )
}
