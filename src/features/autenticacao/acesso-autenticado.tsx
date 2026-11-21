'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useSessao } from './provedor-de-sessao'

/**
 * So monta as telas que consomem dados depois do login. Sem sessao, manda
 * para /login lembrando o caminho atual (inclusive a query) para voltar.
 */
export function AcessoAutenticado({ children }: { children: ReactNode }) {
  const { estado, motivo } = useSessao()
  const router = useRouter()
  const liberado = estado === 'autenticada' || estado === 'demonstracao'

  useEffect(() => {
    if (estado !== 'anonima') return
    const atual = `${window.location.pathname}${window.location.search}`
    const parametros = new URLSearchParams({ voltar: atual })
    if (motivo === 'expirada') parametros.set('motivo', 'expirada')
    router.replace(`/login?${parametros}`)
  }, [estado, motivo, router])

  if (liberado) return <>{children}</>

  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Verificando acesso…</span>
    </div>
  )
}
