'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Script que roda antes da pintura e aplica o tema salvo (ou o do sistema),
 * para a pagina nao piscar clara antes de ficar escura.
 */
export const SCRIPT_DO_TEMA = `try{var t=localStorage.getItem('tema');if(t==='escuro'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export function AlternarTema() {
  function alternar() {
    const escuro = document.documentElement.classList.toggle('dark')
    try {
      localStorage.setItem('tema', escuro ? 'escuro' : 'claro')
    } catch {
      // Sem armazenamento (aba anonima): o tema vale so ate recarregar.
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={alternar} aria-label="Alternar tema claro/escuro">
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  )
}
