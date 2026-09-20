import type { Tom } from './tons'

/**
 * Etiqueta de status.
 *
 * Sempre com texto: a cor reforça a informação, nunca a substitui. Quem não
 * distingue as cores continua lendo o estado.
 */
export function Etiqueta({ texto, tom }: { texto: string; tom: Tom }) {
  return (
    <span className={`etiqueta etiqueta--${tom}`}>
      <span className="etiqueta__ponto" aria-hidden="true" />
      {texto}
    </span>
  )
}
