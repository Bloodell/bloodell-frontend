import type { ReactNode } from 'react'

/** Titulo da pagina com descricao curta e acoes alinhadas a direita. */
export function Cabecalho({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string
  descricao: string
  acoes?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{titulo}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground text-pretty">{descricao}</p>
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  )
}
