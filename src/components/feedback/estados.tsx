import { AlertCircle, Inbox, RotateCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Nada para mostrar -- e por que, e o que fazer a seguir. */
export function EstadoVazio({
  titulo,
  descricao,
  icone: Icone = Inbox,
  acao,
  className,
}: {
  titulo: string
  descricao?: ReactNode
  icone?: LucideIcon
  acao?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-muted/50 shadow-xs">
        <Icone className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  )
}

/** A API falhou: diz o que houve, com a mensagem real, e oferece nova tentativa. */
export function EstadoDeErro({
  mensagem,
  aoTentarNovamente,
  className,
}: {
  mensagem: string
  aoTentarNovamente?: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium">Não foi possível carregar</p>
      <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{mensagem}</p>
      {aoTentarNovamente && (
        <Button variant="outline" size="sm" className="mt-5" onClick={aoTentarNovamente}>
          <RotateCw />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
