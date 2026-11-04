import type { Metadata } from 'next'
import { PaginaDeRastreamento } from '@/features/rastreamento/pagina-de-rastreamento'

export const metadata: Metadata = { title: 'Central logística' }

export default function Pagina() {
  return <PaginaDeRastreamento />
}
