import type { Metadata } from 'next'
import { PaginaDeRequisicoes } from '@/features/requisicoes/pagina-de-requisicoes'

export const metadata: Metadata = { title: 'Requisições' }

export default function Page() {
  return <PaginaDeRequisicoes />
}
