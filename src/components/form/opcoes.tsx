import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Cartao marcavel (checkbox), para escolhas multiplas com descricao. */
export function OpcaoMarcavel({
  marcada,
  aoAlternar,
  titulo,
  descricao,
  invalida,
}: {
  marcada: boolean
  aoAlternar: () => void
  titulo: string
  descricao?: ReactNode
  invalida?: boolean
}) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-[border-color,background-color,box-shadow] hover:bg-muted/40 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40',
        marcada && 'border-primary/40 bg-secondary/60',
        invalida && !marcada && 'border-destructive/40',
      )}
    >
      <input type="checkbox" className="sr-only" checked={marcada} onChange={aoAlternar} />
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-input shadow-xs transition-colors',
          marcada && 'border-primary bg-primary text-primary-foreground',
        )}
        aria-hidden="true"
      >
        <Check className={cn('size-3 scale-50 opacity-0 transition-all', marcada && 'scale-100 opacity-100')} strokeWidth={3} />
      </span>
      <span className="grid gap-0.5">
        <span className="text-sm font-medium">{titulo}</span>
        {descricao && <span className="text-xs text-muted-foreground">{descricao}</span>}
      </span>
    </label>
  )
}

/** Controle segmentado (radio), para escolher um entre poucos valores. */
export function GrupoDeOpcoes<T extends string>({
  nome,
  valor,
  aoMudar,
  opcoes,
  rotulo,
}: {
  nome: string
  valor: T
  aoMudar: (valor: T) => void
  opcoes: { valor: T; rotulo: string; marcador?: ReactNode }[]
  rotulo: string
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1">
      {opcoes.map((opcao) => (
        <label
          key={opcao.valor}
          className={cn(
            'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:text-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40',
            valor === opcao.valor && 'bg-background text-foreground shadow-sm dark:bg-input/40',
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name={nome}
            value={opcao.valor}
            checked={valor === opcao.valor}
            onChange={() => aoMudar(opcao.valor)}
          />
          {opcao.marcador}
          {opcao.rotulo}
        </label>
      ))}
    </div>
  )
}
