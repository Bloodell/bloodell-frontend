import { TIPOS_SANGUINEOS } from '@/lib/formatos'
import { cn } from '@/lib/utils'

/** Os 8 tipos ABO/Rh como grade de botoes de radio (4 x 2). */
export function SeletorDeTipoSanguineo({
  id,
  nome,
  valor,
  aoMudar,
}: {
  id: string
  nome: string
  valor: string
  aoMudar: (valor: string) => void
}) {
  return (
    <div id={id} role="radiogroup" aria-label="Tipo sanguíneo" className="grid grid-cols-4 gap-1.5">
      {TIPOS_SANGUINEOS.map((tipo) => (
        <label
          key={tipo}
          className={cn(
            'flex h-9 cursor-pointer items-center justify-center rounded-md border font-mono text-[13px] font-semibold text-muted-foreground shadow-xs transition-all hover:border-primary/30 hover:text-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40',
            valor === tipo &&
              'border-primary bg-primary text-primary-foreground hover:border-primary hover:text-primary-foreground',
          )}
        >
          <input
            type="radio"
            name={nome}
            value={tipo}
            className="sr-only"
            checked={valor === tipo}
            onChange={() => aoMudar(tipo)}
          />
          {tipo}
        </label>
      ))}
    </div>
  )
}
