'use client'

import * as Menu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, LogOut, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSessao } from '@/features/autenticacao/provedor-de-sessao'
import { iniciais, podeGerenciarUsuarios, rotuloDoPerfil } from '@/features/autenticacao/sessao'

const itemDoMenu =
  'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-rotulo outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground'

/** Identidade de quem esta usando: nome e perfil reais, com saida. */
export function MenuDoUsuario() {
  const { usuario, demonstracao, sair } = useSessao()
  const router = useRouter()

  if (demonstracao) {
    return (
      <div className="flex items-center gap-2.5 pl-1">
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-apoio font-semibold">BD</span>
        <div className="hidden leading-tight sm:block">
          <p className="text-apoio font-medium">Demonstração</p>
          <p className="text-apoio text-muted-foreground">Sem autenticação</p>
        </div>
      </div>
    )
  }

  if (!usuario) return null

  function encerrar() {
    sair('manual')
    router.replace('/login')
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex h-9 items-center gap-2.5 rounded-md pr-1.5 pl-1 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Conta de ${usuario.nome}`}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-apoio font-semibold text-secondary-foreground">
          {iniciais(usuario.nome)}
        </span>
        <span className="hidden max-w-40 leading-tight sm:block">
          <span className="block truncate text-apoio font-medium">{usuario.nome}</span>
          <span className="block truncate text-apoio text-muted-foreground">{rotuloDoPerfil(usuario.perfil)}</span>
        </span>
        <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden="true" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-entrar"
        >
          <div className="px-2 py-2">
            <p className="truncate text-sm font-medium">{usuario.nome}</p>
            <p className="truncate text-apoio text-muted-foreground">{usuario.email}</p>
            <p className="mt-1.5 inline-flex rounded-md bg-muted px-1.5 py-0.5 text-apoio font-medium">
              {rotuloDoPerfil(usuario.perfil)}
            </p>
          </div>
          <Menu.Separator className="my-1 h-px bg-border" />
          {podeGerenciarUsuarios(usuario, demonstracao) && (
            <Menu.Item asChild className={itemDoMenu}>
              <Link href="/usuarios">
                <UsersRound aria-hidden="true" />
                Usuários e vínculos
              </Link>
            </Menu.Item>
          )}
          <Menu.Item className={itemDoMenu} onSelect={encerrar}>
            <LogOut aria-hidden="true" />
            Sair
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
