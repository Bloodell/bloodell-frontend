import type { Metadata } from 'next'
import { PaginaDaCadeiaFria } from '@/features/cadeia-fria/pagina-da-cadeia-fria'

export const metadata: Metadata = { title: 'Cadeia fria' }

export default function Page() {
  return <PaginaDaCadeiaFria />
}
