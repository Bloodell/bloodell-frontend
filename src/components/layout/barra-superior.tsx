'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { BookOpen, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlternarTema } from './alternar-tema'
import { ConteudoDaLateral } from './lateral'
import { TODAS_AS_PAGINAS, normalizarCaminho } from './navegacao'

// O Swagger fica no mesmo host da interface (o Nginx encaminha para a API).
const URL_DA_DOCUMENTACAO = process.env.NEXT_PUBLIC_DOCS_URL ?? '/swagger-ui.html'

export function BarraSuperior() {
  const [menuAberto, setMenuAberto] = useState(false)
  const atual = normalizarCaminho(usePathname())
  const pagina = TODAS_AS_PAGINAS.find((item) => item.caminho === atual)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Dialog.Root open={menuAberto} onOpenChange={setMenuAberto}>
        <Dialog.Trigger asChild>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Abrir menu">
            <Menu />
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_ease-out] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar shadow-2xl outline-none data-[state=open]:animate-[gaveta-in_260ms_cubic-bezier(0.22,1,0.36,1)] lg:hidden">
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Dialog.Description className="sr-only">Navegação entre as páginas</Dialog.Description>
            <ConteudoDaLateral aoNavegar={() => setMenuAberto(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <nav aria-label="Você está em" className="flex min-w-0 items-center gap-2 text-[13px]">
        <span className="hidden text-muted-foreground sm:inline">Rede Bloodell</span>
        <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden="true">
          /
        </span>
        <span className="truncate font-medium">{pagina?.rotulo ?? 'Bloodell'}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <a
          href={URL_DA_DOCUMENTACAO}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
        >
          <BookOpen />
          API
        </a>
        <AlternarTema />
        <div className="ml-2 hidden items-center gap-2.5 border-l pl-3 sm:flex">
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
            BD
          </span>
          <div className="leading-tight">
            <p className="text-xs font-medium">Demonstração</p>
            <p className="text-[11px] text-muted-foreground">Sem autenticação</p>
          </div>
        </div>
      </div>
    </header>
  )
}
