import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PaginaDeLogin } from '@/features/autenticacao/pagina-de-login'

export const metadata: Metadata = { title: 'Entrar' }

export default function Page() {
  // useSearchParams (voltar, motivo) so existe no navegador no export estatico.
  return (
    <Suspense>
      <PaginaDeLogin />
    </Suspense>
  )
}
