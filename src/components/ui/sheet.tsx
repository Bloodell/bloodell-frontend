'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Painel lateral (padrao "Sheet" do shadcn), para detalhes sem trocar de pagina. */
export function Sheet({
  aberto,
  aoMudar,
  titulo,
  descricao,
  children,
  className,
}: {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  titulo: ReactNode
  descricao?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Dialog.Root open={aberto} onOpenChange={aoMudar}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-2xl outline-none data-[state=open]:animate-[sheet-in_280ms_cubic-bezier(0.22,1,0.36,1)]',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold tracking-tight">{titulo}</Dialog.Title>
              {descricao ? (
                <Dialog.Description className="mt-1 text-[13px] text-muted-foreground">{descricao}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Detalhes</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="-mr-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Separator({ className, ...props }: ComponentProps<'div'>) {
  return <div role="separator" className={cn('h-px w-full bg-border', className)} {...props} />
}
