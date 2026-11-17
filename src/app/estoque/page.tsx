import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PaginaDeEstoque } from '@/features/estoque/pagina-de-estoque'

export const metadata: Metadata = { title: 'Estoque' }

export default function Page() {
  // ?bolsa=ID so existe no navegador no export estatico.
  return (
    <Suspense>
      <PaginaDeEstoque />
    </Suspense>
  )
}
