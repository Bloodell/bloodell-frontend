import { cn } from '@/lib/utils'

const NOME_DO_RH: Record<string, string> = { '+': 'positivo', '-': 'negativo' }

const TAMANHOS = {
  sm: { caixa: 'size-8 rounded-md', letra: 'text-rotulo' },
  md: { caixa: 'size-11 rounded-lg', letra: 'text-subtitulo' },
  lg: { caixa: 'size-16 rounded-xl', letra: 'text-metrica' },
} as const

/**
 * O tipo sanguineo (A+, O-...) como objeto grafico: o dado mais importante do
 * produto nao pode ser texto comum. Rh positivo e bloco cheio; Rh negativo e
 * bloco vazado com sinal "−": a diferenca nao depende de cor.
 */
export function MonogramaDeTipo({
  tipo,
  tamanho = 'md',
  className,
}: {
  tipo: string
  tamanho?: keyof typeof TAMANHOS
  className?: string
}) {
  const sinal = tipo.slice(-1)
  const abo = tipo.slice(0, -1)
  const negativo = sinal === '-'
  const { caixa, letra } = TAMANHOS[tamanho]

  return (
    <span
      role="img"
      aria-label={`Tipo ${abo} ${NOME_DO_RH[sinal] ?? ''}`.trim()}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-mono font-bold tracking-tight select-none',
        caixa,
        letra,
        negativo ? 'border-2 border-foreground/70 bg-transparent text-foreground' : 'bg-foreground text-background',
        className,
      )}
    >
      <span aria-hidden="true" className="flex items-start leading-none">
        {abo}
        <sup className="ml-px text-[0.7em] leading-none font-extrabold">{negativo ? '−' : '+'}</sup>
      </span>
    </span>
  )
}
