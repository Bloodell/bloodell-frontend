import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Junta classes do Tailwind resolvendo conflitos (padrao do shadcn/ui).
 * A escala tipografica do projeto (text-apoio, text-rotulo...) precisa ser
 * declarada aqui: sem isso o merge as confunde com classes de COR e descarta
 * o tamanho quando ha um text-critico, text-muted-foreground etc. ao lado.
 */
const mesclar = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['apoio', 'rotulo', 'subtitulo', 'titulo', 'metrica', 'display'] }],
    },
  },
})

export function cn(...entradas: ClassValue[]) {
  return mesclar(clsx(entradas))
}
