import type { Metadata } from 'next'
import { PaginaDeDoacoes } from '@/features/doacoes/pagina-de-doacoes'

export const metadata: Metadata = { title: 'Doações' }

export default function Page() {
  return <PaginaDeDoacoes />
}
