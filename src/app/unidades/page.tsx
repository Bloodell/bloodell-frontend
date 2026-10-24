import type { Metadata } from 'next'
import { PaginaDeUnidades } from '@/features/unidades/pagina-de-unidades'

export const metadata: Metadata = { title: 'Unidades' }

export default function Page() {
  return <PaginaDeUnidades />
}
