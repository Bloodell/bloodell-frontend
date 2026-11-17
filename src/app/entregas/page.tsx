import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PaginaDeEntregas } from '@/features/entregas/pagina-de-entregas'

export const metadata: Metadata = { title: 'Entregas' }

export default function Page() {
  // ?entrega= e ?requisicao= so existem no navegador no export estatico.
  return (
    <Suspense>
      <PaginaDeEntregas />
    </Suspense>
  )
}
