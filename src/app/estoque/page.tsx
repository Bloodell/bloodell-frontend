import type { Metadata } from 'next'
import { PaginaDeEstoque } from '@/features/estoque/pagina-de-estoque'

export const metadata: Metadata = { title: 'Estoque' }

export default function Page() {
  return <PaginaDeEstoque />
}
