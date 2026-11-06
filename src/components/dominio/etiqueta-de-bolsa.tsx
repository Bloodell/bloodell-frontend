import type { ReactNode } from 'react'
import { Validade } from '@/features/estoque/validade'
import { COMPONENTES } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import { MonogramaDeTipo } from './monograma-de-tipo'

/**
 * A Etiqueta de Bolsa: o objeto visual do BLOODELL. Reproduz o que se le no
 * rotulo de uma bolsa (codigo, tipo, componente, prazo) e e reutilizada em
 * estoque, fila, alocacao e rastreio.
 */
export function EtiquetaDeBolsa({
  codigo,
  tipoSanguineo,
  componente,
  dataValidade,
  diasParaVencer,
  dataColeta,
  unidade,
  acao,
  className,
}: {
  codigo: string
  tipoSanguineo: string
  componente: string
  dataValidade: string
  diasParaVencer: number
  dataColeta?: string
  unidade?: string
  acao?: ReactNode
  className?: string
}) {
  const nomeDoComponente = COMPONENTES.find((item) => item.valor === componente)?.rotulo ?? componente

  return (
    <article
      className={cn('flex items-stretch gap-3 rounded-lg border bg-card p-3 shadow-xs', className)}
      aria-label={`Bolsa ${codigo}`}
    >
      <MonogramaDeTipo tipo={tipoSanguineo} tamanho="lg" />
      <div className="grid min-w-0 flex-1 content-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-rotulo font-semibold">{codigo}</p>
          <p className="truncate text-apoio text-muted-foreground">
            {nomeDoComponente}
            {unidade && <> &middot; {unidade}</>}
          </p>
        </div>
        <Validade
          dataValidade={dataValidade}
          diasParaVencer={diasParaVencer}
          componente={componente}
          dataColeta={dataColeta}
          barra
        />
      </div>
      {acao && <div className="shrink-0 self-start">{acao}</div>}
    </article>
  )
}
