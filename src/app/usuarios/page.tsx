import type { Metadata } from 'next'
import { PaginaDeUsuarios } from '@/features/usuarios/pagina-de-usuarios'

export const metadata: Metadata = { title: 'Usuários' }

export default function Page() {
  return <PaginaDeUsuarios />
}
