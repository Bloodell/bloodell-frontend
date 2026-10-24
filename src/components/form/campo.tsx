import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Propriedades que o controle (input, select) precisa para ficar acessivel. */
export interface PropsDoControle {
  id: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
}

/**
 * Rotulo + controle + ajuda/erro, ligados por id e aria-describedby. O erro
 * substitui a ajuda no mesmo lugar, para o layout nao pular.
 */
export function Campo({
  id,
  rotulo,
  ajuda,
  erro,
  opcional,
  className,
  children,
}: {
  id: string
  rotulo: string
  ajuda?: ReactNode
  erro?: string
  opcional?: boolean
  className?: string
  children: (props: PropsDoControle) => ReactNode
}) {
  const idDaMensagem = erro || ajuda ? `${id}-mensagem` : undefined

  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={id}>
        {rotulo}
        {opcional && <span className="font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children({ id, 'aria-invalid': erro ? true : undefined, 'aria-describedby': idDaMensagem })}
      {erro ? (
        <p id={idDaMensagem} className="flex items-center gap-1.5 text-xs text-destructive animate-entrar">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {erro}
        </p>
      ) : (
        ajuda && (
          <p id={idDaMensagem} className="text-xs text-muted-foreground">
            {ajuda}
          </p>
        )
      )}
    </div>
  )
}
