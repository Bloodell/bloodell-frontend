'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Alerta } from './alerta'

/**
 * Confirmacao de acao irreversivel (excluir, cancelar). Nomeia a entidade e
 * descreve o efeito REAL; o foco abre no botao seguro ("Voltar").
 */
export function ConfirmarAcao({
  aberto,
  titulo,
  descricao,
  rotuloDaAcao,
  ocupado,
  erro,
  aoConfirmar,
  aoFechar,
}: {
  aberto: boolean
  titulo: string
  descricao: ReactNode
  rotuloDaAcao: string
  ocupado?: boolean
  erro?: string | null
  aoConfirmar: () => void
  aoFechar: () => void
}) {
  return (
    <Dialog.Root open={aberto} onOpenChange={(valor) => !valor && !ocupado && aoFechar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_160ms_ease-out]" />
        <Dialog.Content
          role="alertdialog"
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-popover p-6 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-entrar"
        >
          <div className="flex gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-critico-suave">
              <AlertTriangle className="size-4 text-critico" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <Dialog.Title className="text-base font-semibold tracking-tight">{titulo}</Dialog.Title>
              <Dialog.Description asChild>
                <div className="text-rotulo text-muted-foreground">{descricao}</div>
              </Dialog.Description>
            </div>
          </div>
          {erro && (
            <Alerta tipo="erro" titulo="A API recusou" className="mt-4">
              {erro}
            </Alerta>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={ocupado} autoFocus>
                Voltar
              </Button>
            </Dialog.Close>
            <Button variant="destructive" carregando={ocupado} onClick={aoConfirmar}>
              {rotuloDaAcao}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
