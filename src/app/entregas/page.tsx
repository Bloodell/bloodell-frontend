import type { Metadata } from 'next'
import { PaginaDeEntregas } from '@/features/entregas/pagina-de-entregas'

export const metadata: Metadata = { title: 'Entregas' }

export default function Page() {
  return <PaginaDeEntregas />
}
