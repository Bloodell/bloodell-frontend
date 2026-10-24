import type { Metadata } from 'next'
import { PaginaDeAlgoritmos } from '@/features/algoritmos/pagina-de-algoritmos'

export const metadata: Metadata = { title: 'Estruturas de dados' }

export default function Page() {
  return <PaginaDeAlgoritmos />
}
